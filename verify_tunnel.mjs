import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(20000);
try {
  await page.goto("https://reservations-characterized-fotos-picture.trycloudflare.com", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const title = await page.title();
  const body = (await page.textContent("body") ?? "").slice(0, 200);
  await page.screenshot({ path: "C:\\Temp\\tunnel_check.png" });
  console.log("Title:", title);
  console.log("Body snippet:", body);
} catch (e) {
  console.log("Error:", e.message.split("\n")[0]);
}
await browser.close();
