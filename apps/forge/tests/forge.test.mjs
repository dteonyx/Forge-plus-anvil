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

test("Checks warns about switches out of reach (Aleph One's 1.5 WU rule) but not recessed ones", async () => {
  const r = await app.page.evaluate(() => {
    const f = window.__forge, d0 = f.doc, WU = 1024;
    f.applySpec({ name: "Reach", environment: "lava", rooms: [
      { id: "Room", x: 0, y: 0, w: 4, h: 4, floor: 0, ceiling: 3, light: 80 },
      { id: "Recess", x: 4, y: 1.75, w: 0.5, h: 0.5, floor: 0.5, ceiling: 1, light: 80 } ], objects: [] }, false, "test");
    const d = f.doc;
    const at = (x, y) => d.polys.find((q) => { const xs = q.verts.map((v) => v.x), ys = q.verts.map((v) => v.y); return Math.min(...xs) < x * WU && Math.max(...xs) > x * WU && Math.min(...ys) < y * WU && Math.max(...ys) > y * WU; });
    const edge = (q, test) => { for (let k = 0; k < q.verts.length; k++) { const a = q.verts[k], b = q.verts[(k + 1) % q.verts.length]; if (test(a, b)) return a.id + ">" + b.id; } };
    const room = at(2, 2), rec = at(4.25, 2);
    const tall = edge(room, (a, b) => a.y === 0 && b.y === 0);
    const deep = edge(rec, (a, b) => a.x === 4.5 * WU && b.x === 4.5 * WU);
    const count = () => f.validate().filter((i) => /can't be reached/.test(i.title)).length;
    d.sides.set(tall, { full: { b: 0 }, panel: { type: 15, perm: 1, flags: 0 } });
    const onTall = count();
    d.sides.delete(tall);
    d.sides.set(deep, { full: { b: 0 }, panel: { type: 15, perm: 1, flags: 0 } });
    const inRecess = count();
    return { onTall, inRecess, found: !!(room && rec && tall && deep) };
  });
  assert.ok(r.found);
  assert.equal(r.onTall, 1, "a switch on a 3 WU tall wall is out of reach");
  assert.equal(r.inRecess, 0, "a switch at the back of a small recess is fine");
});

test("a level made for the Unreal remake can go past Aleph One's edge (FP32 chunk)", async () => {
  const r = await app.page.evaluate(() => {
    const f = window.__forge, WU = 1024;
    const spec = f.randomSpec(7, "medium", "solo");
    f.applySpec(spec, false, "test");
    const d = f.doc;
    const tags = (file) => Object.keys(f.parseWad(file.buffer.slice(0)).levels[0].chunks);
    const build = (x) => f.buildWadFile(f.buildMapChunks(x).chunks, "Big", 1);
    const before = tags(build(d));
    // move everything 50 WU east and lift the first room 40 WU
    const DX = 50 * WU;
    for (const p of d.pts) p.x += DX;
    for (const o of d.objs) o.x += DX;
    for (const n of d.notes || []) n.x += DX;
    d.polys[0].floor += 40 * WU; d.polys[0].ceil += 40 * WU;
    const errAleph = f.validate().filter((i) => i.lv === "error").map((i) => i.title);
    d.info.target = "unreal";
    const unrealIssues = f.validate().map((i) => `${i.lv}: ${i.title}`);
    const a = build(d);
    const back = f.levelToDoc(f.parseWad(a.buffer.slice(0)).levels[0]).doc;
    const b = build(back);
    return {
      before, after: tags(a), errAleph, unrealIssues,
      target: back.info.target,
      maxX: Math.max(...back.pts.map((p) => p.x)), wantMaxX: Math.max(...d.pts.map((p) => p.x)),
      objX: back.objs.map((o) => o.x).join(), wantObjX: d.objs.map((o) => o.x).join(),
      floor0: back.polys[0].floor, wantFloor0: d.polys[0].floor,
      same: a.length === b.length && a.every((v, i) => v === b[i]),
    };
  });
  assert.ok(!r.before.includes("FP32"), "a level that fits has no extra chunk");
  assert.ok(r.after.includes("FP32"));
  assert.deepEqual(r.errAleph, [], "Aleph One levels only get warnings (the over-the-limit test stays possible)");
  assert.ok(r.unrealIssues.includes("warn: Won't play in Aleph One or Alpha One"));
  assert.ok(!r.unrealIssues.some((t) => t.startsWith("error")), r.unrealIssues.join("; "));
  assert.equal(r.target, "unreal");
  assert.ok(r.maxX > 32767);
  assert.equal(r.maxX, r.wantMaxX);
  assert.equal(r.objX, r.wantObjX);
  assert.equal(r.floor0, r.wantFloor0);
  assert.ok(r.same, "big level saves, reopens and saves byte-identical");
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
  await page.selectOption("#spType", "1");
  await page.fill("#spMax", "4"); await page.dispatchEvent("#spMax", "change");
  await page.check("#spInf");
  await page.fill("#spCh", "40"); await page.dispatchEvent("#spCh", "change");
  await page.click("#dialog footer >> text=Save");
  const r = await page.evaluate(() => { const f = window.__forge; const u = f.buildMapChunks(f.doc).chunks.find((c) => c[0] === "plac")[1];
    const v = new DataView(u.buffer, u.byteOffset, u.byteLength); const o = 1 * 12; return [0, 2, 4, 6, 8, 10].map((k) => v.getInt16(o + k)); });
  assert.equal(r[1], placed); assert.equal(r[3], 4); assert.equal(r[4], -1); assert.equal(Math.round(((r[5] & 0xffff) * 100) / 65535), 40);
});

// A tiny made-up Shapes file: a Water wall set (collection 17) with 3 textures, a Lava set (18) with 2, and a Daytime landscape (collection 27) with 2.
function tinyShapes() {
  const sets = { 17: { type: 1, n: 3, w: 4, h: 4 }, 18: { type: 1, n: 2, w: 4, h: 4 }, 27: { type: 4, n: 2, w: 8, h: 4 } };
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

  // the surface dialog's picker offers the sky in its Set menu
  await page.evaluate(() => { const f = window.__forge; f.openSurfaceDialog({ kind: "ceil", poly: f.doc.polys[0] }); });
  await page.locator("#dialog .texpick").first().click();
  await page.selectOption("#texSet", "27");
  assert.equal(await page.locator("#texPickGrid .texbtn").count(), 2);
  await page.locator("#texPickGrid .texbtn").nth(1).click();
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
  assert.equal(await page.inputValue("#texSet"), "27", "the picker opens on the surface's own set");
  await page.selectOption("#texSet", "");
  await page.locator("#texPickGrid .texbtn").nth(2).click();
  assert.equal(await page.locator("#sfXfer").inputValue(), "0");
  await page.locator("#dialog button", { hasText: "Apply" }).click();
  assert.deepEqual(await page.evaluate(() => { const q = window.__forge.doc.polys[0]; return [q.ctex, q.ccol ?? null, q.cxfer]; }), [2, null, 0]);

  await page.evaluate(() => window.__forge.removeShapes("inf"));
  assert.deepEqual(errors, []);
});

