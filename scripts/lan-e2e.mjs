// Drive a real login + job post against the LAN URL to prove server actions work.
import puppeteer from "puppeteer-core";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = process.argv[2];

const browser = await puppeteer.launch({
  executablePath: EDGE, headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 430, height: 932 });

// 1. Log in through the real form (server action)
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.type("#phone", "0754110001");
await page.type("#password", "1234");
await Promise.all([
  page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
  page.click("button[type=submit], .btn-primary"),
]);
console.log("after login ->", new URL(page.url()).pathname);

// 2. Post a repair job (another server action, with redirect)
await page.goto(`${BASE}/fundilink/request`, { waitUntil: "domcontentloaded" });
await page.type("#title", "LAN smoke test - pump seal leak");
await page.type("#description", "Posted from a LAN end-to-end check.");
await Promise.all([
  page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
  page.click(".btn-primary"),
]);
const path = new URL(page.url()).pathname;
console.log("after job post ->", path);
console.log("server actions over LAN:", path.startsWith("/fundilink/jobs/") ? "WORKING" : "FAILED");

await browser.close();
