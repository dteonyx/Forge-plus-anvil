import { chromium } from "playwright";
import { startServer } from "./server.mjs";

// Opens the editor in headless Chromium. External requests (Google Fonts) are blocked so tests run offline.
export async function openForge() {
  const server = await startServer();
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1400, height: 860 }, acceptDownloads: true });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.goto(server.url);
  await page.waitForFunction(() => !!window.__forge, null, { timeout: 15000 });
  // close the first-launch Shapes dialog if it opened
  await page.evaluate(() => { const m = document.getElementById("modal"); if (m) m.hidden = true; });
  return {
    page, errors, server,
    async close() { await browser.close(); await server.close(); },
  };
}
