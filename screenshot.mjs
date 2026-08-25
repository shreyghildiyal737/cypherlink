import { chromium } from 'playwright';
import path from 'path';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(10000);

await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14 Pro

const shots = [];

// 1. Landing
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'C:\\Temp\\shot_landing.png', fullPage: false });
shots.push({ label: 'Landing', url: '/' });

// 2. Login
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'C:\\Temp\\shot_login.png', fullPage: false });
shots.push({ label: 'Login', url: '/login' });

// 3. Cyphers public listing (may need auth redirect)
await page.goto('http://localhost:5173/cyphers', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'C:\\Temp\\shot_cyphers.png', fullPage: false });
shots.push({ label: 'Cyphers', url: '/cyphers' });

// 4. Feed
await page.goto('http://localhost:5173/feed', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'C:\\Temp\\shot_feed.png', fullPage: false });
shots.push({ label: 'Feed', url: '/feed' });

await browser.close();
console.log('Screenshots taken:', shots.map(s => s.label).join(', '));
