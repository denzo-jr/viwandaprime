import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, MapPin, Users, Calendar } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tzs, shortDate, timeAgo, PRICE_UNIT_LABEL } from "@/lib/format";
import { LABOUR_CATEGORIES } from "@/lib/tz";
import { EmptyState, PageHeader, Pill, StatusTag } from "@/components/ui";

const ACCENT = "#7554b5";

export default async function KibaruaPayPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; tab?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { cat, tab = "browse" } = await searchParams;

  const [jobs, myApplications, myPostings] = await Promise.all([
    prisma.labourJob.findMany({
      where: {
        status: "OPEN",
        ...(cat && cat !== "All" ? { category: cat } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { business: true, applications: true },
    }),
    prisma.labourApplication.findMany({
      where: { workerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { job: { include: { business: true } } },
    }),
    prisma.labourJob.findMany({
      where: { businessId: user.id },
      orderBy: { createdAt: "desc" },
      include: { applications: true },
    }),
  ]);

  const cats = ["All", ...LABOUR_CATEGORIES];
  const active = cat ?? "All";

  const TABS = [
    { id: "browse", label: "Find work" },
    { id: "applications", label: "My applications" },
    { id: "postings", label: "My postings" },
  ];

  return (
    <main className="with-nav">
      <PageHeader
        topLevel
        title="KibaruaPay"
        subtitle="Kazi na malipo salama — work with secure pay"
        action={
          <Link
            href="/kibaruapay/new"
            aria-label="Post a job"
            className="shrink-0 w-11 h-11 grid place-items-center rounded-xl"
            style={{ background: ACCENT, color: "#ffffff" }}
          >
            <Plus size={20} />
          </Link>
        }
      />

      <section className="pad">
        <div className="card p-4" style={{ borderColor: `${ACCENT}33` }}>
          <p className="text-xs text-[var(--color-mist)]">Your wallet</p>
          <p className="display text-2xl mt-0.5" style={{ color: ACCENT }}>
            {tzs(user.walletBalance)}
          </p>
          <p className="text-xs text-[var(--color-mist)] mt-1">
            Paid out through M-Pesa, Mixx, Airtel Money or HaloPesa
          </p>
        </div>
      </section>

      <nav className="pad flex gap-2 overflow-x-auto hide-scroll pb-1 mt-4">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/kibaruapay?tab=${t.id}`}
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

      {tab === "browse" ? (
        <nav className="pad flex gap-2 overflow-x-auto hide-scroll pb-1 mt-3">
          {cats.map((c) => (
            <Link
              key={c}
              href={
                c === "All"
                  ? "/kibaruapay"
                  : `/kibaruapay?cat=${encodeURIComponent(c)}`
              }
              className="tag shrink-0"
              style={{
                minHeight: "2rem",
                background: active === c ? "var(--color-ink-3)" : "transparent",
                color: active === c ? "var(--color-chalk)" : "var(--color-mist)",
                border: `1px solid var(--color-line)`,
              }}
            >
              {c}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="pad mt-5">
        {tab === "browse" ? (
          jobs.length === 0 ? (
            <EmptyState
              title="No work posted here yet"
              hint="Check back soon, or widen the category filter."
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {jobs.map((j) => (
                <Link key={j.id} href={`/kibaruapay/${j.id}`} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-sm leading-snug">
                      {j.title}
                    </p>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: ACCENT }}>
                        {tzs(j.payRate).replace("TSh ", "")}
                      </p>
                      <p className="text-[0.62rem] text-[var(--color-mist)]">
                        {PRICE_UNIT_LABEL[j.payUnit]}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-mist)] mt-1.5">
                    {j.business.businessName ?? j.business.name}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Pill color={ACCENT}>{j.category}</Pill>
                    <span className="text-[0.68rem] text-[var(--color-mist)] inline-flex items-center gap-1">
                      <Users size={11} /> {j.workersNeeded} needed
                    </span>
                    <span className="text-[0.68rem] text-[var(--color-mist)] inline-flex items-center gap-1">
                      <Calendar size={11} /> {shortDate(j.startDate)}
                    </span>
                    <span className="text-[0.68rem] text-[var(--color-mist)] inline-flex items-center gap-1">
                      <MapPin size={11} /> {j.district}
                    </span>
                  </div>

                  <p className="text-[0.68rem] text-[var(--color-mist)] mt-2.5">
                    {j.applications.length} applied · {timeAgo(j.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          )
        ) : null}

        {tab === "applications" ? (
          myApplications.length === 0 ? (
            <EmptyState
              title="You have not applied yet"
              hint="Browse open work and send your first application."
              cta={
                <Link href="/kibaruapay" className="btn btn-primary">
                  Find work
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {myApplications.map((a) => (
                <Link
                  key={a.id}
                  href={`/kibaruapay/${a.jobId}`}
                  className="card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-sm leading-snug">
                      {a.job.title}
                    </p>
                    <StatusTag status={a.status} />
                  </div>
                  <p className="text-xs text-[var(--color-mist)] mt-2">
                    {a.job.business.businessName ?? a.job.business.name} ·{" "}
                    {tzs(a.job.payRate)} {PRICE_UNIT_LABEL[a.job.payUnit]}
                  </p>
                </Link>
              ))}
            </div>
          )
        ) : null}

        {tab === "postings" ? (
          myPostings.length === 0 ? (
            <EmptyState
              title="You have not posted work"
              hint="Post a job and every worker in your region gets an SMS."
              cta={
                <Link href="/kibaruapay/new" className="btn btn-primary">
                  Post a job
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {myPostings.map((j) => (
                <Link key={j.id} href={`/kibaruapay/${j.id}`} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-sm leading-snug">
                      {j.title}
                    </p>
                    <StatusTag status={j.status} />
                  </div>
                  <p className="text-xs text-[var(--color-mist)] mt-2">
                    {j.applications.length} application
                    {j.applications.length === 1 ? "" : "s"} ·{" "}
                    {j.workersNeeded} needed
                  </p>
                </Link>
              ))}
            </div>
          )
        ) : null}
      </div>

    </main>
  );
}
