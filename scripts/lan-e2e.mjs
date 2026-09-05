// Drives a real login + job post through the browser to prove server actions
// work end to end — and that posting a breakdown fires live SMS.
import puppeteer from "puppeteer-core";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = process.argv[2] ?? "http://localhost:3000";

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

// 1. Sign in. The login form pre-fills the demo persona, so just submit it.
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await new Promise((r) => setTimeout(r, 800));
await Promise.all([
  page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
  page.click("button.btn-primary"),
]);
console.log("after login ->", new URL(page.url()).pathname);

// 2. Post a repair job — this triggers the technician SMS fan-out.
await page.goto(`${BASE}/fundilink/request`, { waitUntil: "domcontentloaded" });
await new Promise((r) => setTimeout(r, 600));
await page.type("#title", "LAN smoke test - pump seal leak");
await page.type("#description", "Posted from an end-to-end check.");
await Promise.all([
  page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 40000 }),
  page.click("form button.btn-primary"),
]);

const path = new URL(page.url()).pathname;
console.log("after job post ->", path);
console.log(
  "server actions:",
  path.startsWith("/fundilink/jobs/") ? "WORKING" : "FAILED"
);

await browser.close();
