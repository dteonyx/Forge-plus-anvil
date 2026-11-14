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

test("Huge maps fill most of the map, and deathmatch maps stay smaller", async () => {
  const r = await app.page.evaluate(() => {
    const f = window.__forge;
    const size = (mode) => {
      f.applySpec(f.randomSpec(31337, "huge", mode), false, "test");
      const xs = f.doc.pts.map((p) => p.x / 1024), ys = f.doc.pts.map((p) => p.y / 1024);
      const fl = f.doc.polys.map((q) => q.floor / 1024);
      return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), climb: Math.max(...fl) - Math.min(...fl), errors: f.validate().filter((i) => i.lv === "error").length };
    };
    return { solo: size("extraction"), net: size("carnage") };
  });
  assert.ok(r.solo.w > 50 && r.solo.h > 50, `huge solo map spans ${r.solo.w.toFixed(1)} x ${r.solo.h.toFixed(1)} WU`);
  assert.ok(r.solo.climb >= 4, "huge maps climb");
  assert.ok(r.net.w < r.solo.w && r.net.h < r.solo.h, "deathmatch maps are smaller than solo maps");
  assert.equal(r.solo.errors + r.net.errors, 0);
});

// A tiny made-up Shapes file: a Water wall set (collection 17) with 3 textures and a Daytime landscape (collection 27) with 2.
function tinyShapes() {
  const sets = { 17: { type: 1, n: 3, w: 4, h: 4 }, 27: { type: 4, n: 2, w: 8, h: 4 } };
  const blobs = {};
  for (const [ci, c] of Object.entries(sets)) {
    const bmSize = 26 + (c.h + 1) * 4 + c.w * c.h;
    const ctOff = 64, llTab = ctOff + 16, llDefs = llTab + c.n * 4, bmTab = llDefs + c.n * 16, bms = bmTab + c.n * 4;
    const buf = new DataView(new ArrayBuffer(bms + c.n * bmSize));
    buf.setInt16(2, c.type); buf.setInt16(6, 2); buf.setInt16(8, 1); buf.setInt32(10, ctOff);
    buf.setInt16(20, c.n); buf.setInt32(22, llTab); buf.setInt16(26, c.n); buf.setInt32(28, bmTab);
    buf.setUint16(ctOff + 8 + 2, 0xffff); // colour 1 is white
    for (let i = 0; i < c.n; i++) {
      buf.setInt32(llTab + i * 4, llDefs + i * 16); buf.setInt16(llDefs + i * 16 + 6, i);
      const b = bms + i * bmSize; buf.setInt32(bmTab + i * 4, b);
      buf.setInt16(b, c.w); buf.setInt16(b + 2, c.h); buf.setInt16(b + 4, c.w);
      for (let k = 0; k < c.w * c.h; k++) buf.setUint8(b + 26 + (c.h + 1) * 4 + k, k & 1);
    }
    blobs[ci] = new Uint8Array(buf.buffer);
  }
  let off = 1024; const parts = []; const head = new DataView(new ArrayBuffer(1024));
  for (const [ci, b] of Object.entries(blobs)) { head.setInt32(ci * 32 + 4, off); head.setInt32(ci * 32 + 8, b.length); parts.push(b); off += b.length; }
  const out = new Uint8Array(off + 64); out.set(new Uint8Array(head.buffer), 0);
  let p = 1024; for (const b of parts) { out.set(b, p); p += b.length; }
  return [...out];
}

test("landscape (sky) textures show in the texture picker and paint as sky", async () => {
  const { page, errors } = app;
  await page.evaluate(async (bytes) => {
    const f = window.__forge;
    f.setDoc(f.newDoc("inf"));
    f.applySpec(f.sampleSpec(), false, "test");
    f.doc.info.env = 0; f.doc.info.landscape = 0;
    await f.installShapes("inf", "tiny", new Uint8Array(bytes).buffer, false);
  }, tinyShapes());
  assert.deepEqual(await page.evaluate(() => [window.__forge.texCount(), window.__forge.landCount(), window.__forge.landCol()]), [3, 2, 27]);

  // the surface dialog's picker lists the sky textures after the wall set
  await page.evaluate(() => { const f = window.__forge; f.openSurfaceDialog({ kind: "ceil", poly: f.doc.polys[0] }); });
  await page.locator("#dialog .texpick").first().click();
  assert.equal(await page.locator("#texPickSky .texbtn").count(), 2);
  await page.locator("#texPickSky .texbtn").nth(1).click();
  assert.equal(await page.locator("#sfXfer").inputValue(), "9", "picking a sky texture sets Landscape mode");
  await page.locator("#dialog button", { hasText: "Apply" }).click();
  const q = await page.evaluate(() => { const q = window.__forge.doc.polys[0]; return { ctex: q.ctex, ccol: q.ccol, cxfer: q.cxfer }; });
  assert.deepEqual(q, { ctex: 1, ccol: 27, cxfer: 9 });

  // it exports as a landscape texture and comes back the same
  const back = await page.evaluate(() => {
    const f = window.__forge;
    const a = f.buildWadFile(f.buildMapChunks(f.doc).chunks, "Test", 1);
    const q = f.levelToDoc(f.parseWad(a.buffer.slice(0)).levels[0]).doc.polys[0];
    return { ctex: q.ctex, ccol: q.ccol, cxfer: q.cxfer };
  });
  assert.deepEqual(back, { ctex: 1, ccol: 27, cxfer: 9 });

  // picking a wall texture again takes the sky off
  await page.evaluate(() => { const f = window.__forge; f.openSurfaceDialog({ kind: "ceil", poly: f.doc.polys[0] }); });
  await page.locator("#dialog .texpick").first().click();
  await page.locator("#dialog .texbtn").nth(2).click();
  assert.equal(await page.locator("#sfXfer").inputValue(), "0");
  await page.locator("#dialog button", { hasText: "Apply" }).click();
  assert.deepEqual(await page.evaluate(() => { const q = window.__forge.doc.polys[0]; return [q.ctex, q.ccol ?? null, q.cxfer]; }), [2, null, 0]);

  await page.evaluate(() => window.__forge.removeShapes("inf"));
  assert.deepEqual(errors, []);
});
