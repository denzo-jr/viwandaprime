/**
 * Africa's Talking adapter.
 *
 * Right now this runs in SIMULATOR mode: every message is persisted to the
 * Notification table and shown in the in-app inbox, so the whole product works
 * offline and demos without credentials.
 *
 * To go live, set AT_API_KEY (and AT_USERNAME) in .env. `sendSMS` then POSTs to
 * the real Africa's Talking REST endpoint. No feature code changes — every
 * module calls `notify()` and nothing else.
 */

import { prisma } from "./db";

const AT_SMS_ENDPOINT_LIVE = "https://api.africastalking.com/version1/messaging";
const AT_SMS_ENDPOINT_SANDBOX =
  "https://api.sandbox.africastalking.com/version1/messaging";

export function isLive(): boolean {
  return Boolean(process.env.AT_API_KEY);
}

type NotifyInput = {
  to: string;
  message: string;
  userId?: string | null;
  channel?: "SMS" | "USSD" | "IN_APP";
};

/**
 * Queue a message to a user. Always records the notification; only hits the
 * network when credentials are present.
 */
export async function notify({
  to,
  message,
  userId,
  channel = "SMS",
}: NotifyInput) {
  if (!isLive()) {
    return prisma.notification.create({
      data: {
        to,
        message,
        channel,
        status: "SIMULATED",
        provider: "simulator",
        userId: userId ?? null,
      },
    });
  }

  const username = process.env.AT_USERNAME ?? "sandbox";
  const endpoint =
    username === "sandbox" ? AT_SMS_ENDPOINT_SANDBOX : AT_SMS_ENDPOINT_LIVE;

  const body = new URLSearchParams({ username, to, message });
  const senderId = process.env.AT_SENDER_ID;
  if (senderId) body.set("from", senderId);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apiKey: process.env.AT_API_KEY as string,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    const json = (await res.json()) as {
      SMSMessageData?: { Recipients?: { messageId?: string; status?: string }[] };
    };
    const recipient = json?.SMSMessageData?.Recipients?.[0];

    return prisma.notification.create({
      data: {
        to,
        message,
        channel,
        status: res.ok && recipient?.status === "Success" ? "SENT" : "FAILED",
        provider: "africastalking",
        providerId: recipient?.messageId ?? null,
        userId: userId ?? null,
      },
    });
  } catch {
    return prisma.notification.create({
      data: {
        to,
        message,
        channel,
        status: "FAILED",
        provider: "africastalking",
        userId: userId ?? null,
      },
    });
  }
}

/** Notify several people with the same message. */
export async function notifyMany(
  recipients: { to: string; userId?: string | null }[],
  message: string
) {
  await Promise.all(
    recipients.map((r) => notify({ to: r.to, userId: r.userId, message }))
  );
}
