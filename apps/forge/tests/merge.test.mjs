// "Add a map to this map": merging one level into another.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { openForge } from "./support/browser.mjs";

let app;
before(async () => { app = await openForge(); });
after(async () => { await app?.close(); });

// Summary of a level after export → re-import, so the checks see what Aleph One would load.
const SUMMARY = `(d) => {
  const f = window.__forge;
  const bytes = f.buildWadFile(f.buildMapChunks(d).chunks, "Merge", 1);
  const back = f.levelToDoc(f.parseWad(bytes.buffer.slice(0)).levels[0]).doc;
  const again = f.buildWadFile(f.buildMapChunks(back).chunks, "Merge", 1);
  const n = back.polys.length;
  return {
    polys: n, objs: back.objs.length, starts: back.objs.filter((o) => o.kind === 3).length,
    plats: back.polys.filter((q) => q.type === 5).length,
    terms: (back.terms || []).length, lights: (back.lights || []).length,
    badPolyRefs: back.polys.filter((q) => [7, 9, 10].includes(q.type) && q.perm >= n).length,
    teleTargets: back.polys.filter((q) => q.type === 10 && q.perm >= 0).map((q) => q.perm),
    stable: bytes.length === again.length && bytes.every((v, i) => v === again[i]),
  };
}`;

test("a generated map merges into another: moved, turned, raised, and it exports", async () => {
  const r = await app.page.evaluate((SUMMARY) => {
    const f = window.__forge;
    const sum = eval(SUMMARY);
    f.applySpec(f.randomSpec(11, "small", "solo"), false, "a");
    const A = f.doc;
    f.applySpec(f.randomSpec(22, "small", "carnage"), false, "b");
    const B = f.doc;
    f.setDoc(A);
    const nA = A.polys.length, nB = B.polys.length, oA = A.objs.length, oB = B.objs.length;
    const floorB = B.polys[0].floor;
    const xs = B.pts.map((p) => p.x), ys = B.pts.map((p) => p.y);
    const P = { cx: 0, cy: 0, tx: 20 * 1024, ty: 0, dz: 512, rot: 1 };
    const p0 = { x: B.pts[0].x, y: B.pts[0].y };
    const firstB = B.polys[0];
    f.mergeInto(A, B, P, { entry: "both" });
    return {
      nA, nB, oA, oB, after: A.polys.length, objs: A.objs.length,
      raised: firstB.floor - floorB,
      turned: [B.pts[0].x, B.pts[0].y], expect: [20 * 1024 - p0.y, p0.x],
      issues: f.validate().filter((i) => i.lv === "error").map((i) => i.title),
      s: sum(A),
    };
  }, SUMMARY);
  assert.equal(r.after, r.nA + r.nB);
  assert.equal(r.objs, r.oA + r.oB);
  assert.equal(r.raised, 512);
  assert.deepEqual(r.turned, r.expect);
  assert.deepEqual(r.issues, []);
  assert.equal(r.s.polys, r.nA + r.nB);
  assert.equal(r.s.badPolyRefs, 0);
  assert.ok(r.s.stable, "merged map exports the same after a re-import");
});

test("merge asks about level settings that differ, and the choice sticks", async () => {
  const r = await app.page.evaluate(() => {
    const f = window.__forge;
    f.applySpec(f.randomSpec(5, "small", "solo"), false, "a");
    const A = f.doc; A.info.env = 0; A.info.landscape = 0;
    f.applySpec(f.randomSpec(6, "small", "solo"), false, "b");
    const B = f.doc; B.info.env = 2; B.info.landscape = 3; B.info.envFlags = 8;
    f.setDoc(A);
    f.startPlacing(B, "Test B");
    const placingOk = !!f.placing && !document.getElementById("placeBox").hidden;
    f.dropPlacing();
    const modal = !document.getElementById("modal").hidden;
    if (!modal) return { placingOk, modal, toast: document.getElementById("toast").textContent, msg: document.getElementById("sMsg").textContent };
    const asked = [...document.querySelectorAll("#modal input[type=radio]")].map((i) => i.id);
    if (!document.getElementById("mg_landscape_b")) return { asked, modal, toast: document.getElementById("toast").textContent, placingOk };
    document.getElementById("mg_landscape_b").click();
    document.getElementById("mg_envFlags_b").click();
    [...document.querySelectorAll("#modal button")].find((b) => b.textContent === "Place it").click();
    const d = f.doc;
    // B's walls were on wall set 2; they must still say so after the merge (the level stays on set 0)
    const bWallsHome = d.polys.slice(-B.polys.length).every((q) => q.fcol === 19 && q.ccol === 19);
    return { placingOk, modal, asked, land: d.info.landscape, flags: d.info.envFlags, env: d.info.env, bWallsHome, placingAfter: !!f.placing };
  });
  assert.ok(r.placingOk, JSON.stringify(r));
  assert.ok(r.modal, "settings dialog opened: " + JSON.stringify(r));
  assert.ok(r.asked.includes("mg_env_a") && r.asked.includes("mg_landscape_b") && r.asked.includes("mg_envFlags_b"));
  assert.equal(r.env, 0);
  assert.equal(r.land, 3);
  assert.equal(r.flags & 8, 8);
  assert.ok(r.bWallsHome, "the added map keeps its own wall set");
  assert.equal(r.placingAfter, false);
});