test("any texture set can be used on any level, and it survives export", async () => {
  const { page, errors } = app;
  await page.evaluate(async (bytes) => {
    const f = window.__forge;
    f.setDoc(f.newDoc("inf"));
    f.applySpec(f.sampleSpec(), false, "test");
    f.doc.info.env = 0;
    await f.installShapes("inf", "tiny", new Uint8Array(bytes).buffer, false);
  }, tinyShapes());
  // the Set menu lists this level's set first, then the other wall sets in the Shapes file, then every sky in it
  await page.evaluate(() => { const f = window.__forge; f.openSurfaceDialog({ kind: "floor", poly: f.doc.polys[0] }); });
  await page.locator("#dialog .texpick").first().click();
  const opts = await page.$$eval("#texSet option", (os) => os.map((o) => [o.value, o.textContent]));
  assert.deepEqual(opts.map((o) => o[0]), ["", "18", "27"]);
  assert.match(opts[2][1], /^Sky: /);
  assert.match(opts[0][1], /this level/);
  await page.selectOption("#texSet", "18");
  assert.equal(await page.locator("#texPickGrid .texbtn").count(), 2);
  await page.locator("#texPickGrid .texbtn").nth(1).click();
  assert.equal(await page.locator("#sfXfer").inputValue(), "0", "another wall set is not sky");
  await page.locator("#dialog button", { hasText: "Apply" }).click();
  const q = await page.evaluate(() => { const q = window.__forge.doc.polys[0]; return { ftex: q.ftex, fcol: q.fcol, fxfer: q.fxfer }; });
  assert.deepEqual(q, { ftex: 1, fcol: 18, fxfer: 0 });
  // the floor exports with the Lava collection and comes back the same; the level's own set is stored without one
  const back = await page.evaluate(() => {
    const f = window.__forge;
    const a = f.buildWadFile(f.buildMapChunks(f.doc).chunks, "Test", 1);
    const d = f.levelToDoc(f.parseWad(a.buffer.slice(0)).levels[0]).doc;
    return { ftex: d.polys[0].ftex, fcol: d.polys[0].fcol, other: d.polys[1].fcol ?? null };
  });
  assert.deepEqual(back, { ftex: 1, fcol: 18, other: null });
  await page.evaluate(() => window.__forge.removeShapes("inf"));
  assert.deepEqual(errors, []);
});

