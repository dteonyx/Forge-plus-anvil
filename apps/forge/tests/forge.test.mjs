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
