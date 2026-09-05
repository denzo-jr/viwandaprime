import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, MapPin } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { csv, timeAgo, tzsShort } from "@/lib/format";
import { URGENCY } from "@/lib/tz";
import {
  EmptyState,
  MachinePhoto,
  PageHeader,
  Pill,
  SectionTitle,
  Stars,
  StatusTag,
  TechnicianPhoto,
} from "@/components/ui";

const ACCENT = "#ff7449";

export default async function FundiLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { tab = "jobs" } = await searchParams;
  const isTech = user.roles.includes("TECHNICIAN");

  const [openJobs, technicians, myJobs] = await Promise.all([
    prisma.jobRequest.findMany({
      where: { status: "OPEN" },
      orderBy: [{ urgency: "asc" }, { createdAt: "desc" }],
      include: { business: true, quotes: true },
      take: 30,
    }),
    prisma.user.findMany({
      where: { roles: { contains: "TECHNICIAN" } },
      orderBy: [{ rating: "desc" }, { ratingCount: "desc" }],
      take: 30,
    }),
    prisma.jobRequest.findMany({
      where: { OR: [{ businessId: user.id }, { technicianId: user.id }] },
      orderBy: { createdAt: "desc" },
      include: { quotes: true, technician: true },
    }),
  ]);

  const TABS = [
    { id: "jobs", label: isTech ? "Jobs to quote" : "Open jobs" },
    { id: "fundis", label: "Find a fundi" },
    { id: "mine", label: "My jobs" },
  ];

  return (
    <main className="with-nav">
      <PageHeader
        topLevel
        title="FundiLink"
        subtitle="Pata fundi haraka — technicians on demand"
        action={
          <Link
            href="/fundilink/request"
            aria-label="Post a repair job"
            className="shrink-0 w-11 h-11 grid place-items-center rounded-xl"
            style={{ background: ACCENT, color: "#ffffff" }}
          >
            <Plus size={20} />
          </Link>
        }
      />

      <nav className="pad flex gap-2 overflow-x-auto hide-scroll pb-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/fundilink?tab=${t.id}`}
            className="tag shrink-0"
            style={{
              minHeight: "2.2rem",
              background: tab === t.id ? `${ACCENT}22` : "var(--color-ink-2)",
              color: tab === t.id ? ACCENT : "var(--color-mist)",
              border: `1px solid ${tab === t.id ? `${ACCENT}66` : "var(--color-line)"}`,
            }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="pad mt-5">
        {tab === "jobs" ? (
          openJobs.length === 0 ? (
            <EmptyState
              title="No open jobs right now"
              hint="When a business reports a breakdown it appears here."
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {openJobs.map((job) => {
                const u = URGENCY.find((x) => x.id === job.urgency);
                return (
                  <Link
                    key={job.id}
                    href={`/fundilink/jobs/${job.id}`}
                    className="card p-3 flex items-start gap-3"
                  >
                    <MachinePhoto name={job.machineType} category="Repair" compact />
                    <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-sm leading-snug">
                        {job.title}
                      </p>
                      <Pill color={u?.color}>{u?.label}</Pill>
                    </div>
                    <p className="text-xs text-[var(--color-mist)] mt-2 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-xs text-[var(--color-mist)] inline-flex items-center gap-1">
                        <MapPin size={12} /> {job.district}
                      </span>
                      {job.budgetMin && job.budgetMax ? (
                        <span
                          className="text-xs font-semibold"
                          style={{ color: ACCENT }}
                        >
                          {tzsShort(job.budgetMin)}–{tzsShort(job.budgetMax)}
                        </span>
                      ) : null}
                      <span className="text-xs text-[var(--color-mist)]">
                        {job.quotes.length} quote
                        {job.quotes.length === 1 ? "" : "s"}
                      </span>
                      <span className="text-xs text-[var(--color-mist)] ml-auto">
                        {timeAgo(job.createdAt)}
                      </span>
                    </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        ) : null}

        {tab === "fundis" ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {technicians.map((t) => (
              <Link
                key={t.id}
                href={`/fundilink/technicians/${t.id}`}
                className="card p-4 flex gap-3"
              >
                <TechnicianPhoto name={t.name} size={54} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{t.name}</p>
                    {t.verified ? (
                      <span
                        className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: "#33834622", color: "#338346" }}
                      >
                        VERIFIED
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Stars rating={t.rating} count={t.ratingCount} />
                    <span className="text-xs text-[var(--color-mist)]">
                      · {t.district}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {csv(t.skills)
                      .slice(0, 3)
                      .map((s) => (
                        <Pill key={s} color={ACCENT}>
                          {s}
                        </Pill>
                      ))}
                  </div>
                </div>
                {t.hourlyRate ? (
                  <div className="text-right shrink-0">
                    <p
                      className="text-sm font-bold"
                      style={{ color: ACCENT }}
                    >
                      {tzsShort(t.hourlyRate)}
                    </p>
                    <p className="text-[0.65rem] text-[var(--color-mist)]">
                      / hour
                    </p>
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        ) : null}

        {tab === "mine" ? (
          myJobs.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              hint="Post a repair request and quotes will start arriving."
              cta={
                <Link href="/fundilink/request" className="btn btn-primary">
                  Report a breakdown
                </Link>
              }
            />
          ) : (
            <>
              <SectionTitle>Your jobs</SectionTitle>
              <div className="flex flex-col gap-3">
                {myJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/fundilink/jobs/${job.id}`}
                    className="card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-sm leading-snug">
                        {job.title}
                      </p>
                      <StatusTag status={job.status} />
                    </div>
                    <p className="text-xs text-[var(--color-mist)] mt-2">
                      {job.technician
                        ? `Fundi: ${job.technician.name}`
                        : `${job.quotes.length} quote${job.quotes.length === 1 ? "" : "s"} waiting`}{" "}
                      · {timeAgo(job.createdAt)}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )
        ) : null}
      </div>

    </main>
  );
}