// Bungie's maps (lights, switches, terminals, doors, teleporters, sounds). Set MARATHON_MAPS_DIR to a folder of maps
// (the disc's Demo Merge folder works) and MERGE_A / MERGE_B to two file names in it.
const dir = process.env.MARATHON_MAPS_DIR, fa = process.env.MERGE_A, fb = process.env.MERGE_B;
test("two of Bungie's maps merge into one that exports and re-imports cleanly", { skip: !(dir && fa && fb) }, async () => {
  const a = [...fs.readFileSync(path.join(dir, fa))], b = [...fs.readFileSync(path.join(dir, fb))];
  const r = await app.page.evaluate(({ a, b, SUMMARY }) => {
    const f = window.__forge;
    const sum = eval(SUMMARY);
    const load = (arr) => f.levelToDoc(f.parseWad(new Uint8Array(arr).buffer).levels.find((l) => l.chunks.POLY)).doc;
    const A = load(a), B = load(b);
    const sa = sum(A), sb = sum(B);
    const rawLights = (A.lights || []).length + (B.lights || []).length;
    const ambA = A.ambi ? atob(A.ambi).length : 0, ambB = B.ambi ? atob(B.ambi).length : 0;
    const rndA = A.bonk ? atob(A.bonk).length : 0, rndB = B.bonk ? atob(B.bonk).length : 0;
    const maxAmbB = Math.max(-1, ...B.polys.map((q) => q.amb ?? -1)), maxRndB = Math.max(-1, ...B.polys.map((q) => q.rnd ?? -1));
    f.setDoc(A);
    // Bungie's levels fill most of the map area, so this one goes on top (Forge's 5D space), raised out of the way
    f.mergeInto(A, B, { cx: 0, cy: 0, tx: 0, ty: 0, dz: 8 * 1024, rot: 0 }, {});
    const tooFar = A.pts.some((p) => Math.abs(p.x) > 32767 || Math.abs(p.y) > 32767);
    const maxAmb = Math.max(-1, ...A.polys.map((q) => q.amb ?? -1)), maxRnd = Math.max(-1, ...A.polys.map((q) => q.rnd ?? -1));
    return { sa, sb, s: sum(A), rawLights, merged: (A.lights || []).length, ambA, ambB, rndA, rndB, maxAmbB, maxRndB, maxAmb, maxRnd, tooFar,
      ambTotal: A.ambi ? atob(A.ambi).length : 0, rndTotal: A.bonk ? atob(A.bonk).length : 0 };
  }, { a, b, SUMMARY });
  console.log(JSON.stringify(r));
  assert.equal(r.ambA % 16, 0, "ambient sound records are 16 bytes");
  assert.equal(r.rndA % 32, 0, "random sound records are 32 bytes");
  assert.ok(r.maxAmbB < r.ambB / 16 && r.maxRndB < r.rndB / 32);
  assert.ok(r.maxAmb < r.ambTotal / 16 && r.maxRnd < r.rndTotal / 32, "sound indexes stay inside the merged tables");
  if (!r.tooFar) {
    assert.equal(r.s.polys, r.sa.polys + r.sb.polys);
    assert.equal(r.s.objs, r.sa.objs + r.sb.objs);
    assert.equal(r.s.plats, r.sa.plats + r.sb.plats);
    assert.equal(r.s.terms, r.sa.terms + r.sb.terms);
    assert.equal(r.merged, r.rawLights, "both light tables are kept");
    assert.equal(r.s.teleTargets.length, r.sa.teleTargets.length + r.sb.teleTargets.length);
    assert.ok(r.s.teleTargets.every((t) => t >= 0));
    assert.equal(r.s.badPolyRefs, 0);
    assert.ok(r.s.stable);
  }
});