test("a texture drag's run follows touching pieces with the same texture, around corners", async () => {
  const r = await app.page.evaluate(() => {
    const f = window.__forge;
    f.setDoc(f.newDoc("inf"));
    f.buildFromSpec({ name: "Run", environment: "water", rooms: [
      { id: "A", x: 0, y: 0, w: 4, h: 4, floor: 0, ceiling: 2, wallTex: 5, floorTex: 6 },
      { id: "B", x: 4, y: 0, w: 3, h: 4, floor: 0, ceiling: 2, wallTex: 5, floorTex: 6 },
      { id: "C", x: 7, y: 0, w: 3, h: 4, floor: 0, ceiling: 2, wallTex: 8, floorTex: 9 } ], objects: [] }, { replace: true });
    const d = f.doc, WU = 1024;
    const qa = d.polys.find((q) => q.verts.every((v) => v.x <= 4 * WU));
    const k = qa.verts.findIndex((v, i) => { const w = qa.verts[(i + 1) % qa.verts.length]; return v.y === 0 && w.y === 0; });
    const run = f.wallRun(qa, qa.verts[k], qa.verts[(k + 1) % qa.verts.length], "full");
    const p = (v) => `${v.x / WU},${v.y / WU}`;
    return { run: run.map((m) => `${p(m.a)}>${p(m.b)}`), floors: f.flatRun(qa, "f").length };
  });
  // the outline of A and B (texture 5), in order around the corners; the wall shared by A and B isn't visible,
  // and C (texture 8) stops the run
  assert.deepEqual(r.run, ["7,4>4,4", "4,4>0,4", "0,4>0,0", "0,0>4,0", "4,0>7,0"]);
  assert.equal(r.floors, 2, "A and B share floor texture 6; C has 9");
});

