"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify, notifyMany } from "@/lib/africastalking";
import { holdInEscrow, releaseEscrow } from "@/lib/payments";
import { tzs } from "@/lib/format";

export async function createLabourJobAction(formData: FormData) {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "Loading");
  const workersNeeded = Math.max(1, Number(formData.get("workersNeeded") ?? 1));
  const payRate = Number(formData.get("payRate") ?? 0);
  const payUnit = String(formData.get("payUnit") ?? "DAY");
  const durationDays = Math.max(1, Number(formData.get("durationDays") ?? 1));
  const startDateRaw = String(formData.get("startDate") ?? "");

  if (!title || !description || !payRate) return;

  const job = await prisma.labourJob.create({
    data: {
      title,
      description,
      category,
      workersNeeded,
      payRate,
      payUnit,
      durationDays,
      startDate: startDateRaw ? new Date(startDateRaw) : new Date(),
      region: user.region,
      district: user.district,
      businessId: user.id,
    },
  });

  // Every worker in the region gets the alert — this is the whole point.
  const workers = await prisma.user.findMany({
    where: { roles: { contains: "WORKER" }, region: user.region },
    select: { id: true, phone: true },
  });

  await notifyMany(
    workers.map((w) => ({ to: w.phone, userId: w.id })),
    `Viwanda Prime: ${workersNeeded} worker(s) needed in ${user.district} - ${title}. ${tzs(payRate)} per ${payUnit.toLowerCase()}. Open the app to apply.`
  );

  revalidatePath("/kibaruapay");
  redirect(`/kibaruapay/${job.id}`);
}

export async function applyAction(formData: FormData) {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!jobId || !message) return;

  const job = await prisma.labourJob.findUnique({
    where: { id: jobId },
    include: { business: true },
  });
  if (!job || job.status !== "OPEN") return;

  await prisma.labourApplication.upsert({
    where: { jobId_workerId: { jobId, workerId: user.id } },
    update: { message },
    create: { jobId, workerId: user.id, message },
  });

  await notify({
    to: job.business.phone,
    userId: job.businessId,
    message: `Viwanda Prime: ${user.name} applied for "${job.title}". Open the app to review.`,
  });

  revalidatePath(`/kibaruapay/${jobId}`);
}

/** Business accepts a worker and funds their pay into escrow up front. */
export async function acceptWorkerAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("applicationId") ?? "");
  const method = String(formData.get("method") ?? "MPESA");

  const application = await prisma.labourApplication.findUnique({
    where: { id: applicationId },
    include: { job: true, worker: true },
  });
  if (!application || application.job.businessId !== user.id) return;

  await prisma.labourApplication.update({
    where: { id: applicationId },
    data: { status: "ACCEPTED" },
  });

  const { job } = application;
  const totalPay =
    job.payUnit === "HOUR"
      ? job.payRate * 8 * job.durationDays
      : job.payUnit === "DAY"
        ? job.payRate * job.durationDays
        : job.payRate;

  await holdInEscrow({
    amount: totalPay,
    method,
    purpose: "LABOUR",
    fromUserId: user.id,
    toUserId: application.workerId,
    labourApplicationId: application.id,
  });

  await notify({
    to: application.worker.phone,
    userId: application.workerId,
    message: `Viwanda Prime: You are hired for "${job.title}" at ${user.businessName ?? user.name}. Starts ${job.startDate.toDateString()}. ${tzs(totalPay)} is secured in escrow.`,
  });

  const acceptedCount = await prisma.labourApplication.count({
    where: { jobId: job.id, status: "ACCEPTED" },
  });
  if (acceptedCount >= job.workersNeeded) {
    await prisma.labourJob.update({
      where: { id: job.id },
      data: { status: "FILLED" },
    });
  }

  revalidatePath(`/kibaruapay/${job.id}`);
}

/** Work confirmed done — the worker gets paid. */
export async function payWorkerAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("applicationId") ?? "");

  const application = await prisma.labourApplication.findUnique({
    where: { id: applicationId },
    include: { job: true, payments: true },
  });
  if (!application || application.job.businessId !== user.id) return;

  await prisma.labourApplication.update({
    where: { id: applicationId },
    data: { status: "COMPLETED" },
  });

  const held = application.payments.find((p) => p.status === "HELD_IN_ESCROW");
  if (held) await releaseEscrow(held.id);

  revalidatePath(`/kibaruapay/${application.jobId}`);
}
