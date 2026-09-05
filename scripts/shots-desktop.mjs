import puppeteer from "puppeteer-core";
import fs from "node:fs";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const OUT = process.argv[2];
const TOKEN = fs.readFileSync(process.argv[3], "utf8").trim();
const shots = JSON.parse(fs.readFileSync(process.argv[4], "utf8"));
const W = Number(process.argv[5] || 1440), H = Number(process.argv[6] || 900);
const full = process.argv[7] === "full";

const browser = await puppeteer.launch({
  executablePath: EDGE, headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", `--window-size=${W},${H}`],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.setCookie({ name: "vp_session", value: TOKEN, domain: "localhost", path: "/" });

for (const [name, url] of Object.entries(shots)) {
  await page.goto(`http://localhost:3000${url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  if (full) {
    // Scroll through so IntersectionObserver reveals fire, then return to top.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.7;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 160));
      }
      window.scrollTo(0, 0);
    });
  }
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log("shot", name);
}
await browser.close();
