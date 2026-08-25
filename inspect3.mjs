import { chromium } from "playwright";
const browser = await chromium.launch({ headless: false }); // visible for debugging
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(8000);

// -- REGISTER BUTTON ---
console.log("\n=== /login Register button ===");
await page.goto("http://localhost:5173/login", { waitUntil: "networkidle" });
// find ALL elements with text "Register"
const regEls = await page.locator("*:has-text('Register')").all();
console.log(`Elements containing 'Register': ${regEls.length}`);
for (const el of regEls) {
  try {
    const tag = await el.evaluate(e => e.tagName);
    const txt = (await el.textContent())?.trim().slice(0,40);
    const vis = await el.isVisible();
    const en = await el.isEnabled();
    const box = await el.boundingBox();
    console.log(`  <${tag}> visible=${vis} enabled=${en} text="${txt}" box=${JSON.stringify(box)}`);
  } catch {}
}

// -- CYPHER CARD LINKS ---
console.log("\n=== /cyphers a[href*=cyphers] links ===");
await page.goto("http://localhost:5173/cyphers", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const allLinks = await page.locator("a[href]").all();
console.log(`Total links: ${allLinks.length}`);
for (const l of allLinks) {
  const href = await l.getAttribute("href");
  if (href?.includes("/cyphers/")) {
    const txt = (await l.textContent())?.trim().slice(0,50);
    const vis = await l.isVisible();
    const box = await l.boundingBox();
    console.log(`  href="${href}" vis=${vis} text="${txt}" box=${JSON.stringify(box)}`);
  }
}
// Check if cypher cards exist at all
const cyphersInPage = await page.locator("[href*='/cyphers/']").count();
console.log(`/cyphers/ hrefs on page: ${cyphersInPage}`);

// Screenshot
await page.screenshot({ path: "C:\\Temp\\debug_cyphers.png" });
console.log("Screenshot saved to C:\\Temp\\debug_cyphers.png");

await browser.close();
