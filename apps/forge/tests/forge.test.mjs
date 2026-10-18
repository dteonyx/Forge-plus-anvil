import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { openForge } from "./support/browser.mjs";

let app;
before(async () => { app = await openForge(); });
after(async () => { await app?.close(); });

test("editor starts without errors", async () => {
  const { page, errors } = app;
  assert.equal(await page.title(), "Forge Remake");
  assert.ok(await page.locator("#tools button").count() >= 7, "tool rail is drawn");
  assert.deepEqual(errors, []);
});

test("Extraction map from a fixed seed passes every check", async () => {
  const r = await app.page.evaluate(() => {
    const f = window.__forge;
    const spec = f.randomSpec(2026, "medium", "extraction");
    spec.environment = "jjaro";
    f.applySpec(spec, false, "test");
    const d = f.doc;
    const P = f.texPalette("inf", d.info.env);
    return {
      issues: f.validate().map((i) => `${i.lv}: ${i.title}`),
      players: d.objs.filter((o) => o.kind === 3).length,
      monsters: d.objs.filter((o) => o.kind === 0).length,
      extract: d.notes.filter((n) => n.text === "EXTRACT").length,
      gen: d.notes.find((n) => /^GEN /.test(n.text))?.text,
      special: d.polys.flatMap((q) => [q.wtex, q.ftex, q.ctex]).filter((t) => P.special[t] != null),
      coop: !!(d.info.entry & 2),
    };
  });
  assert.deepEqual(r.issues, []);
  assert.equal(r.players, 4);
  assert.ok(r.monsters > 0);
  assert.ok(r.extract >= 2);
  assert.match(r.gen, /^GEN seed=2026 gen=\d+\.\d+ size=medium$/);
  assert.deepEqual(r.special, [], "no switches, terminals, chargers or liquids as textures");
  assert.ok(r.coop);
});

test("exported map re-imports and re-exports byte-identical", async () => {
  const same = await app.page.evaluate(() => {
    const f = window.__forge;
    const build = (d) => f.buildWadFile(f.buildMapChunks(d).chunks, "Test", 1);
    const a = build(f.doc);
    const b = build(f.levelToDoc(f.parseWad(a.buffer.slice(0)).levels[0]).doc);
    return a.length === b.length && a.every((v, i) => v === b[i]);
  });
  assert.ok(same);
});

test("outside claude.ai, Export saves the .sceA file directly", async () => {
  const { page } = app;
  const [dl] = await Promise.all([page.waitForEvent("download"), page.evaluate(() => window.__forge.doExport(false))]);
  assert.match(dl.suggestedFilename(), /\.sceA$/);
});

// Bungie's own Infinity map can't live in the repo. Point MARATHON_MAP at your Map.sceA to run this one.
test("Bungie's Infinity map round-trips byte-identical", { skip: !process.env.MARATHON_MAP }, async () => {
  const b64 = fs.readFileSync(process.env.MARATHON_MAP).toString("base64");
  const r = await app.page.evaluate((b64) => {
    const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const f = window.__forge; let w = f.parseWad(u.buffer); f.openWholeMap(w, w.levels, "Map.sceA");
    const all = () => f.scenario.levels.map((_, i) => i);
    const ex1 = f.buildScenarioFile(all()); w = f.parseWad(ex1.file.buffer.slice(0)); f.openWholeMap(w, w.levels, "re");
    const ex2 = f.buildScenarioFile(all());
    // MacBinary header bytes 91-98 hold the created/modified dates and 124-125 the header CRC; those change with the clock.
    const skip = (i) => (i >= 91 && i < 99) || i === 124 || i === 125;
    return { levels: f.scenario.levels.length, same: ex1.file.length === ex2.file.length && ex1.file.every((v, i) => skip(i) || v === ex2.file[i]) };
  }, b64);
  assert.ok(r.levels > 0);
  assert.ok(r.same);
});

// "Generate with Claude" outside claude.ai: the user's own API key, with Anthropic's API faked here.
function sse(text) {
  const ev = (o) => `event: ${o.type}\ndata: ${JSON.stringify(o)}\n\n`;
  const chunks = text.match(/.{1,40}/gs).map((t) => ev({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: t } }));
  return ev({ type: "message_start", message: {} }) + chunks.join("") + ev({ type: "message_stop" });
}

