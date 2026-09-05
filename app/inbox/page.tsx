import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { isLive } from "@/lib/africastalking";
import { EmptyState, PageHeader } from "@/components/ui";

export default async function InboxPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const messages = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="pb-20">
      <PageHeader
        title="SMS inbox"
        subtitle={`Messages sent to ${user.phone}`}
        back="/home"
      />

      <section className="pad">
        <div
          className="card p-3.5"
          style={{ borderColor: isLive() ? "#22c55e44" : "#f59e0b44" }}
        >
          <p className="text-xs leading-relaxed text-[var(--color-mist)]">
            {isLive() ? (
              <>
                <span
                  className="font-semibold"
                  style={{ color: "#22c55e" }}
                >
                  Live mode
                </span>{" "}
                — messages are delivered through Africa&rsquo;s Talking.
              </>
            ) : (
              <>
                <span className="font-semibold" style={{ color: "#f59e0b" }}>
                  Simulator mode
                </span>{" "}
                — these are the exact SMS bodies that will be delivered once the
                Africa&rsquo;s Talking API key is set.
              </>
            )}
          </p>
        </div>
      </section>

      <section className="pad mt-5">
        {messages.length === 0 ? (
          <EmptyState
            title="No messages yet"
            hint="Job alerts, quotes and payment confirmations arrive here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div key={m.id} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare
                    size={14}
                    style={{ color: "#f59e0b" }}
                    className="shrink-0"
                  />
                  <span className="text-[0.68rem] font-semibold tracking-wide text-[var(--color-mist)]">
                    VIWANDA · {m.channel}
                  </span>
                  <span className="text-[0.68rem] text-[var(--color-mist)] ml-auto">
                    {timeAgo(m.createdAt)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{m.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
