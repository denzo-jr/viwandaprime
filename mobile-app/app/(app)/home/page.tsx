import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  ChevronRight,
  Clock3,
  Gauge,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MODULES, USSD_CODE } from "@/lib/tz";
import { tzs, timeAgo } from "@/lib/format";
import { Avatar, Eyebrow, Stat, StatusTag } from "@/components/ui";

const TODAY = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

export default async function HomePage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [
    openJobs,
    activeRepairs,
    completedRepairs,
    machines,
    waste,
    labour,
    unread,
    recent,
  ] = await Promise.all([
    prisma.jobRequest.count({ where: { status: "OPEN" } }),
    prisma.jobRequest.count({
      where: {
        businessId: user.id,
        status: { in: ["ASSIGNED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "REPAIRING", "IN_PROGRESS"] },
      },
    }),
    prisma.jobRequest.count({
      where: { businessId: user.id, status: { in: ["COMPLETED", "CONFIRMED"] } },
    }),
    prisma.machine.count({ where: { available: true } }),
    prisma.wasteListing.count({ where: { status: "AVAILABLE" } }),
    prisma.labourJob.count({ where: { status: "OPEN" } }),
    prisma.notification.count({ where: { userId: user.id } }),
    prisma.jobRequest.findMany({
      where: { OR: [{ businessId: user.id }, { technicianId: user.id }] },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { quotes: true, technician: true },
    }),
  ]);

  const counts: Record<string, string> = {
    fundilink: `${openJobs} open`,
    machineshare: `${machines} listed`,
    takatrade: `${waste} materials`,
    kibaruapay: `${labour} hiring`,
  };

  return (
    <main className="with-nav">
      {/* Operations header */}
      <header className="mobile-home-header pad flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="mobile-mini-mark">V</span>
            <div>
              <Eyebrow>Viwanda Prime</Eyebrow>
              <h2 className="display text-[1.02rem] truncate">Operations hub</h2>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 lg:gap-[17px] shrink-0">
          <Link
            href="/inbox"
            aria-label="Notifications"
            className="relative w-[39px] h-[39px] grid place-items-center rounded-full border border-[var(--color-line)] bg-white"
          >
            <Bell size={18} className="text-[var(--color-mist)]" />
            {unread > 0 ? (
              <i
                className="absolute w-[6px] h-[6px] rounded-full right-[8px] top-[8px]"
                style={{ background: "#ff7449" }}
              />
            ) : null}
          </Link>
          <Avatar
            name={user.businessName ?? user.name}
            color={user.avatarColor}
            size={37}
          />
        </div>
      </header>

      <div className="pad pt-8">
        {/* Welcome + emergency affordance */}
        <div className="mobile-welcome flex flex-col gap-5 mb-7">
          <div>
            <Eyebrow>{TODAY.format(new Date()).toUpperCase()}</Eyebrow>
            <h1 className="display text-[1.65rem] lg:text-[1.75rem] mt-1.5">
              Habari, {(user.businessName ?? user.name).split(" ")[0]}.
            </h1>
            <p className="text-[0.82rem] text-[var(--color-mist)] mt-1.5">
              Here is how your production floor is looking today.
            </p>
          </div>

          <Link
            href="/fundilink/request"
            className="btn btn-emergency shrink-0 justify-start lg:justify-center"
          >
            <AlertTriangle size={20} />
            <span className="grid gap-[2px] text-left">
              <small className="mono text-[9px] opacity-80 leading-none">
                URGENT ISSUE?
              </small>
              <span className="text-[12px] font-extrabold leading-none">
                REPORT BREAKDOWN
              </span>
            </span>
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[15px] mb-6">
          <Stat
            icon={<Gauge size={18} />}
            value={machines}
            label="Machines available"
            tone="blue"
          />
          <Stat
            icon={<Wrench size={18} />}
            value={activeRepairs}
            label="Active repairs"
            tone="orange"
          />
          <Stat
            icon={<CheckCircle2 size={18} />}
            value={completedRepairs}
            label="Completed repairs"
            tone="green"
          />
          <Stat
            icon={<Clock3 size={18} />}
            value={tzs(user.walletBalance).replace("TSh ", "")}
            label="Wallet balance (TSh)"
            tone="purple"
          />
        </div>

        {/* Recent activity */}
        <section className="panel mb-6">
          <div className="panel-title">
            <div>
              <Eyebrow>Live activity</Eyebrow>
              <h3 className="display text-[1.05rem] mt-0.5">
                Recent repair requests
              </h3>
            </div>
            <Link href="/fundilink?tab=mine" className="link">
              View all <ChevronRight size={16} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="px-[23px] pb-6 text-[0.85rem] text-[var(--color-mist)]">
              No repair requests yet. Report a breakdown and technicians nearby
              are alerted instantly.
            </p>
          ) : (
            <div>
              <div className="table-head hidden lg:grid grid-cols-[2fr_1fr_1.3fr_1fr_24px] gap-2.5 items-center px-[23px] py-[13px]">
                <span>Request</span>
                <span>Urgency</span>
                <span>Status</span>
                <span>Quotes</span>
                <span />
              </div>
              {recent.map((r) => (
                <Link
                  key={r.id}
                  href={`/fundilink/jobs/${r.id}`}
                  className="grid grid-cols-[1fr_auto] lg:grid-cols-[2fr_1fr_1.3fr_1fr_24px] gap-2.5 items-center px-[23px] py-[13px] border-t border-[var(--color-line)] text-[13px]"
                >
                  <span className="grid gap-1 min-w-0">
                    <b className="truncate">{r.title}</b>
                    <small className="text-[11px] text-[var(--color-mist)]">
                      {r.district} · {timeAgo(r.createdAt)}
                    </small>
                  </span>
                  <span className="hidden lg:block">
                    <b className={`severity ${r.urgency.toLowerCase()}`}>
                      {r.urgency}
                    </b>
                  </span>
                  <span className="justify-self-end lg:justify-self-start">
                    <StatusTag status={r.status} />
                  </span>
                  <span className="hidden lg:block text-[var(--color-mist)]">
                    {r.quotes.length} quote{r.quotes.length === 1 ? "" : "s"}
                  </span>
                  <ChevronRight
                    size={18}
                    className="hidden lg:block text-[var(--color-mist)]"
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Marketplace shortcuts */}
        <section className="mb-6">
          <Eyebrow>Marketplace</Eyebrow>
          <h3 className="display text-[1.05rem] mt-0.5 mb-4">
            What do you need today?
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[15px]">
            {MODULES.map((m) => (
              <Link key={m.slug} href={m.href} className="mobile-module-card panel card-lift p-5" style={{ borderColor: `${m.accent}24` }}>
                <span
                  className="block w-9 h-1 rounded-full mb-4"
                  style={{ background: m.accent }}
                />
                <p className="display text-[0.98rem]">{m.name}</p>
                <p className="text-[0.75rem] text-[var(--color-mist)] mt-1">
                  {m.swahili}
                </p>
                <p className="eyebrow mt-3">{counts[m.slug]}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* USSD callout */}
        <Link href="/ussd" className="offline">
          <div className="ussd-icon">*#</div>
          <div className="min-w-0 flex-1">
            <p className="eyebrow">No internet? No problem.</p>
            <h3 className="display text-[1.02rem] mt-1">
              Report a breakdown from any phone.
            </h3>
            <p
              className="text-[0.76rem] mt-1"
              style={{ color: "#bdccc6" }}
            >
              Dial <b className="mono">{USSD_CODE}</b> to reach the marketplace
              over USSD.
            </p>
          </div>
          <ArrowRight
            size={18}
            className="shrink-0 hidden sm:block"
            style={{ color: "#d8ef51" }}
          />
        </Link>
      </div>
    </main>
  );
}
