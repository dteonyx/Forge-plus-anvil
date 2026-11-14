// Export to Unreal: the level as a glTF 2.0 binary (.glb) that Unreal Engine 5 imports.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { openForge } from "./support/browser.mjs";

const validator = createRequire(import.meta.url)("gltf-validator");

let app;
before(async () => { app = await openForge(); });
after(async () => { await app?.close(); });

// Reads a .glb: its JSON, and each accessor as a typed array.
function readGlb(bytes) {
  const u = Uint8Array.from(bytes), dv = new DataView(u.buffer);
  assert.equal(dv.getUint32(0, true), 0x46546c67, "starts with glTF");
  assert.equal(dv.getUint32(4, true), 2, "glTF version 2");
  assert.equal(dv.getUint32(8, true), u.length, "length in the header matches");
  const jl = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(u.subarray(20, 20 + jl)));
  const binStart = 20 + jl + 8;
  const view = (i) => { const v = json.bufferViews[i]; return u.slice(binStart + v.byteOffset, binStart + v.byteOffset + v.byteLength); };
  const acc = (i) => { const a = json.accessors[i]; const b = view(a.bufferView).buffer; return a.componentType === 5126 ? new Float32Array(b) : new Uint32Array(b); };
  return { json, view, acc, u };
}
const exportGlb = (opts) => app.page.evaluate((o) => Array.from(window.__forgeUnreal.buildUnrealGlb(o).file), opts);

test("the sample level exports as a valid glTF file", async () => {
  const bytes = await exportGlb({});
  const report = await validator.validateBytes(Uint8Array.from(bytes));
  assert.equal(report.issues.numErrors, 0, JSON.stringify(report.issues.messages.slice(0, 5)));
  const { json, view } = readGlb(bytes);
  assert.ok(json.meshes.length >= 1);
  assert.ok(report.info.totalTriangleCount > 0);
  for (let i = 0; i < json.images.length; i++) assert.deepEqual([...view(json.images[i].bufferView).slice(0, 4)], [0x89, 0x50, 0x4e, 0x47], "textures are PNGs");
  assert.equal(json.materials.length, json.images.length, "one texture per material");
});

test("two rooms come out at the right size, with walls at both floor heights and faces pointing into the rooms", async () => {
  await app.page.evaluate(() => {
    const f = window.__forge;
    f.applySpec({ name: "Two Rooms", environment: "water", landscape: "day", mode: "solo",
      rooms: [{ id: "A", x: 0, y: 0, w: 4, h: 4, floor: 0, ceiling: 2, light: 80 }, { id: "B", x: 4, y: 1, w: 3, h: 2, floor: 0.5, ceiling: 1.5, light: 70 }],
      objects: [{ kind: "player", room: "A", dx: 0.5, dy: 0.5, facing: 0 }] }, false, "test");
  });
  const doc = await app.page.evaluate(() => {
    const d = window.__forge.doc, xs = d.pts.map((p) => p.x / 1024), ys = d.pts.map((p) => p.y / 1024);
    return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), minX: Math.min(...xs), floor: Math.min(...d.polys.map((q) => q.floor)) / 1024, ceil: Math.max(...d.polys.map((q) => q.ceil)) / 1024 };
  });
  for (const cm of [225, 100]) {
    const bytes = await exportGlb({ cmPerWU: cm });
    assert.equal((await validator.validateBytes(Uint8Array.from(bytes))).issues.numErrors, 0);
    const { json, acc } = readGlb(bytes);
    const m = cm / 100; // metres per World Unit
    const mins = [Infinity, Infinity, Infinity], maxs = [-Infinity, -Infinity, -Infinity];
    let floorsUp = 0, walls = 0, heights = new Set();
    for (const prim of json.meshes[0].primitives) {
      const a = json.accessors[prim.attributes.POSITION];
      a.min.forEach((v, k) => { mins[k] = Math.min(mins[k], v); }); a.max.forEach((v, k) => { maxs[k] = Math.max(maxs[k], v); });
      const p = acc(prim.attributes.POSITION), n = acc(prim.attributes.NORMAL);
      for (let i = 0; i < p.length; i += 9) {
        // glTF shows a face whose corners run counter-clockwise; that side must be the side the normal points to
        const e1 = [p[i + 3] - p[i], p[i + 4] - p[i + 1], p[i + 5] - p[i + 2]], e2 = [p[i + 6] - p[i], p[i + 7] - p[i + 1], p[i + 8] - p[i + 2]];
        const c = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        assert.ok(c[0] * n[i] + c[1] * n[i + 1] + c[2] * n[i + 2] > 0, "triangle faces the way its normal points");
        if (n[i + 1] === 1) floorsUp++;
        if (n[i + 1] === 0) { walls++; heights.add(Math.round(Math.min(p[i + 1], p[i + 4], p[i + 7]) / m * 100) / 100); }
      }
    }
    const near = (a, b, what) => assert.ok(Math.abs(a - b) < 1e-3, `${what}: ${a} vs ${b}`);
    near(maxs[0] - mins[0], doc.w * m, "width"); near(maxs[2] - mins[2], doc.h * m, "depth");
    near(mins[1], doc.floor * m, "lowest floor"); near(maxs[1], doc.ceil * m, "highest ceiling");
    assert.ok(floorsUp >= 4, "floors face up");
    assert.ok(heights.has(0) && heights.has(0.5), "walls start at room A's floor and at room B's raised floor");
    assert.equal(json.asset.extras.marathonWorldUnitCm, cm);
  }
});

test("Export to Unreal button saves a .glb", async () => {
  const { page } = app;
  await page.click("#bUnreal");
  await page.locator("#modal").getByText("Import Into Level").waitFor();
  await page.fill("#ueScale", "200");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#modal").getByRole("button", { name: "Export", exact: true }).click()]);
  assert.match(dl.suggestedFilename(), /\.glb$/);
  assert.deepEqual(app.errors, []);
});
