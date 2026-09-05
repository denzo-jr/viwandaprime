import puppeteer from "puppeteer-core";
import fs from "node:fs";

const OUT = process.argv[2];
const TOKEN = fs.readFileSync(process.argv[3], "utf8").trim();
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
await page.setCookie({
  name: "vp_session", value: TOKEN, domain: "localhost", path: "/",
});

const shots = JSON.parse(fs.readFileSync(process.argv[4], "utf8"));
for (const [name, url] of Object.entries(shots)) {
  await page.goto(`http://localhost:3000${url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1400));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log("shot", name);
}
await browser.close();
