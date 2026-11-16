// Captures the landing-page screenshots and catalog card images from the hosted example.
//
//   npm run build:example        # refresh docs/try/ first if the UI changed
//   npm run capture              # writes docs/images/*.png and docs/catalog/*.jpg
//
// Runs headless Chromium at a fixed 1600x1000 viewport against docs/try/ served locally, so no
// sign-in, account URL, or user name can appear: only the bundled synthetic data. Review every
// image before publishing anyway.
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const DOCS = join(ROOT, 'docs');
const BASE = '/sfguide-loss-triangle-analysis/try'; // must match basePath in next.config.ts
const CARD_ID = 'loss-triangle-suite';
const VIEWPORT = { width: 1600, height: 1000 };
const PAGE_SCALE = 1;     // 1600x1000 PNG for the landing page
const CARD_SCALE = 0.6;   // 960x600 JPG for the catalog card

const askAgent = (label) => async (page) => {
  await page.getByRole('button', { name: new RegExp(label) }).click();
  await page.getByText('Sample AI response').last().waitFor({ timeout: 20000 });
};

// Landing-page order. `card` marks which shots become catalog cards (in that order).
const SHOTS = [
  { name: '01-dashboard', card: 1, path: '/' },
  { name: '02-agent-anomalies', card: 2, path: '/chat/', act: askAgent('Flag anomalies') },
  {
    name: '03-agent-progress', path: '/chat/',
    async act(page) {
      await page.getByRole('button', { name: /Compare Tier 1 vs Tier 2/ }).click();
      await page.getByText('Running query on LOSS_TRIANGLE_WH').waitFor();
      await page.waitForTimeout(2600);
    },
    noSettle: true,
  },
  { name: '04-triangle-explorer', card: 3, path: '/triangles/' },
  {
    name: '05-segment-insights', card: 4, path: '/segments/',
    async act(page) {
      await page.getByRole('button', { name: 'Generate insights' }).click();
      await page.getByText('Sample AI response').waitFor({ timeout: 20000 });
      await page.getByText('Segmentation Insights').scrollIntoViewIfNeeded();
    },
  },
  {
    name: '06-consistency-test', card: 5, path: '/consistency/',
    async act(page) {
      await page.getByRole('button', { name: 'Run Test' }).click();
      await page.getByText('Current Total Ultimate').waitFor();
    },
  },
];

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

function serve() {
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith(BASE)) { res.writeHead(404).end(); return; }
    let file = normalize(join(DOCS, 'try', decodeURIComponent(url.pathname.slice(BASE.length))));
    if (!file.startsWith(join(DOCS, 'try'))) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done(server)));
}

async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200); // chart entrance animations
}

async function main() {
  if (!existsSync(join(DOCS, 'try', 'index.html'))) throw new Error('docs/try/ is missing. Run `npm run build:example` first.');
  mkdirSync(join(DOCS, 'images'), { recursive: true });
  mkdirSync(join(DOCS, 'catalog'), { recursive: true });
  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}${BASE}`;
  const browser = await chromium.launch();
  try {
    for (const shot of SHOTS) {
      for (const [scale, out] of [
        [PAGE_SCALE, join(DOCS, 'images', `${shot.name}.png`)],
        ...(shot.card ? [[CARD_SCALE, join(DOCS, 'catalog', `${CARD_ID}-${shot.card}.jpg`)]] : []),
      ]) {
        const context = await browser.newContext({
          viewport: VIEWPORT, deviceScaleFactor: scale, colorScheme: 'dark',
          locale: 'en-US', timezoneId: 'America/New_York',
        });
        const page = await context.newPage();
        await page.goto(origin + shot.path);
        await settle(page);
        if (shot.act) { await shot.act(page); if (!shot.noSettle) await settle(page); }
        await page.screenshot({ path: out, ...(out.endsWith('.jpg') ? { type: 'jpeg', quality: 78 } : {}) });
        await context.close();
        console.log(`${out.replace(ROOT + '/', '')}  ${Math.round(statSync(out).size / 1024)} KB`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((failure) => { console.error(failure.message); process.exit(1); });
