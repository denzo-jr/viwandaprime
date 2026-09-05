import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MODULES } from "@/lib/tz";
import { tzs, timeAgo } from "@/lib/format";
import BottomNav from "@/components/BottomNav";
import { Avatar, SectionTitle, StatusTag } from "@/components/ui";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [openJobs, machines, waste, labour, unread, myActivity] =
    await Promise.all([
      prisma.jobRequest.count({ where: { status: "OPEN" } }),
      prisma.machine.count({ where: { available: true } }),
      prisma.wasteListing.count({ where: { status: "AVAILABLE" } }),
      prisma.labourJob.count({ where: { status: "OPEN" } }),
      prisma.notification.count({ where: { userId: user.id } }),
      prisma.jobRequest.findMany({
        where: {
          OR: [{ businessId: user.id }, { technicianId: user.id }],
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { quotes: true },
      }),
    ]);

  const counts: Record<string, number> = {
    fundilink: openJobs,
    machineshare: machines,
    takatrade: waste,
    kibaruapay: labour,
  };
  const countLabel: Record<string, string> = {
    fundilink: "open jobs",
    machineshare: "listings",
    takatrade: "materials",
    kibaruapay: "jobs hiring",
  };

  return (
    <main className="with-nav">
      <header className="pad pt-7 pb-5 flex items-center gap-3">
        <Avatar name={user.name} color={user.avatarColor} />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--color-mist)]">Habari,</p>
          <p className="font-bold truncate">
            {user.businessName ?? user.name}
          </p>
        </div>
        <Link
          href="/inbox"
          aria-label="Notifications"
          className="relative w-11 h-11 grid place-items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-2)]"
        >
          <Bell size={19} className="text-[var(--color-mist)]" />
          {unread > 0 ? (
            <span
              className="absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center rounded-full text-[0.65rem] font-bold"
              style={{ background: "#f59e0b", color: "#1a1205" }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Link>
      </header>

      <section className="pad">
        <div
          className="card p-4 flex items-center justify-between gap-3"
          style={{ borderColor: "#f59e0b44" }}
        >
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-mist)]">
              KibaruaPay wallet
            </p>
            <p
              className="display text-xl mt-0.5 truncate"
              style={{ color: "#f59e0b" }}
            >
              {tzs(user.walletBalance)}
            </p>
          </div>
          <Link
            href="/kibaruapay"
            className="btn btn-ghost h-11 min-h-11 shrink-0 whitespace-nowrap"
          >
            Earn more
          </Link>
        </div>
      </section>

      <section className="pad mt-7">
        <SectionTitle>What do you need today?</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {MODULES.map((m, i) => (
            <Link
              key={m.slug}
              href={m.href}
              className="card p-4 rise"
              style={{
                animationDelay: `${i * 60}ms`,
                borderColor: `${m.accent}33`,
              }}
            >
              <div
                className="w-8 h-1.5 rounded-full mb-3"
                style={{ background: m.accent }}
              />
              <p className="display text-sm" style={{ color: m.accent }}>
                {m.name}
              </p>
              <p className="text-xs text-[var(--color-mist)] mt-1">
                {m.swahili}
              </p>
              <p className="text-xs mt-3 font-semibold">
                {counts[m.slug]}{" "}
                <span className="text-[var(--color-mist)] font-normal">
                  {countLabel[m.slug]}
                </span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {myActivity.length > 0 ? (
        <section className="pad mt-8">
          <SectionTitle
            right={
              <Link
                href="/account"
                className="text-xs font-semibold"
                style={{ color: "#f59e0b" }}
              >
                See all
              </Link>
            }
          >
            Your repair jobs
          </SectionTitle>
          <div className="flex flex-col gap-2.5">
            {myActivity.map((job) => (
              <Link
                key={job.id}
                href={`/fundilink/jobs/${job.id}`}
                className="card p-3.5 flex items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{job.title}</p>
                  <p className="text-xs text-[var(--color-mist)] mt-1">
                    {job.quotes.length} quote
                    {job.quotes.length === 1 ? "" : "s"} ·{" "}
                    {timeAgo(job.createdAt)}
                  </p>
                </div>
                <StatusTag status={job.status} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="pad mt-8">
        <Link
          href="/ussd"
          className="card p-4 flex items-center gap-3"
          style={{ borderColor: "#22c55e33" }}
        >
          <div
            className="w-10 h-10 rounded-xl grid place-items-center font-mono text-xs font-bold shrink-0"
            style={{ background: "#22c55e1f", color: "#22c55e" }}
          >
            *384#
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">No smartphone? No problem.</p>
            <p className="text-xs text-[var(--color-mist)] mt-0.5">
              Try the USSD flow for feature phones
            </p>
          </div>
          <ArrowRight size={17} className="text-[var(--color-mist)]" />
        </Link>
      </section>

      <BottomNav />
    </main>
  );
}