test("layers hide other heights, new rooms join the layer, and adding a map makes a layer per map", async () => {
  const r = await app.page.evaluate(() => {
    const f = window.__forge;
    f.applySpec(f.randomSpec(31, "small", "carnage"), false, "a");
    const A = f.doc;
    f.applySpec(f.randomSpec(32, "small", "carnage"), false, "b");
    const B = f.doc;
    f.setDoc(A);
    const nA = A.polys.length;
    f.startPlacing(B, "Upper map");
    f.placing.tx = f.placing.cx; f.placing.ty = f.placing.cy; // right on top
    f.placing.dz = 8 * 1024;
    f.finishMerge({});
    const d = f.doc;
    const layers = d.info.layers.map((l) => [l.name, l.lo, l.hi]);
    f.setLayer(1);
    const V = f.layerVis();
    const shown = d.polys.filter((q) => V.polys.has(q)).length;
    const lowShown = d.polys.slice(0, nA).some((q) => V.polys.has(q));
    // a room drawn now lands on the upper layer
    f.setTool("rect");
    const before = d.polys.length;
    const box = document.getElementById("map").getBoundingClientRect();
    return { layers, shown, nB: d.polys.length - nA, lowShown, before };
  });
  assert.equal(r.layers.length, 2);
  assert.equal(r.layers[1][0], "Upper map");
  assert.ok(r.layers[1][1] >= 8 * 1024);
  assert.equal(r.lowShown, false, "the lower map is hidden");
  assert.equal(r.shown, r.nB);
  // draw a room with the mouse on the upper layer, away from everything
  const { page } = app;
  const box = await page.locator("#map").boundingBox();
  await page.evaluate(() => { const f = window.__forge; f.setTool("rect"); });
  const hi = await page.evaluate(() => window.__forge.layer.lo);
  await page.mouse.move(box.x + 30, box.y + box.height - 90);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + box.height - 30, { steps: 4 });
  await page.mouse.up();
  const nr = await page.evaluate(() => { const d = window.__forge.doc; const q = d.polys[d.polys.length - 1]; return { floor: q.floor, n: d.polys.length }; });
  assert.equal(nr.n, r.before + 1);
  assert.equal(nr.floor, hi, "new room sits on the layer's floor height");
});

test("link with teleporter: pad points at the landing polygon and exports", async () => {
  const r = await app.page.evaluate(() => {
    const f = window.__forge;
    f.applySpec(f.randomSpec(41, "small", "solo"), false, "a");
    f.setLayer(-1);
    const d = f.doc;
    const c = (q) => { let x = 0, y = 0; for (const v of q.verts) { x += v.x; y += v.y; } return { x: x / q.verts.length, y: y / q.verts.length }; };
    const a = d.polys.find((q) => q.type === 0), b = d.polys.filter((q) => q.type === 0).at(-1);
    f.setTool("tele");
    f.teleClick(c(a)); f.teleClick(c(b));
    const back = f.levelToDoc(f.parseWad(f.buildWadFile(f.buildMapChunks(d).chunks, "T", 1).buffer.slice(0)).levels[0]).doc;
    return { type: a.type, perm: a.perm, want: d.polys.indexOf(b), back: back.polys[d.polys.indexOf(a)].type, backPerm: back.polys[d.polys.indexOf(a)].perm };
  });
  assert.equal(r.type, 10);
  assert.equal(r.perm, r.want);
  assert.equal(r.back, 10);
  assert.equal(r.backPerm, r.want);
});

test("merging adds the two maps' respawn settings together", async () => {
  const r = await app.page.evaluate(() => {
    const f = window.__forge;
    const row = (a) => Array.from({ length: 64 }, () => [...a]);
    const A = f.newDoc("inf"), B = f.newDoc("inf");
    A.placement = { items: row([0, 0, 0, 0, 0, 0]), monsters: row([0, 0, 0, 0, 0, 0]) };
    B.placement = { items: row([0, 0, 0, 0, 0, 0]), monsters: row([0, 0, 0, 0, 0, 0]) };
    A.placement.monsters[3] = [1, 2, 1, 4, 0, 0]; B.placement.monsters[3] = [0, 3, 2, 5, -1, 20000];
    f.mergeInto(A, B, { cx: 0, cy: 0, tx: 0, ty: 0, dz: 0, rot: 0 }, {});
    return A.placement.monsters[3];
  });
  assert.deepEqual(r, [1, 5, 3, 9, -1, 20000]);
});

test("past Aleph One's limits: Checks warns, export squashes by default and wraps in the test mode", async () => {
  const r = await app.page.evaluate(() => {
    const f = window.__forge;
    f.applySpec(f.randomSpec(51, "small", "solo"), false, "a");
    const d = f.doc;
    const far = 33 * 1024;
    const q = d.polys[0]; for (const v of q.verts) v.x += far; q.ceil = 34 * 1024;
    const warns = f.validate().filter((i) => /past the edge|height past the limit/.test(i.title)).map((i) => i.lv);
    const read = () => f.levelToDoc(f.parseWad(f.buildWadFile(f.buildMapChunks(d).chunks, "L", 1).buffer.slice(0)).levels[0]).doc;
    const a = read(); const ax = Math.max(...a.polys[0].verts.map((v) => v.x)), ac = a.polys[0].ceil;
    f.setExportWrap(true); const b = read(); f.setExportWrap(false);
    const bx = Math.min(...b.polys[0].verts.map((v) => v.x)), bc = b.polys[0].ceil;
    return { warns, ax, ac, bx, bc };
  });
  assert.deepEqual(r.warns, ["warn", "warn"]);
  assert.equal(r.ax, 32767);
  assert.equal(r.ac, 32767);
  assert.ok(r.bx < 0, "wrapped round to the other side");
  assert.ok(r.bc < 0, "height wrapped round");
});
