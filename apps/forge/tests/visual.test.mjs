// The visual view (Forge's "Visual mode"): copying surfaces, the right-click menu, doors, and opening at a polygon.
// Needs the real three.js in node_modules (WebGL through SwiftShader); skipped with the test stand-in.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { openForge } from "./support/browser.mjs";

let app, real = false;
before(async () => {
  app = await openForge();
  real = app.server.realThree && await app.page.evaluate(() => { try { return !!document.createElement("canvas").getContext("webgl"); } catch (_) { return false; } });
});
after(async () => { await app?.close(); });

// two rooms joined by a door; the player stands in the first room facing the door
async function setup() {
  return app.page.evaluate(() => {
    const f = window.__forge, W = 1024;
    if (f.view3d) f.view3d.close();
    f.setDoc(f.newDoc("inf"));
    const mk = (cs, fl, ce) => { const q = f.makePolygonFromCoords(cs.map(([x, y]) => ({ x: x * W, y: y * W })), null); q.floor = fl * W; q.ceil = ce * W; return q; };
    const A = mk([[0, 0], [4, 0], [4, 4], [0, 4]], 0, 2);
    const D = mk([[4, 1.5], [4.5, 1.5], [4.5, 2.5], [4, 2.5]], 0, 2);
    const B = mk([[4.5, 0], [8.5, 0], [8.5, 4], [4.5, 4]], 0, 2);
    const b = (n) => 1 << n;
    D.type = 5; D.plat = { type: 0, speed: 34, delay: 120, min: -1, max: -1, flags: b(1) | b(3) | b(5) | b(7) | b(13) | b(14) | b(15) | b(26), tag: 0 };
    f.doc.objs.push({ kind: 3, sub: 0, x: 3.2 * W, y: 2 * W, z: 0, facing: 0, flags: 0 });
    return { A: f.doc.polys.indexOf(A), D: f.doc.polys.indexOf(D), B: f.doc.polys.indexOf(B) };
  });
}

test("Visual view here: the visual view opens standing in that polygon, titled Visual view", async (t) => {
  if (!real) return t.skip("needs the real three.js and WebGL");
  const ids = await setup();
  const r = await app.page.evaluate((ids) => {
    const f = window.__forge; f.open3D({ poly: f.doc.polys[ids.B] });
    const v = f.view3d; const cur = f.doc.polys.indexOf(v.test.curPoly());
    const title = document.querySelector(".view3d .hud .t").textContent;
    v.close(); return { cur, title };
  }, ids);
  assert.equal(r.cur, ids.B);
  assert.equal(r.title, "Visual view");
});

test("copying a wall takes its texture, transfer mode and light, and pasting puts all three on another wall", async (t) => {
  if (!real) return t.skip("needs the real three.js and WebGL");
  const ids = await setup();
  const r = await app.page.evaluate((ids) => {
    const f = window.__forge; const d = f.doc; const A = d.polys[ids.A];
    // wall 0 of room A gets texture 7, wobble, 40% light
    const [a, b] = [A.verts[0], A.verts[1]], [c, e] = [A.verts[2], A.verts[3]];
    d.sides.set(`${a.id}>${b.id}`, { full: { b: 7, ox: 0, oy: 0, xfer: 5, light: 40 } });
    f.open3D({ poly: A }); const v = f.view3d.test;
    v.setAim({ kind: "wall", poly: A, a, b, part: "full" }); v.grab();
    v.setAim({ kind: "wall", poly: A, a: c, b: e, part: "full" }); v.paint(false);
    const got = d.sides.get(`${c.id}>${e.id}`).full;
    const mode = document.getElementById("h3xfer").value, lightOn = document.getElementById("h3applyLight").checked;
    f.view3d.close(); return { got, mode, lightOn };
  }, ids);
  assert.equal(r.got.b, 7);
  assert.equal(r.got.xfer, 5, "wobble came along");
  assert.equal(r.got.light, 40, "light came along");
  assert.equal(r.mode, "5");
  assert.ok(r.lightOn);
});

