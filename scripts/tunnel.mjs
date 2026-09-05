/**
 * Opens an ngrok tunnel to the local app and prints the URLs you need.
 *
 * The USSD webhook has to be reachable over public HTTPS for Africa's Talking
 * to call it, which a LAN address cannot do. Run this, then paste the callback
 * URL into the USSD channel in the Africa's Talking dashboard.
 *
 *   npm run tunnel
 */
import { spawn } from "node:child_process";

const PORT = process.argv[2] ?? "3000";

const proc = spawn("ngrok", ["http", PORT, "--log=stdout"], {
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});

proc.stderr.on("data", (d) => process.stderr.write(d));

async function readTunnel(attempt = 0) {
  try {
    const res = await fetch("http://127.0.0.1:4040/api/tunnels");
    const json = await res.json();
    const url = json.tunnels?.[0]?.public_url;
    if (url) return url;
  } catch {
    /* ngrok not up yet */
  }
  if (attempt > 20) return null;
  await new Promise((r) => setTimeout(r, 700));
  return readTunnel(attempt + 1);
}

const url = await readTunnel();

if (!url) {
  console.error("Could not read the tunnel URL from ngrok on 127.0.0.1:4040.");
  process.exit(1);
}

console.log(`
  Tunnel open
  ---------------------------------------------------------------
  App              ${url}
  USSD callback    ${url}/api/ussd

  Paste the callback into the Africa's Talking dashboard:
  Sandbox > USSD > Create Channel > Callback URL

  Note: on the free plan this URL changes every restart, and browsers
  see an ngrok interstitial once per session (click "Visit Site").
  Africa's Talking is unaffected — it is not a browser.

  Ctrl+C to close the tunnel.
  ---------------------------------------------------------------
`);

const stop = () => {
  proc.kill();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
