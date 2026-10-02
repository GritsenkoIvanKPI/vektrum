// Usage: node screenshot.mjs <url> [label] [width]
// Needs puppeteer-core; set PUPPETEER_DIR to the folder whose node_modules contains it.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(process.env.PUPPETEER_DIR || here, 'package.json'));
const puppeteer = require('puppeteer-core');

const [url = 'http://localhost:3000', label, width = '1440'] = process.argv.slice(2);
const cache = path.join(os.homedir(), '.cache/puppeteer/chrome');
const build = fs.readdirSync(cache).sort().pop();
const executablePath = process.env.CHROME_PATH ||
  path.join(cache, build, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');

const outDir = path.join(here, 'temporary screenshots');
fs.mkdirSync(outDir, { recursive: true });
const n = fs.readdirSync(outDir).filter(f => /^screenshot-\d+/.test(f)).length + 1;
const out = path.join(outDir, `screenshot-${n}${label ? '-' + label : ''}.png`);

const browser = await puppeteer.launch({ executablePath, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: Number(width), height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0' });
// Walk the page so scroll-triggered reveals fire before the full-page capture.
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
  window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 600));
});
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
