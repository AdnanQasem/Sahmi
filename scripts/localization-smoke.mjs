import { chromium } from "@playwright/test";

const base = process.env.SAHMI_PREVIEW_URL ?? "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let userType = "investor";
const user = () => ({ id: "smoke-user", username: "smoke", email: "smoke@example.com", full_name: "Smoke User", user_type: userType, is_staff: false, preferred_language: "ar" });
const pageResult = (results = []) => ({ count: results.length, next: null, previous: null, results });
await page.route("http://localhost:8000/api/v1/**", async (route) => {
  const url = route.request().url();
  const method = route.request().method();
  let body = {};
  if (url.includes("auth/me/")) body = user();
  else if (url.includes("notifications/unread-count")) body = { unread_count: 1 };
  else if (url.includes("notifications/preferences")) body = { in_app_enabled: true, email_enabled: false, message_notifications: true, project_notifications: true, investment_notifications: true, milestone_notifications: true, repayment_notifications: true };
  else if (url.includes("notifications/") && method === "GET") body = pageResult([{ id: "n1", notification_type: "system", title: "System", body: "Account update", read_at: null, created_at: new Date().toISOString(), target_type: "", target_id: "" }]);
  else if (url.includes("conversations/unread-count")) body = { unread_count: 0 };
  else if (url.includes("conversations/") && url.includes("messages")) body = pageResult([]);
  else if (url.endsWith("conversations/")) body = pageResult([]);
  else if (url.includes("investments/")) body = pageResult([]);
  else if (url.includes("projects/categories")) body = [];
  else if (url.includes("projects/")) body = pageResult([]);
  else body = method === "GET" ? pageResult([]) : { ok: true, ...user() };
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
});
const assert = (condition, message) => { if (!condition) throw new Error(message); };
await page.goto(base, { waitUntil: "networkidle" });
assert(await page.getByText("Home", { exact: true }).first().isVisible(), "English landing navigation missing");
await page.getByRole("button", { name: "العربية" }).first().click();
assert(await page.locator("html").getAttribute("dir") === "rtl", "Arabic did not set RTL");
assert(await page.getByText("الرئيسية", { exact: true }).first().isVisible(), "Arabic landing navigation missing");
for (const path of ["/projects", "/login", "/how-it-works", "/about", "/contact"]) {
  await page.goto(base + path, { waitUntil: "domcontentloaded" });
  assert(await page.locator("html").getAttribute("lang") === "ar", `Arabic persistence failed at ${path}`);
}
await page.evaluate((u) => { localStorage.setItem("accessToken", "smoke-token"); localStorage.setItem("user", JSON.stringify(u)); localStorage.setItem("sahmi.language", "ar"); }, user());
await page.goto(base + "/dashboard/investor", { waitUntil: "networkidle" });
assert(await page.getByText("الرسائل", { exact: true }).first().isVisible(), "Arabic investor dashboard navigation missing");
await page.getByLabel(/الإشعارات/).click();
assert(await page.getByText("إشعار النظام").isVisible(), "Arabic notifications missing");
await page.goto(base + "/dashboard/investor/messages", { waitUntil: "networkidle" });
assert(await page.getByRole("heading", { name: "الرسائل" }).isVisible(), "Arabic messages missing");
await page.goto(base + "/dashboard/investor/settings", { waitUntil: "networkidle" });
assert(await page.getByText("الإعدادات", { exact: true }).first().isVisible(), "Arabic settings missing");
userType = "entrepreneur";
await page.evaluate((u) => localStorage.setItem("user", JSON.stringify(u)), user());
for (const path of ["/start-project", "/dashboard/entrepreneur"]) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  assert(await page.locator("html").getAttribute("dir") === "rtl", `RTL failed at ${path}`);
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base, { waitUntil: "networkidle" });
assert(await page.locator("html").getAttribute("dir") === "rtl", "Mobile RTL persistence failed");
await page.getByRole("button", { name: "فتح القائمة" }).click();
assert(await page.locator("#mobile-navigation").getByText("تصفح المشاريع", { exact: true }).isVisible(), "Arabic mobile navigation missing");
await page.locator("#mobile-navigation").getByRole("button", { name: "English" }).click();
assert(await page.locator("html").getAttribute("dir") === "ltr", "English did not restore LTR");
await browser.close();
console.log("Localization browser smoke passed: public pages, auth, investor/entrepreneur dashboards, messages, notifications, settings, project form, desktop and mobile.");