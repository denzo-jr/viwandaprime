// Exercises the Africa's Talking adapter against the real API.
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

// load .env the way next does
fs.readFileSync(".env", "utf8").split("\n").forEach((l) => {
  const [k, ...r] = l.split("=");
  if (k && !k.startsWith("#")) process.env[k.trim()] = r.join("=").trim().replace(/^"|"$/g, "");
});

const prisma = new PrismaClient();
const { notify, notifyMany, fetchBalance, isLive, isSandbox } = await import("../lib/africastalking.ts");

console.log("live:", isLive(), "| sandbox:", isSandbox());
console.log("balance:", await fetchBalance());

const juma = await prisma.user.findUnique({ where: { phone: "+255754110002" } });
const before = await prisma.notification.count();

console.log("\n-- single send --");
const n = await notify({
  to: juma.phone,
  userId: juma.id,
  message: "Viwanda Prime: adapter check — single recipient.",
});
console.log(" status:", n.status, "| id:", n.providerId, "| cost:", n.cost, "| detail:", n.detail);

console.log("\n-- batch send (one API call) --");
const techs = await prisma.user.findMany({
  where: { roles: { contains: "TECHNICIAN" } },
  select: { id: true, phone: true },
});
await notifyMany(
  techs.map((t) => ({ to: t.phone, userId: t.id })),
  "Viwanda Prime: adapter check — batch to all technicians."
);
const rows = await prisma.notification.findMany({
  where: { message: { contains: "batch to all technicians" } },
});
console.log(" recipients:", rows.length);
rows.forEach((r) => console.log("  ", r.to, r.status, r.cost ?? "", r.detail ?? ""));

console.log("\nnotifications created:", (await prisma.notification.count()) - before);

// clean up so demo data stays pristine
await prisma.notification.deleteMany({ where: { message: { contains: "adapter check" } } });
console.log("cleaned up");
await prisma.$disconnect();
