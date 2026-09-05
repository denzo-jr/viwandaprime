/**
 * Africa's Talking adapter.
 *
 * Every outbound message in the product goes through `notify()` / `notifyMany()`,
 * and each one is recorded in the Notification table so the in-app SMS inbox
 * shows exactly what was sent, delivered or refused.
 *
 * Modes:
 *   - No AT_API_KEY        -> simulator. Nothing leaves the machine.
 *   - AT_USERNAME=sandbox  -> real API, but Africa's Talking only delivers to
 *                             the sandbox simulator, never to real handsets.
 *   - A live username      -> real SMS to real phones.
 */

import { prisma } from "./db";

const SANDBOX_HOST = "https://api.sandbox.africastalking.com";
const LIVE_HOST = "https://api.africastalking.com";

export function isLive(): boolean {
  return Boolean(process.env.AT_API_KEY);
}

export function isSandbox(): boolean {
  return (process.env.AT_USERNAME ?? "sandbox") === "sandbox";
}

function host(): string {
  return isSandbox() ? SANDBOX_HOST : LIVE_HOST;
}

/**
 * The seeded personas use invented Tanzanian numbers. In sandbox nothing
 * reaches a handset, but against a live account those digits belong to real
 * people — so refuse them unless someone deliberately opts in.
 */
