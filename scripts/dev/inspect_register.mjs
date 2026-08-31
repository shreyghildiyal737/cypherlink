import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(8000);

await page.goto("http://localhost:5173/login", { waitUntil: "networkidle" });
const bodyBefore = await page.locator("body").innerHTML();

// click register link
const links = await page.locator("a, button").allTextContents();
console.log("Links/buttons:", links.filter(t => t.trim()));

// try clicking register
try {
  await page.click("a:has-text('Register')", { timeout: 3000 });
  await page.waitForTimeout(1000);
  const url = page.url();
  console.log("URL after register click:", url);
  const inputs = await page.locator("input").all();
  for (const i of inputs) {
    console.log("input:", await i.getAttribute("type"), await i.getAttribute("placeholder"), await i.getAttribute("name"));
  }
  const buttons = await page.locator("button").allTextContents();
  console.log("Buttons:", buttons);
} catch (e) {
  console.log("No register link found:", e.message.split("\n")[0]);
  console.log("Page HTML snippet:", bodyBefore.slice(0, 500));
}

await browser.close();
