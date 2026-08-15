import { chromium } from "@playwright/test";

const base = "http://127.0.0.1:8080";
const out = "documentation_evidence/sahmi-current-evidence-2026-08-14/screenshots";
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  for (const [route, name] of [["/", "public-home-en.png"], ["/projects", "browse-projects-en.png"], ["/contact", "contact-en.png"]]) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${out}/${name}`, fullPage: true });
  }
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("sahmi.language", "ar"));
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: `${out}/public-home-ar-rtl.png`, fullPage: true });
} finally {
  await browser.close();
}
