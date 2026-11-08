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

// Any folder of Marathon maps (for example the levels on the original Infinity disc). Each must import and round-trip.
test("every map in MARATHON_MAPS_DIR round-trips byte-identical", { skip: !process.env.MARATHON_MAPS_DIR }, async () => {
  const dir = process.env.MARATHON_MAPS_DIR;
  for (const name of fs.readdirSync(dir)) {
    const b64 = fs.readFileSync(`${dir}/${name}`).toString("base64");
    const r = await app.page.evaluate((b64) => {
      const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const f = window.__forge; let w;
      try { w = f.parseWad(u.buffer); } catch (e) { return { skipped: String(e) }; }
      if (!w.levels || !w.levels.length) return { skipped: "no levels" };
      f.openWholeMap(w, w.levels, "a");
      const all = () => f.scenario.levels.map((_, i) => i);
      const ex1 = f.buildScenarioFile(all()); w = f.parseWad(ex1.file.buffer.slice(0)); f.openWholeMap(w, w.levels, "b");
      const ex2 = f.buildScenarioFile(all());
      const skip = (i) => (i >= 91 && i < 99) || i === 124 || i === 125;
      // the light editor reads and writes every light record exactly
      const lightsExact = f.scenario.levels.every((L) => (L.doc.lights || []).every((b) => f.encodeLight(f.decodeLight(b)) === b));
      return { levels: f.scenario.levels.length, lightsExact, same: ex1.file.length === ex2.file.length && ex1.file.every((v, i) => skip(i) || v === ex2.file[i]) };
    }, b64);
    if (!r.skipped) assert.ok(r.lightsExact, `${name}: light records`);
    if (r.skipped) { console.log(`# ${name}: not a map (${r.skipped})`); continue; }
    console.log(`# ${name}: ${r.levels} level(s), ${r.same ? "identical" : "DIFFERENT"}`);
    assert.ok(r.same, name);
  }
});

// Forge-style palettes: pick a value, click polygons to paint it, Alt-click to pick a value up.
test("palette painting sets heights, types and liquids, and Alt-click picks up a value", async () => {
  const { page } = app;
  await page.evaluate(() => { const f = window.__forge; f.buildFromSpec(f.sampleSpec ? f.sampleSpec() : undefined, { replace: true }); document.getElementById("modal").hidden = true; f.fitView(); });
  const pts = await page.evaluate(() => { const f = window.__forge; return f.doc.polys.slice(0, 3).map((q) => { const c = f.centroid(q.verts); return f.screenOf(c.x, c.y); }); });
  await page.keyboard.press("Escape");
  await page.keyboard.press("3"); // floor view
  await page.evaluate(() => window.__forge.armPaint("floor", 768));
  await page.mouse.click(pts[0].x, pts[0].y);
  let r = await page.evaluate(() => window.__forge.doc.polys[0].floor);
  assert.equal(r, 768);
  // Alt-click another polygon picks up its height and arms it
  await page.keyboard.down("Alt"); await page.mouse.click(pts[1].x, pts[1].y); await page.keyboard.up("Alt");
  r = await page.evaluate(() => ({ armed: window.__forge.vpaint.value, h: window.__forge.doc.polys[1].floor }));
  assert.equal(r.armed, r.h);
  // undo puts the first height back
  await page.keyboard.press("Control+z");
  assert.notEqual(await page.evaluate(() => window.__forge.doc.polys[0].floor), 768);
  // type and liquid palettes
  await page.keyboard.press("6"); await page.evaluate(() => window.__forge.armPaint("type", 2));
  await page.mouse.click(pts[2].x, pts[2].y);
  assert.equal(await page.evaluate(() => window.__forge.doc.polys[2].type), 2);
  await page.keyboard.press("7"); await page.evaluate(() => window.__forge.armPaint("liquid", { type: 1, low: 0, high: 256, dir: 0, speed: 0, flags: 0 }));
  await page.mouse.click(pts[2].x, pts[2].y);
  assert.equal(await page.evaluate(() => window.__forge.doc.polys[2].media.type), 1);
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => window.__forge.vpaint), null);
  assert.deepEqual(app.errors, []);
});

test("light table: lights encode exactly, paint onto rooms and walls, and export", async () => {
  const r = await app.page.evaluate(() => {
    const f = window.__forge; const d = f.doc;
    const L = f.LIGHT_PRESETS.strobe.make(0.8); const i = f.addTableLight(L);
    const same = f.encodeLight(f.decodeLight(d.lights[i])) === d.lights[i];
    f.setViewMode("light"); f.applyPaint(d.polys[0], "light", { t: i });
    const { chunks } = f.buildMapChunks(d); const get = (t) => chunks.find((c) => c[0] === t)[1];
    const dv = (u) => new DataView(u.buffer, u.byteOffset, u.byteLength);
    const poly = dv(get("POLY")); const floorLight = poly.getInt16(48), ceilLight = poly.getInt16(50);
    const sids = dv(get("SIDS")); const wallLights = [];
    for (let o = 0; o + 64 <= sids.byteLength; o += 64) if (sids.getInt16(o + 48) === 0) wallLights.push(sids.getInt16(o + 52));
    const lite = dv(get("LITE")); const strobeType = lite.getInt16(i * 100);
    // and round-trip
    const a = f.buildWadFile(chunks, "T", 1); const b = f.buildWadFile(f.buildMapChunks(f.levelToDoc(f.parseWad(a.buffer.slice(0)).levels[0]).doc).chunks, "T", 1);
    return { same, i, floorLight, ceilLight, wallLights, strobeType, rt: a.length === b.length && a.every((v, k) => v === b[k]) };
  });
  assert.ok(r.same);
  assert.equal(r.floorLight, r.i); assert.equal(r.ceilLight, r.i);
  assert.ok(r.wallLights.length && r.wallLights.every((l) => l === r.i));
  assert.equal(r.strobeType, 1);
  assert.ok(r.rt);
});

test("spawn table edits reach the exported map", async () => {
  const { page } = app;
  const placed = await page.evaluate(() => { const f = window.__forge; const d = f.doc; const q = d.polys[0]; const c = f.centroid(q.verts);
    d.objs.push({ kind: 2, sub: 1, x: Math.round(c.x), y: Math.round(c.y), z: 0, facing: 0, flags: 0 }); f.openSpawnTable("items"); return 1; });
  await page.fill("#spitems1_3", "4"); await page.dispatchEvent("#spitems1_3", "change");
  await page.check("#spitems1_inf");
  await page.fill("#spitems1_ch", "40"); await page.dispatchEvent("#spitems1_ch", "change");
  await page.click("#dialog footer >> text=Save");
  const r = await page.evaluate(() => { const f = window.__forge; const u = f.buildMapChunks(f.doc).chunks.find((c) => c[0] === "plac")[1];
    const v = new DataView(u.buffer, u.byteOffset, u.byteLength); const o = 1 * 12; return [0, 2, 4, 6, 8, 10].map((k) => v.getInt16(o + k)); });
  assert.equal(r[1], placed); assert.equal(r[3], 4); assert.equal(r[4], -1); assert.equal(Math.round(((r[5] & 0xffff) * 100) / 65535), 40);
});
