/**
 * Fires one SMS immediately, for checking the Africa's Talking simulator.
 *
 *   npm run sms:test                     -> sends to the owner handset
 *   npm run sms:test +255754110002       -> sends to a specific number
 *
 * Connect the AT simulator with that number FIRST — sandbox does not backfill
 * messages sent before the simulator was connected.
 */
import fs from "node:fs";

fs.readFileSync(".env", "utf8").split("\n").forEach((l) => {
  const i = l.indexOf("=");
  if (i > 0 && !l.trim().startsWith("#"))
    process.env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, "");
});

const to = process.argv[2] ?? "+255787400249";
const username = process.env.AT_USERNAME ?? "sandbox";
const base =
  username === "sandbox"
    ? "https://api.sandbox.africastalking.com"
    : "https://api.africastalking.com";

const message = `Viwanda Prime test at ${new Date().toLocaleTimeString("en-GB")} - if you can read this, SMS delivery is working.`;

const body = new URLSearchParams({ username, to, message });
const res = await fetch(`${base}/version1/messaging`, {
  method: "POST",
  headers: {
    apiKey: process.env.AT_API_KEY,
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  },
  body,
});

const json = await res.json();
const r = json?.SMSMessageData?.Recipients?.[0];

console.log(`\n  to        ${to}`);
console.log(`  provider  ${json?.SMSMessageData?.Message ?? "(no message)"}`);
if (r) {
  console.log(`  status    ${r.status} (${r.statusCode})`);
  console.log(`  messageId ${r.messageId}`);
  console.log(`  cost      ${r.cost}`);
}
console.log(
  r?.status === "Success"
    ? "\n  Africa's Talking accepted it. If the simulator shows nothing, the\n  simulator was not connected with this number when it was sent.\n"
    : "\n  Not accepted — see the provider message above.\n"
);
