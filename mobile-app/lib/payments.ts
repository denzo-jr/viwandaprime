/**
 * KibaruaPay escrow.
 *
 * Money moves in two steps: the buyer/business funds an escrow hold, then the
 * platform releases it to the technician/worker/seller once work is confirmed.
 * The mobile-money leg is simulated here; swapping in Africa's Talking Payments
 * means replacing `chargeMobileMoney` only.
 */

import { prisma } from "./db";
import { notify } from "./africastalking";
import { tzs } from "./format";

export type PaymentPurpose = "JOB" | "BOOKING" | "WASTE" | "LABOUR";

export function makeReference(purpose: PaymentPurpose): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `VP-${purpose.slice(0, 3)}-${stamp}${rand}`;
}

/** Simulated mobile-money charge. Replace with the AT Payments call to go live. */
async function chargeMobileMoney(): Promise<{ ok: true }> {
  return { ok: true };
}

type HoldInput = {
  amount: number;
  method: string;
  purpose: PaymentPurpose;
  fromUserId: string;
  toUserId: string;
  jobId?: string;
  bookingId?: string;
  wasteOrderId?: string;
  labourApplicationId?: string;
};

/** Take the buyer's money and hold it in escrow. */
export async function holdInEscrow(input: HoldInput) {
  await chargeMobileMoney();

  const payment = await prisma.payment.create({
    data: {
      reference: makeReference(input.purpose),
      amount: input.amount,
      method: input.method,
      purpose: input.purpose,
      status: "HELD_IN_ESCROW",
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      jobId: input.jobId ?? null,
      bookingId: input.bookingId ?? null,
      wasteOrderId: input.wasteOrderId ?? null,
      labourApplicationId: input.labourApplicationId ?? null,
    },
    include: { fromUser: true, toUser: true },
  });

  await notify({
    to: payment.toUser.phone,
    userId: payment.toUserId,
    message: `Viwanda Prime: ${tzs(payment.amount)} from ${payment.fromUser.name} is now held in escrow (${payment.reference}). You will be paid once the work is confirmed.`,
  });

  return payment;
}

/** Release a held payment to the earner and credit their wallet. */
export async function releaseEscrow(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { fromUser: true, toUser: true },
  });
  if (!payment) throw new Error("PAYMENT_NOT_FOUND");
  if (payment.status === "RELEASED") return payment;

  const released = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "RELEASED", releasedAt: new Date() },
    include: { fromUser: true, toUser: true },
  });

  await prisma.user.update({
    where: { id: released.toUserId },
    data: { walletBalance: { increment: released.amount } },
  });

  await notify({
    to: released.toUser.phone,
    userId: released.toUserId,
    message: `Viwanda Prime: ${tzs(released.amount)} has been released to you (${released.reference}). Asante kwa kazi nzuri.`,
  });

  return released;
}
