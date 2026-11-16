// Live-mode check against `next start` on port 3100. Prints what each screen shows; saves
// screenshots to /tmp (not the repo). Usage: node scripts/verify-live.mjs
import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:3100';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 }, colorScheme: 'dark' })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
const shot = n => page.screenshot({ path: `/tmp/lt-live-${n}.png` });
const text = async sel => (await page.locator(sel).first().innerText()).replace(/\s+/g, ' ').slice(0, 400);

await page.goto(BASE + '/'); await page.getByText('Live · Snowflake views').waitFor(); await page.waitForTimeout(2500);
console.log('DASHBOARD:', await text('main'));
await shot('dashboard');

await page.goto(BASE + '/triangles/'); await page.waitForTimeout(3000);
console.log('TRIANGLES:', await text('main'));
await shot('triangles');

await page.goto(BASE + '/segments/'); await page.waitForTimeout(2500);
let t0 = Date.now();
await page.getByRole('button', { name: 'Generate insights' }).click();
await page.getByText('Powered by AI_COMPLETE').waitFor({ timeout: 90000 });
console.log(`SEGMENTS (${Date.now() - t0} ms):`, (await page.locator('text=Segmentation Insights').locator('xpath=../..').innerText()).replace(/\s+/g, ' ').slice(0, 900));
await shot('segments');

await page.goto(BASE + '/consistency/'); await page.waitForTimeout(2500);
await page.getByRole('button', { name: /Run/ }).first().click(); await page.waitForTimeout(1000);
console.log('CONSISTENCY:', await text('main'));
await shot('consistency');

await page.goto(BASE + '/chat/'); await page.waitForTimeout(2000);
t0 = Date.now();
await page.getByPlaceholder('Ask about loss triangles, segments, selections...').fill('What is the total IBNR by coverage for the overall triangles?');
await page.keyboard.press('Enter');
await page.getByText('Powered by Cortex Agent (live)').waitFor({ timeout: 120000 });
console.log(`CHAT (${Date.now() - t0} ms):`, (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(-1200));
await shot('chat');
console.log('page errors:', errs);
await browser.close();
