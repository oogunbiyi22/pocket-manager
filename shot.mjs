import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

const targets = [
  { url: "http://localhost:3311/", file: "/tmp/shot-landing.png" },
  { url: "http://localhost:3311/onboarding", file: "/tmp/shot-onboarding.png" },
];

for (const t of targets) {
  try {
    await page.goto(t.url, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: t.file, fullPage: false });
    console.log("OK", t.url, "->", t.file);
  } catch (err) {
    console.log("FAIL", t.url, err.message);
  }
}

await browser.close();
