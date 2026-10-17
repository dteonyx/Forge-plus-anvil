// Tiny static server for the tests. It serves apps/forge straight from source and adds an import map,
// so `import "three"` works without a bundler: the real three.js when it's installed, else a test stand-in.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "../..");
const repoRoot = path.resolve(appRoot, "../..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json" };

function findThree() {
  for (const base of [path.join(appRoot, "node_modules"), path.join(repoRoot, "node_modules")]) {
    const f = path.join(base, "three/build/three.module.js");
    if (fs.existsSync(f)) return { file: f, real: true };
  }
  return { file: path.join(here, "three-stub.mjs"), real: false };
}

export async function startServer() {
  const three = findThree();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    let file;
    if (url.pathname === "/__three.js") file = three.file;
    else file = path.join(appRoot, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname));
    if (!file.startsWith(appRoot) && file !== three.file) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404).end(); return; }
      let body = buf;
      if (file.endsWith("index.html")) {
        const map = `<script type="importmap">{"imports":{"three":"/__three.js"}}</script>`;
        body = Buffer.from(buf.toString("utf8").replace('<script type="module"', map + '\n<script type="module"'));
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" }).end(body);
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}/`, realThree: three.real, close: () => new Promise((r) => server.close(r)) };
}
