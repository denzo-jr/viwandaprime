import { redirect } from "next/navigation";
import { MessageSquare, Wallet } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { isLive, isSandbox, fetchBalance } from "@/lib/africastalking";
import { EmptyState, Eyebrow, PageHeader, StatusTag } from "@/components/ui";

export default async function InboxPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [messages, balance, sent, failed] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    fetchBalance(),
    prisma.notification.count({ where: { status: "SENT" } }),
    prisma.notification.count({ where: { status: { in: ["FAILED", "BLOCKED"] } } }),
  ]);

  const live = isLive();
  const sandbox = isSandbox();

  const mode = !live
    ? { label: "Simulator", tone: "#71807d", bg: "#eef2f0" }
    : sandbox
      ? { label: "Sandbox", tone: "#bf572d", bg: "#fff1e7" }
      : { label: "Live", tone: "#328044", bg: "#e7f5e9" };

  return (
    <main className="with-nav">
      <PageHeader
        topLevel
        crumb="Factory / Messages"
        title="SMS inbox"
        subtitle={`Messages sent to ${user.phone}`}
        back="/home"
      />

      <div className="pad">
        {/* Provider status */}
        <section className="panel p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Eyebrow>Africa&rsquo;s Talking</Eyebrow>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span
                  className="badge"
                  style={{ background: mode.bg, color: mode.tone }}
                >
                  ● {mode.label}
                </span>
                <span className="text-[0.85rem] font-bold">
                  {!live
                    ? "No API key — messages are stored, not sent"
                    : sandbox
                      ? "Connected · delivering to the sandbox simulator"
                      : "Connected · delivering to real handsets"}
                </span>
              </div>
              <p className="text-[0.8rem] text-[var(--color-mist)] mt-2 leading-relaxed max-w-xl">
                {!live
                  ? "Set AT_API_KEY in .env to start delivering through the provider."
                  : sandbox
                    ? "Sandbox never reaches a real phone, so the seeded demo numbers are safe to message."
                    : "Seeded demo numbers are withheld on a live account unless AT_ALLOW_DEMO_NUMBERS=true."}
              </p>
            </div>

            {balance ? (
              <div className="shrink-0">
                <Eyebrow>Account balance</Eyebrow>
                <p className="display text-[1.25rem] mt-1 inline-flex items-center gap-2">
                  <Wallet size={17} style={{ color: "#00877d" }} />
                  {balance}
                </p>
              </div>
            ) : null}
          </div>

          {live ? (
            <div className="flex gap-6 mt-5 pt-4 border-t border-[var(--color-line)]">
              <span className="text-[0.8rem]">
                <b className="display text-[1.05rem]">{sent}</b>{" "}
                <span className="text-[var(--color-mist)]">delivered</span>
              </span>
              <span className="text-[0.8rem]">
                <b className="display text-[1.05rem]">{failed}</b>{" "}
                <span className="text-[var(--color-mist)]">
                  failed or withheld
                </span>
              </span>
            </div>
          ) : null}
        </section>

        {/* Message log */}
        <section className="mt-6">
          <Eyebrow>Message log</Eyebrow>
          <h2 className="display text-[1.05rem] mt-0.5 mb-4">
            {messages.length} message{messages.length === 1 ? "" : "s"}
          </h2>

          {messages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              hint="Job alerts, quotes and payment confirmations arrive here."
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {messages.map((m) => (
                <div key={m.id} className="panel p-5">
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <MessageSquare
                      size={14}
                      style={{ color: "#00877d" }}
                      className="shrink-0"
                    />
                    <span className="eyebrow">
                      {process.env.AT_SENDER_ID ?? "VIWANDA"} · {m.channel}
                    </span>
                    <StatusTag status={m.status} />
                    <span className="eyebrow ml-auto">
                      {timeAgo(m.createdAt)}
                    </span>
                  </div>

                  <p className="text-[0.88rem] leading-relaxed">{m.message}</p>

                  {m.providerId || m.cost || m.detail ? (
                    <div className="mt-3 pt-3 border-t border-[var(--color-line)] flex flex-wrap gap-x-4 gap-y-1">
                      {m.cost ? (
                        <span className="eyebrow">Cost {m.cost}</span>
                      ) : null}
                      {m.providerId ? (
                        <span className="eyebrow truncate max-w-full">
                          {m.providerId}
                        </span>
                      ) : null}
                      {m.detail ? (
                        <span
                          className="eyebrow"
                          style={{ color: "#c43e21" }}
                        >
                          {m.detail}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