test("crossing lines don't cut each other, so polygons can overlap (Forge's 5D space)", async () => {
  const { page } = app;
  const r = await page.evaluate(() => {
    const f = window.__forge, W = 1024;
    f.setDoc(f.newDoc("inf"));
    const A = f.makePolygonFromCoords([{ x: 0, y: 0 }, { x: 4 * W, y: 0 }, { x: 4 * W, y: 4 * W }, { x: 0, y: 4 * W }], null);
    // a second shape drawn across A, as in Bungie's Forge tutorial 2
    const P = [[2, -2], [6, -2], [6, 2], [2, 2]].map(([x, y]) => f.addPointAt(x * W, y * W, 1));
    for (let i = 0; i < 4; i++) f.addSegment(P[i], P[(i + 1) % 4]);
    const lines = f.doc.lines.length, corners = A.verts.length;
    const fill = f.fillAt(3 * W, 1 * W); // inside both shapes
    const again = f.fillAt(1 * W, 1 * W); // only inside A
    // an object keeps the polygon it was saved in, even where two polygons overlap
    f.doc.objs.push({ kind: 2, sub: 1, x: 3 * W, y: 1 * W, z: 0, facing: 0, flags: 0, pi: 0 });
    const lv = f.levelToDoc(f.parseWad(f.buildWadFile(f.buildMapChunks(f.doc).chunks, "t").buffer.slice(0)).levels[0]);
    return { lines, corners, filled: !!fill.poly, again: again.err, polys: f.doc.polys.length, objPoly: lv.doc.objs.find((o) => o.kind === 2).pi };
  });
  assert.equal(r.lines, 8, "no points added where the lines cross");
  assert.equal(r.corners, 4);
  assert.ok(r.filled, "the overlapping shape fills");
  assert.equal(r.again, "That loop is already a polygon.");
  assert.equal(r.polys, 2);
  assert.equal(r.objPoly, 0, "the item stays in polygon 0, not the overlapping one");
});

test("a door made in Forge+ exports with a texture on the walls that face it (its closed face)", async () => {
  const { page } = app;
  const r = await page.evaluate(() => {
    const f = window.__forge, W = 1024;
    f.setDoc(f.newDoc("inf"));
    const mk = (cs, fl, ce) => { const q = f.makePolygonFromCoords(cs.map(([x, y]) => ({ x: x * W, y: y * W })), null); q.floor = fl * W; q.ceil = ce * W; return q; };
    mk([[0, 0], [4, 0], [4, 4], [0, 4]], 0, 2);
    const D = mk([[4, 1.5], [4.5, 1.5], [4.5, 2.5], [4, 2.5]], 0, 2); // stored open, as Forge+ keeps doors
    mk([[4.5, 0], [8.5, 0], [8.5, 4], [4.5, 4]], 0, 2);
    const B = (n) => 1 << n;
    D.type = 5; D.plat = { type: 0, speed: 34, delay: 120, min: -1, max: -1, flags: B(1) | B(3) | B(5) | B(7) | B(13) | B(14) | B(15) | B(26), tag: 0 };
    f.doc.objs.push({ kind: 3, sub: 0, x: 1 * W, y: 2 * W, z: 0, facing: 0, flags: 0 });
    const di = f.doc.polys.indexOf(D);
    const c = Object.fromEntries(f.buildMapChunks(f.doc).chunks.map(([t, x]) => [t, new DataView(x.buffer, x.byteOffset, x.byteLength)]));
    const S = c.SIDS, L = c.LINS, out = [];
    for (let i = 0; i < S.byteLength / 64; i++) {
      const o = i * 64, tex = S.getUint16(o + 8), poly = S.getInt16(o + 48), line = S.getInt16(o + 50);
      const cw = L.getInt16(line * 32 + 16), ccw = L.getInt16(line * 32 + 18);
      if (poly !== di && (cw === di || ccw === di)) out.push({ tex, t: S.getInt16(o) });
    }
    return out;
  });
  assert.equal(r.length, 2, "both rooms have a side facing the door");
  for (const { tex, t } of r) {
    assert.notEqual(tex, 0xffff, "the door's closed face has a texture");
    assert.equal(t, 1, "a high side, like Aleph One gives it: covers the doorway when shut, the lintel when open");
  }
});
