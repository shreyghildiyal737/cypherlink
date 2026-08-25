import { chromium } from "playwright";

const FRONTEND = "https://reservations-characterized-fotos-picture.trycloudflare.com";
const BACKEND  = "https://gasoline-affected-electoral-impaired.trycloudflare.com";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(20000);

// 1. Backend health via tunnel
const apiRes = await fetch(`${BACKEND}/api/cyphers`).catch(e => ({ status: 'fetch error', error: e.message }));
console.log("Backend /api/cyphers via tunnel:", apiRes.status ?? 'ok');

// 2. Frontend via tunnel — verify it loads AND calls the tunnelled backend
const errors = [];
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });

await page.goto(`${FRONTEND}/cyphers`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

const body = await page.textContent("body") ?? "";
const hasCyphers = ["Delhi", "Mumbai", "Bangalore", "Sessions", "Circle"].some(w => body.includes(w));
const title = await page.title();

console.log("Page title:", title);
console.log("Seeded cyphers visible:", hasCyphers);
console.log("Console errors:", errors.length ? errors.slice(0,3).join("; ") : "none");

await page.screenshot({ path: "C:\\Temp\\full_stack.png" });

await browser.close();
console.log("\nFrontend tunnel:", FRONTEND);
console.log("Backend tunnel: ", BACKEND);
