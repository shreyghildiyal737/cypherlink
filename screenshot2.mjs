import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
page.setDefaultTimeout(12000);

async function shot(label, url, waitMs = 2000) {
  await page.goto(`http://localhost:5173${url}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: `C:\\Temp\\s_${label}.png` });
  console.log(`✓ ${label}`);
}

await shot('landing', '/');
await shot('login', '/login');
await shot('cyphers', '/cyphers', 3000);
await shot('feed', '/feed', 3000);
await shot('map', '/map', 3000);

await browser.close();
