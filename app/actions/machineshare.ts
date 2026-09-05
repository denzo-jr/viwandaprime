"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/africastalking";
import { holdInEscrow } from "@/lib/payments";
import { tzs } from "@/lib/format";

export async function createMachineAction(formData: FormData) {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "Machinery");
  const kind = String(formData.get("kind") ?? "RENT");
  const description = String(formData.get("description") ?? "").trim();
  const condition = String(formData.get("condition") ?? "GOOD");
  const price = Number(formData.get("price") ?? 0);
  const priceUnit = String(formData.get("priceUnit") ?? "DAY");

  if (!name || !description || !price) return;

  const machine = await prisma.machine.create({
    data: {
      name,
      category,
      kind,
      description,
      condition,
      price,
      priceUnit: kind === "SALE" ? "ITEM" : priceUnit,
      region: user.region,
      district: user.district,
      ownerId: user.id,
      imageEmoji: category.slice(0, 4).toUpperCase(),
    },
  });

  revalidatePath("/machineshare");
  redirect(`/machineshare/${machine.id}`);
}

export async function bookMachineAction(formData: FormData) {
  const user = await requireUser();
  const machineId = String(formData.get("machineId") ?? "");
  const days = Math.max(1, Number(formData.get("days") ?? 1));
  const method = String(formData.get("method") ?? "MPESA");

  const machine = await prisma.machine.findUnique({
    where: { id: machineId },
    include: { owner: true },
  });
  if (!machine || !machine.available) return;
  if (machine.ownerId === user.id) return;

  const isSale = machine.kind === "SALE";
  const totalPrice = isSale ? machine.price : machine.price * days;
  const startDate = new Date();
  const endDate = new Date(Date.now() + days * 86_400_000);

  const booking = await prisma.booking.create({
    data: {
      machineId,
      renterId: user.id,
      startDate,
      endDate,
      days: isSale ? 1 : days,
      totalPrice,
      status: "CONFIRMED",
    },
  });

  await holdInEscrow({
    amount: totalPrice,
    method,
    purpose: "BOOKING",
    fromUserId: user.id,
    toUserId: machine.ownerId,
    bookingId: booking.id,
  });

  if (isSale) {
    await prisma.machine.update({
      where: { id: machineId },
      data: { available: false },
    });
  }

  await notify({
    to: machine.owner.phone,
    userId: machine.ownerId,
    message: `Viwanda Prime: ${user.businessName ?? user.name} ${isSale ? "bought" : `booked ${days} day(s) of`} your "${machine.name}" for ${tzs(totalPrice)}. Funds are in escrow.`,
  });

  revalidatePath(`/machineshare/${machineId}`);
  redirect(`/machineshare/${machineId}?booked=1`);
}
