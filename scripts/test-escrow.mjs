// End-to-end check of the escrow money flow.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const biz = await prisma.user.findUnique({ where: { phone: "+255754110001" } });
const tech = await prisma.user.findUnique({ where: { phone: "+255754110002" } });
const before = tech.walletBalance;

const { holdInEscrow, releaseEscrow } = await import("../lib/payments.ts");

const p = await holdInEscrow({
  amount: 275000, method: "MPESA", purpose: "JOB",
  fromUserId: biz.id, toUserId: tech.id,
});
console.log("held:", p.reference, p.status, p.amount);

const midTech = await prisma.user.findUnique({ where: { id: tech.id } });
console.log("wallet during escrow (should be unchanged):", midTech.walletBalance === before);

const r = await releaseEscrow(p.id);
const after = await prisma.user.findUnique({ where: { id: tech.id } });
console.log("released:", r.status, "| wallet", before, "->", after.walletBalance);
console.log("credited correctly:", after.walletBalance === before + 275000);

const notes = await prisma.notification.findMany({
  where: { userId: tech.id }, orderBy: { createdAt: "desc" }, take: 2,
});
notes.forEach((n) => console.log("SMS:", n.message));

// clean up so the demo data stays pristine
await prisma.payment.delete({ where: { id: p.id } });
await prisma.user.update({ where: { id: tech.id }, data: { walletBalance: before } });
await prisma.notification.deleteMany({ where: { id: { in: notes.map((n) => n.id) } } });
console.log("cleaned up");
await prisma.$disconnect();