const DEMO_NUMBERS = new Set([
  "+255754110001",
  "+255754110002",
  "+255754110003",
  ...Array.from({ length: 4 }, (_, i) => `+25575422000${i + 1}`),
  ...Array.from({ length: 4 }, (_, i) => `+25575433000${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `+25575444000${i + 1}`),
]);

function isBlocked(to: string): boolean {
  if (isSandbox()) return false;
  if (process.env.AT_ALLOW_DEMO_NUMBERS === "true") return false;
  return DEMO_NUMBERS.has(to);
}

type Recipient = {
  cost?: string;
  messageId?: string;
  number?: string;
  status?: string;
  statusCode?: number;
};

/** Africa's Talking returns PascalCase keys. */
type SendResult = {
  Message?: string;
  Recipients?: Recipient[];
};

/** One POST to the messaging endpoint. `to` may be a comma-separated list. */
async function postSMS(to: string, message: string, useSenderId: boolean) {
  const username = process.env.AT_USERNAME ?? "sandbox";
  const body = new URLSearchParams({ username, to, message });

  const senderId = process.env.AT_SENDER_ID;
  if (useSenderId && senderId) body.set("from", senderId);

  const res = await fetch(`${host()}/version1/messaging`, {
    method: "POST",
    headers: {
      apiKey: process.env.AT_API_KEY as string,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  const raw = await res.text();
  let parsed: { SMSMessageData?: SendResult } | null = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    /* fall through — `raw` is reported as the failure detail */
  }

  return {
    ok: res.ok,
    message: parsed?.SMSMessageData?.Message ?? raw.slice(0, 200),
    recipients: parsed?.SMSMessageData?.Recipients ?? [],
  };
}

/**
 * Send to one or more numbers.
 *
 * An alphanumeric sender ID has to be registered with Africa's Talking, and is
 * always rejected on sandbox. Rather than failing the send, we drop the sender
 * ID and retry once — the message still goes out, from the shared short code.
 */
async function deliver(to: string, message: string) {
  const senderId = process.env.AT_SENDER_ID;

  // A single network blip should not lose a job alert, so retry once.
  let result;
  try {
    result = await postSMS(to, message, Boolean(senderId));
  } catch {
    await new Promise((r) => setTimeout(r, 700));
    result = await postSMS(to, message, Boolean(senderId));
  }

  if (senderId && result.message === "InvalidSenderId") {
    result = await postSMS(to, message, false);
  }

  return result;
}

type NotifyInput = {
  to: string;
  message: string;
  userId?: string | null;
  channel?: "SMS" | "USSD" | "IN_APP";
};

/** Queue a message to one person and record the outcome. */
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

  if (isBlocked(to)) {
    return prisma.notification.create({
      data: {
        to,
        message,
        channel,
        status: "BLOCKED",
        provider: "africastalking",
        detail:
          "Seeded demo number withheld on a live account. Set AT_ALLOW_DEMO_NUMBERS=true to override.",
        userId: userId ?? null,
      },
    });
  }

  try {
    const result = await deliver(to, message);
    const r = result.recipients[0];
    const sent = r?.status === "Success";

    return prisma.notification.create({
      data: {
        to,
        message,
        channel,
        status: sent ? "SENT" : "FAILED",
        provider: "africastalking",
        providerId: r?.messageId ?? null,
        cost: r?.cost ?? null,
        detail: sent ? null : (r?.status ?? result.message),
        userId: userId ?? null,
      },
    });
  } catch (error) {
    return prisma.notification.create({
      data: {
        to,
        message,
        channel,
        status: "FAILED",
        provider: "africastalking",
        detail: error instanceof Error ? error.message : "Network error",
        userId: userId ?? null,
      },
    });
  }
}

/**
 * Send the same message to many people. Africa's Talking accepts a
 * comma-separated recipient list, so this is one API call rather than N.
 */
export async function notifyMany(
  recipients: { to: string; userId?: string | null }[],
  message: string
) {
  if (recipients.length === 0) return;

  if (!isLive()) {
    await prisma.notification.createMany({
      data: recipients.map((r) => ({
        to: r.to,
        message,
        channel: "SMS",
        status: "SIMULATED",
        provider: "simulator",
        userId: r.userId ?? null,
      })),
    });
    return;
  }

  const allowed = recipients.filter((r) => !isBlocked(r.to));
  const blocked = recipients.filter((r) => isBlocked(r.to));

  if (blocked.length > 0) {
    await prisma.notification.createMany({
      data: blocked.map((r) => ({
        to: r.to,
        message,
        channel: "SMS",
        status: "BLOCKED",
        provider: "africastalking",
        detail:
          "Seeded demo number withheld on a live account. Set AT_ALLOW_DEMO_NUMBERS=true to override.",
        userId: r.userId ?? null,
      })),
    });
  }

  if (allowed.length === 0) return;

  try {
    const result = await deliver(
      allowed.map((r) => r.to).join(","),
      message
    );

    // Map the provider's per-recipient results back onto our users.
    const byNumber = new Map<string, Recipient>(
      result.recipients.map((r: Recipient) => [r.number ?? "", r])
    );

    await prisma.notification.createMany({
      data: allowed.map((r) => {
        const hit = byNumber.get(r.to);
        const sent = hit?.status === "Success";
        return {
          to: r.to,
          message,
          channel: "SMS",
          status: sent ? "SENT" : "FAILED",
          provider: "africastalking",
          providerId: hit?.messageId ?? null,
          cost: hit?.cost ?? null,
          detail: sent ? null : (hit?.status ?? result.message),
          userId: r.userId ?? null,
        };
      }),
    });
  } catch (error) {
    await prisma.notification.createMany({
      data: allowed.map((r) => ({
        to: r.to,
        message,
        channel: "SMS",
        status: "FAILED",
        provider: "africastalking",
        detail: error instanceof Error ? error.message : "Network error",
        userId: r.userId ?? null,
      })),
    });
  }
}

/** Account balance — used by the USSD/SMS status panel. */
export async function fetchBalance(): Promise<string | null> {
  if (!isLive()) return null;
  const username = process.env.AT_USERNAME ?? "sandbox";
  try {
    const res = await fetch(
      `${host()}/version1/user?username=${encodeURIComponent(username)}`,
      {
        headers: {
          apiKey: process.env.AT_API_KEY as string,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { UserData?: { balance?: string } };
    return json?.UserData?.balance ?? null;
  } catch {
    return null;
  }
}
