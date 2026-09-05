"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notifyMany, notify } from "@/lib/africastalking";
import { holdInEscrow, releaseEscrow } from "@/lib/payments";
import { tzs, tzsShort } from "@/lib/format";

export async function createJobAction(formData: FormData) {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const machineType = String(formData.get("machineType") ?? "").trim();
  const urgency = String(formData.get("urgency") ?? "NORMAL");
  const budgetMin = Number(formData.get("budgetMin") ?? 0) || null;
  const budgetMax = Number(formData.get("budgetMax") ?? 0) || null;

  if (!title || !description || !machineType) return;

  const job = await prisma.jobRequest.create({
    data: {
      title,
      description,
      machineType,
      urgency,
      region: user.region,
      district: user.district,
      budgetMin,
      budgetMax,
      businessId: user.id,
    },
  });

  // Alert every technician in the same region — this is the SMS that matters.
  const techs = await prisma.user.findMany({
    where: { roles: { contains: "TECHNICIAN" }, region: user.region },
    select: { id: true, phone: true },
  });

  const budget =
    budgetMin && budgetMax
      ? ` Budget ${tzsShort(budgetMin)}-${tzsShort(budgetMax)}.`
      : "";

  await notifyMany(
    techs.map((t) => ({ to: t.phone, userId: t.id })),
    `Viwanda Prime: New ${urgency} job in ${user.district} - ${title}.${budget} Open the app to quote.`
  );

  revalidatePath("/fundilink");
  redirect(`/fundilink/jobs/${job.id}`);
}

export async function submitQuoteAction(formData: FormData) {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const etaHours = Number(formData.get("etaHours") ?? 24);
  const message = String(formData.get("message") ?? "").trim();

  if (!jobId || !price || !message) return;

  const job = await prisma.jobRequest.findUnique({
    where: { id: jobId },
    include: { business: true },
  });
  if (!job || job.status !== "OPEN") return;

  await prisma.quote.upsert({
    where: { jobId_technicianId: { jobId, technicianId: user.id } },
    update: { price, etaHours, message },
    create: { jobId, technicianId: user.id, price, etaHours, message },
  });

  await notify({
    to: job.business.phone,
    userId: job.businessId,
    message: `Viwanda Prime: ${user.name} quoted ${tzs(price)} for "${job.title}" and can arrive in ${etaHours}h. Open the app to accept.`,
  });

  revalidatePath(`/fundilink/jobs/${jobId}`);
}

/** Business accepts a quote — money moves into escrow immediately. */
export async function acceptQuoteAction(formData: FormData) {
  const user = await requireUser();
  const quoteId = String(formData.get("quoteId") ?? "");
  const method = String(formData.get("method") ?? "MPESA");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { job: true, technician: true },
  });
  if (!quote || quote.job.businessId !== user.id) return;

  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quoteId },
      data: { status: "ACCEPTED" },
    }),
    prisma.quote.updateMany({
      where: { jobId: quote.jobId, id: { not: quoteId } },
      data: { status: "REJECTED" },
    }),
    prisma.jobRequest.update({
      where: { id: quote.jobId },
      data: {
        status: "ASSIGNED",
        technicianId: quote.technicianId,
        agreedPrice: quote.price,
      },
    }),
  ]);

  await holdInEscrow({
    amount: quote.price,
    method,
    purpose: "JOB",
    fromUserId: user.id,
    toUserId: quote.technicianId,
    jobId: quote.jobId,
  });

  await notify({
    to: quote.technician.phone,
    userId: quote.technicianId,
    message: `Viwanda Prime: ${user.businessName ?? user.name} accepted your quote for "${quote.job.title}". Go on site and mark it complete when done.`,
  });

  revalidatePath(`/fundilink/jobs/${quote.jobId}`);
}

/** Business confirms the repair — escrow is released to the technician. */
export async function completeJobAction(formData: FormData) {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");

  const job = await prisma.jobRequest.findUnique({
    where: { id: jobId },
    include: { payments: true },
  });
  if (!job || job.businessId !== user.id) return;

  await prisma.jobRequest.update({
    where: { id: jobId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  const held = job.payments.find((p) => p.status === "HELD_IN_ESCROW");
  if (held) await releaseEscrow(held.id);

  revalidatePath(`/fundilink/jobs/${jobId}`);
}

/** Technician marks work started. */
export async function startJobAction(formData: FormData) {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");
  const job = await prisma.jobRequest.findUnique({ where: { id: jobId } });
  if (!job || job.technicianId !== user.id) return;

  await prisma.jobRequest.update({
    where: { id: jobId },
    data: { status: "IN_PROGRESS" },
  });
  revalidatePath(`/fundilink/jobs/${jobId}`);
}