test("right-click menu: drop-down at the mouse, transfer mode and light submenus change the surface", async (t) => {
  if (!real) return t.skip("needs the real three.js and WebGL");
  const ids = await setup();
  const r = await app.page.evaluate((ids) => {
    const f = window.__forge; const d = f.doc; const A = d.polys[ids.A];
    f.open3D({ poly: A }); const v = f.view3d.test;
    const s = { kind: "floor", poly: A };
    v.surfaceMenu(s, 200, 150);
    const m = document.getElementById("h3ctx");
    const items = [...m.querySelectorAll(":scope > .ctxitem")].map((b) => b.firstChild.textContent);
    const clickSub = (top, label) => { const it = [...m.querySelectorAll(":scope > .ctxitem")].find((b) => b.firstChild.textContent.startsWith(top)); it.click();
      [...it.querySelectorAll(".ctxsub .ctxitem")].find((b) => b.textContent === label).click(); };
    clickSub("Transfer mode", "Horizontal slide");
    const x = A.fxfer;
    v.surfaceMenu(s, 200, 150);
    const m2 = document.getElementById("h3ctx");
    const it = [...m2.querySelectorAll(":scope > .ctxitem")].find((b) => b.firstChild.textContent.startsWith("Light")); it.click();
    [...it.querySelectorAll(".ctxsub .ctxitem")].find((b) => b.textContent === "30%").click();
    const closed = !document.getElementById("h3ctx");
    // the browser's own menu is blocked while the view is open
    const ev = new MouseEvent("contextmenu", { bubbles: true, cancelable: true }); document.body.dispatchEvent(ev);
    const blocked = ev.defaultPrevented;
    f.view3d.close(); return { items, x, light: A.flight, closed, blocked };
  }, ids);
  assert.ok(r.items.some((t) => t.startsWith("Copy")) && r.items.some((t) => t.startsWith("Transfer mode")) && r.items.some((t) => t.startsWith("Light")));
  assert.equal(r.x, 15);
  assert.equal(r.light, 30);
  assert.ok(r.closed, "menu closes after picking");
  assert.ok(r.blocked, "browser menu blocked");
});

test("doors: E opens a door, and E again while it's open closes it straight away", async (t) => {
  if (!real) return t.skip("needs the real three.js and WebGL");
  const ids = await setup();
  const r = await app.page.evaluate(async (ids) => {
    const f = window.__forge; const D = f.doc.polys[ids.D];
    f.open3D({ poly: f.doc.polys[ids.A] }); const v = f.view3d.test;
    const p = () => v.plats().get(D);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    v.usePlat(D);
    for (let i = 0; i < 80 && !(p().ceil === p().r.maxC); i++) await wait(50);
    const opened = p().ceil === p().r.maxC, waiting = p().wait > 0;
    v.usePlat(D);
    await wait(300);
    const closing = p().ceil < p().r.maxC;
    f.view3d.close(); return { opened, waiting, closing };
  }, ids);
  assert.ok(r.opened, "door opened");
  assert.ok(r.waiting, "it waits open");
  assert.ok(r.closing, "E closed it without waiting out the delay");
});

test("without mouse look, aiming follows the mouse pointer, not the crosshair", async (t) => {
  if (!real) return t.skip("needs the real three.js and WebGL");
  const ids = await setup();
  await app.page.evaluate((ids) => { const f = window.__forge; f.open3D({ poly: f.doc.polys[ids.A] }); f.view3d.test.setYaw(Math.PI); }, ids);
  const box = await app.page.locator(".view3d > canvas").boundingBox();
  await app.page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.72);
  await app.page.waitForTimeout(600);
  const low = await app.page.evaluate(() => { const a = window.__forge.view3d.test.aim; return a && a.kind; });
  await app.page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.12);
  await app.page.waitForTimeout(600);
  const high = await app.page.evaluate(() => { const a = window.__forge.view3d.test.aim; return a && a.kind; });
  const crossHidden = await app.page.evaluate(() => document.getElementById("h3cross").hidden);
  await app.page.evaluate(() => window.__forge.view3d.close());
  assert.equal(low, "floor");
  assert.equal(high, "ceil");
  assert.ok(crossHidden, "the crosshair hides while the mouse does the aiming");
});
