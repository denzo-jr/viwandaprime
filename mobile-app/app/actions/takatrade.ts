"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/africastalking";
import { holdInEscrow } from "@/lib/payments";
import { tzs } from "@/lib/format";

export async function createListingAction(formData: FormData) {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const material = String(formData.get("material") ?? "").trim();
  const category = String(formData.get("category") ?? "Metal");
  const description = String(formData.get("description") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);
  const unit = String(formData.get("unit") ?? "KG");
  const pricePerUnit = Number(formData.get("pricePerUnit") ?? 0);

  if (!title || !material || !quantity || !pricePerUnit) return;

  const listing = await prisma.wasteListing.create({
    data: {
      title,
      material,
      category,
      description,
      quantity,
      unit,
      pricePerUnit,
      region: user.region,
      district: user.district,
      sellerId: user.id,
      imageEmoji: category.slice(0, 4).toUpperCase(),
    },
  });

  revalidatePath("/takatrade");
  redirect(`/takatrade/${listing.id}`);
}

export async function orderWasteAction(formData: FormData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const method = String(formData.get("method") ?? "MPESA");

  const listing = await prisma.wasteListing.findUnique({
    where: { id: listingId },
    include: { seller: true },
  });
  if (!listing || listing.status === "SOLD") return;
  if (listing.sellerId === user.id) return;

  const qty = Math.min(Math.max(quantity, 0.1), listing.quantity);
  const totalPrice = Math.round(qty * listing.pricePerUnit);

  const order = await prisma.wasteOrder.create({
    data: {
      listingId,
      buyerId: user.id,
      quantity: qty,
      totalPrice,
      status: "CONFIRMED",
    },
  });

  await holdInEscrow({
    amount: totalPrice,
    method,
    purpose: "WASTE",
    fromUserId: user.id,
    toUserId: listing.sellerId,
    wasteOrderId: order.id,
  });

  const remaining = listing.quantity - qty;
  await prisma.wasteListing.update({
    where: { id: listingId },
    data: {
      quantity: remaining,
      status: remaining <= 0 ? "SOLD" : "AVAILABLE",
    },
  });

  await notify({
    to: listing.seller.phone,
    userId: listing.sellerId,
    message: `Viwanda Prime: ${user.businessName ?? user.name} ordered ${qty} ${listing.unit} of "${listing.material}" for ${tzs(totalPrice)}. Arrange collection.`,
  });

  revalidatePath(`/takatrade/${listingId}`);
  redirect(`/takatrade/${listingId}?ordered=1`);
}
