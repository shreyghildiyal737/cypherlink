import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(10000);

// --- Register button ---
await page.goto("http://localhost:5173/login", { waitUntil: "networkidle" });
const btns = await page.locator("button").all();
console.log("=== Buttons on /login ===");
for (const b of btns) {
  const txt = await b.textContent();
  const cls = await b.getAttribute("class");
  console.log(`  text="${txt?.trim()}"  class="${cls?.slice(0,60)}"`);
}

// --- Cypher cards ---
await page.goto("http://localhost:5173/cyphers", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const links = await page.locator("a[href]").all();
console.log("\n=== Links on /cyphers ===");
for (const l of links.slice(0, 15)) {
  const href = await l.getAttribute("href");
  const txt = (await l.textContent())?.trim().slice(0, 60);
  console.log(`  href="${href}"  text="${txt}"`);
}

await browser.close();
