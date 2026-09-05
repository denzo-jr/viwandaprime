"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { normalisePhone, REGIONS, USSD_CODE } from "@/lib/tz";
import { notify } from "@/lib/africastalking";

export type FormState = { error?: string } | undefined;

const AVATAR_COLORS = ["#f59e0b", "#0ea5e9", "#22c55e", "#a855f7", "#ef4444"];

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const phone = normalisePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!phone || !password) return { error: "Enter your phone and PIN." };

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return { error: "No account found for that number." };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Wrong PIN. Try again." };

  await createSession(user.id);
  redirect("/home");
}

export async function registerAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = normalisePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const roles = formData.getAll("roles").map(String);
  const region = String(formData.get("region") ?? "");
  const district = String(formData.get("district") ?? "");
  const businessName = String(formData.get("businessName") ?? "").trim();
  const skills = formData.getAll("skills").map(String);

  if (!name || !phone || !password) {
    return { error: "Name, phone and PIN are all required." };
  }
  if (password.length < 4) return { error: "Use a PIN of at least 4 digits." };
  if (roles.length === 0) return { error: "Choose at least one role." };
  if (!region) return { error: "Select your region." };

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return { error: "That number is already registered. Log in." };

  const validDistrict = REGIONS[region]?.includes(district)
    ? district
    : (REGIONS[region]?.[0] ?? "");

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      passwordHash: await hashPassword(password),
      roles: roles.join(","),
      region,
      district: validDistrict,
      businessName: businessName || null,
      skills: skills.length ? skills.join(",") : null,
      avatarColor:
        AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    },
  });

  await notify({
    to: user.phone,
    userId: user.id,
    message: `Karibu Viwanda Prime, ${user.name}! Your account is ready. Dial ${USSD_CODE} or open the app to find work, technicians, machines and materials.`,
  });

  await createSession(user.id);
  redirect("/home");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

/** One-tap demo login used by the landing page persona switcher. */
export async function demoLoginAction(formData: FormData) {
  const phone = String(formData.get("phone") ?? "");
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) redirect("/login");
  await createSession(user.id);
  redirect("/home");
}