test("Generate with Claude works with your own API key", async () => {
  const { page } = app;
  const spec = { name: "Key Test", environment: "water", landscape: "day", mode: "solo",
    rooms: [{ id: "A", x: 0, y: 0, w: 4, h: 4, floor: 0, ceiling: 2, light: 80 }, { id: "B", x: 4, y: 1, w: 3, h: 2, floor: 0, ceiling: 2, light: 70 }],
    objects: [{ kind: "player", room: "A", dx: 0.5, dy: 0.5, facing: 0 }] };
  let seen = null;
  await page.route("https://api.anthropic.com/v1/messages", async (route) => {
    const req = route.request();
    seen = { headers: req.headers(), body: JSON.parse(req.postData()) };
    if (seen.headers["x-api-key"] === "bad") return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } }) });
    await route.fulfill({ status: 200, contentType: "text/event-stream", body: sse(JSON.stringify(spec)) });
  });

  await page.evaluate(() => window.__forge.openGenerate());
  assert.ok(await page.locator("#modal").getByRole("button", { name: /^Generate with / }).isDisabled(), "disabled until a key is added");

  // a bad key gives a clear message
  await page.click("#genKey");
  await page.selectOption("#apiProvider", "anthropic");
  await page.fill("#apiKeyIn", "bad");
  await page.locator("#modal").getByRole("button", { name: "Save", exact: true }).click();
  await page.fill("#genPrompt", "two small rooms");
  await page.locator("#modal").getByRole("button", { name: "Generate with Claude" }).click();
  await page.waitForFunction(() => /didn't accept the API key/.test(document.getElementById("genOut")?.textContent || ""));

  // a good key builds the level, and the prompt typed earlier survives the key dialog
  await page.click("#genKey");
  await page.fill("#apiKeyIn", "sk-ant-test");
  await page.locator("#modal").getByRole("button", { name: "Save", exact: true }).click();
  assert.equal(await page.inputValue("#genPrompt"), "two small rooms");
  await page.locator("#modal").getByRole("button", { name: "Generate with Claude" }).click();
  await page.waitForFunction(() => window.__forge.doc.info.name === "Key Test");

  assert.equal(seen.headers["x-api-key"], "sk-ant-test");
  assert.equal(seen.headers["anthropic-dangerous-direct-browser-access"], "true");
  assert.equal(seen.body.model, "claude-sonnet-5-5");
  assert.equal(seen.body.stream, true);
  const polys = await page.evaluate(() => window.__forge.doc.polys.length);
  assert.ok(polys >= 2);
  await page.evaluate(() => localStorage.clear());
});

test("Generate with Gemini works with a Gemini API key", async () => {
  const { page } = app;
  const spec = { name: "Gemini Test", environment: "lava", landscape: "night", mode: "solo",
    rooms: [{ id: "A", x: 0, y: 0, w: 4, h: 4, floor: 0, ceiling: 2, light: 80 }, { id: "B", x: 4, y: 1, w: 3, h: 2, floor: 0, ceiling: 2, light: 70 }],
    objects: [{ kind: "player", room: "A", dx: 0.5, dy: 0.5, facing: 0 }] };
  let seen = null;
  await page.route(/generativelanguage\.googleapis\.com/, async (route) => {
    const req = route.request();
    seen = { url: req.url(), headers: req.headers(), body: JSON.parse(req.postData()) };
    const json = JSON.stringify(spec), half = Math.floor(json.length / 2);
    const ev = (parts) => `data: ${JSON.stringify({ candidates: [{ content: { role: "model", parts } }] })}\r\n\r\n`;
    // a "thought" part (thinking models) must be ignored; the answer arrives in two chunks
    const body = ev([{ text: "planning the rooms", thought: true }]) + ev([{ text: json.slice(0, half) }]) + ev([{ text: json.slice(half) }]);
    await route.fulfill({ status: 200, contentType: "text/event-stream", body });
  });
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => window.__forge.openGenerate());
  await page.click("#genKey");
  assert.equal(await page.inputValue("#apiProvider"), "gemini", "Gemini (free tier) is the default for new users");
  await page.fill("#apiKeyIn", "AIza-test");
  await page.locator("#modal").getByRole("button", { name: "Save", exact: true }).click();
  await page.fill("#genPrompt", "two rooms over lava");
  await page.locator("#modal").getByRole("button", { name: "Generate with Gemini" }).click();
  await page.waitForFunction(() => window.__forge.doc.info.name === "Gemini Test");

  assert.match(seen.url, /\/v1beta\/models\/gemini-3\.8-flash:streamGenerateContent\?alt=sse$/);
  assert.equal(seen.headers["x-goog-api-key"], "AIza-test");
  assert.equal(seen.body.generationConfig.responseMimeType, "application/json");
  assert.match(seen.body.contents[0].parts[0].text, /two rooms over lava/);
  assert.ok(await page.evaluate(() => window.__forge.doc.polys.length) >= 2);
  await page.evaluate(() => localStorage.clear());
});
