import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MapPin, ShieldCheck, Clock, Route, CheckCircle2 } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo, tzs, tzsShort } from "@/lib/format";
import { sortTechniciansByMatch } from "@/lib/matching";
import { URGENCY } from "@/lib/tz";
import {
  acceptQuoteAction,
  completeJobAction,
  markRepairStatusAction,
  submitQuoteAction,
} from "@/app/actions/fundilink";
import PayMethod from "@/components/PayMethod";
import { Avatar, MachinePhoto, PageHeader, Pill, SectionTitle, Stars, StatusTag, TechnicianPhoto } from "@/components/ui";

const ACCENT = "#ff7449";

export default async function JobDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const job = await prisma.jobRequest.findUnique({
    where: { id },
    include: {
      business: true,
      technician: true,
      quotes: { include: { technician: true }, orderBy: { price: "asc" } },
      payments: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!job) notFound();

  const isOwner = job.businessId === user.id;
  const isAssignedTech = job.technicianId === user.id;
  const isTech = user.roles.includes("TECHNICIAN");
  const myQuote = job.quotes.find((q) => q.technicianId === user.id);
  const urgency = URGENCY.find((u) => u.id === job.urgency);
  const escrow = job.payments.find((p) => p.status === "HELD_IN_ESCROW");
  const released = job.payments.find((p) => p.status === "RELEASED");
  const candidates = isOwner && job.status === "OPEN"
    ? sortTechniciansByMatch(
        await prisma.user.findMany({
          where: {
            roles: { contains: "TECHNICIAN" },
            region: job.region,
            available: true,
          },
        }),
        job.machineType,
        job.district,
        job.urgency === "URGENT"
      ).slice(0, 3)
    : [];
  const nextStatus: Record<string, [string, string]> = {
    ASSIGNED: ["ACCEPTED", "Accept dispatch"],
    ACCEPTED: ["EN_ROUTE", "Start journey"],
    EN_ROUTE: ["ARRIVED", "I have arrived"],
    ARRIVED: ["REPAIRING", "Start diagnosis & repair"],
    REPAIRING: ["COMPLETED", "Mark repair complete"],
  };
  const next = nextStatus[job.status];

  return (
    <main className="pb-24">
      <PageHeader title="Repair job" back="/fundilink" />

      <div className="lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-8 lg:items-start lg:pr-10">
        <div className="min-w-0">
      <section className="pad">
        <div className="card p-3 overflow-hidden">
          <MachinePhoto name={job.machineType} category="Repair" />
          <div className="px-1 pt-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="display text-lg leading-tight">{job.title}</h2>
            <StatusTag status={job.status} />
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <Pill color={urgency?.color}>{urgency?.label}</Pill>
            <Pill>{job.machineType}</Pill>
            <Pill color={job.source === "USSD" ? "#338346" : ACCENT}>
              {job.source}
            </Pill>
          </div>

          <p className="text-sm text-[var(--color-mist)] mt-4 leading-relaxed">
            {job.description}
          </p>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--color-line)] flex-wrap">
            <span className="text-xs text-[var(--color-mist)] inline-flex items-center gap-1">
              <MapPin size={12} /> {job.district}, {job.region}
            </span>
            <span className="text-xs text-[var(--color-mist)] inline-flex items-center gap-1">
              <Clock size={12} /> {timeAgo(job.createdAt)}
            </span>
            {job.budgetMin && job.budgetMax ? (
              <span className="text-xs font-semibold" style={{ color: ACCENT }}>
                {tzsShort(job.budgetMin)}–{tzsShort(job.budgetMax)}
              </span>
            ) : null}
          </div>
          </div>
        </div>
      </section>

      <section className="pad mt-4">
        <div className="card p-3.5 flex items-center gap-3">
          <Avatar
            name={job.business.businessName ?? job.business.name}
            color={job.business.avatarColor}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">
              {job.business.businessName ?? job.business.name}
            </p>
            <Stars
              rating={job.business.rating}
              count={job.business.ratingCount}
            />
          </div>
          <span className="text-[0.65rem] text-[var(--color-mist)] uppercase tracking-wider">
            Posted by
          </span>
        </div>
      </section>

      {escrow || released ? (
        <section className="pad mt-4">
          <div
            className="card p-4"
            style={{ borderColor: released ? "#33834655" : "#00877d55" }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={17}
                style={{ color: released ? "#338346" : "#00877d" }}
              />
              <p className="text-sm font-semibold">
                {released ? "Payment released" : "Payment held in escrow"}
              </p>
            </div>
            <p className="display text-2xl mt-2" style={{ color: released ? "#338346" : "#00877d" }}>
              {tzs((released ?? escrow)!.amount)}
            </p>
            <p className="text-xs text-[var(--color-mist)] mt-1 font-mono">
              {(released ?? escrow)!.reference} · {(released ?? escrow)!.method}
            </p>
            <p className="text-xs text-[var(--color-mist)] mt-2 leading-relaxed">
              {released
                ? "Funds have been paid out to the technician's wallet."
                : "The technician is paid automatically once you confirm the repair is done."}
            </p>
          </div>
        </section>
      ) : null}

        </div>

        <div className="min-w-0 lg:sticky lg:top-6">
      {/* --- Technician: submit a quote ------------------------------------ */}
      {isTech && !isOwner && job.status === "OPEN" ? (
        <section className="pad mt-6">
          <SectionTitle>{myQuote ? "Update your quote" : "Send a quote"}</SectionTitle>
          <form action={submitQuoteAction} className="card p-4 flex flex-col gap-4">
            <input type="hidden" name="jobId" value={job.id} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="price">
                  Your price (TSh)
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  inputMode="numeric"
                  className="field"
                  defaultValue={myQuote?.price ?? ""}
                  placeholder="280000"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="etaHours">
                  Arrive in (hours)
                </label>
                <input
                  id="etaHours"
                  name="etaHours"
                  type="number"
                  inputMode="numeric"
                  className="field"
                  defaultValue={myQuote?.etaHours ?? 4}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="message">
                Message to the business
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                className="field"
                defaultValue={myQuote?.message ?? ""}
                placeholder="What you think the fault is and what you will bring."
                required
              />
            </div>
            <button className="btn btn-primary w-full">
              {myQuote ? "Update quote" : "Send quote"}
            </button>
          </form>
        </section>
      ) : null}

      {/* --- Smart dispatch recommendations ------------------------------- */}
      {candidates.length > 0 ? (
        <section className="pad mt-6">
          <SectionTitle>Smart dispatch matches</SectionTitle>
          <p className="text-xs text-[var(--color-mist)] -mt-1 mb-3">
            Ranked by machine skills, proximity, availability, trust and experience.
          </p>
          <div className="flex flex-col gap-2.5">
            {candidates.map(({ technician, matchScore }, index) => (
              <Link
                key={technician.id}
                href={`/fundilink/technicians/${technician.id}`}
                className="card p-3.5 flex items-center gap-3"
                style={{ borderColor: index === 0 ? `${ACCENT}66` : undefined }}
              >
                <TechnicianPhoto name={technician.name} size={46} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">
                    {index === 0 ? "Best match · " : ""}{technician.name}
                  </p>
                  <p className="text-xs text-[var(--color-mist)] mt-0.5 truncate">
                    {technician.skills} · {technician.district}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="display text-lg" style={{ color: matchScore >= 75 ? "#338346" : ACCENT }}>
                    {matchScore}%
                  </p>
                  <p className="text-[0.6rem] text-[var(--color-mist)]">MATCH</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* --- Quotes list ---------------------------------------------------- */}
      {job.quotes.length > 0 ? (
        <section className="pad mt-6">
          <SectionTitle>
            {job.quotes.length} quote{job.quotes.length === 1 ? "" : "s"}
          </SectionTitle>
          <div className="flex flex-col gap-3">
            {job.quotes.map((q) => (
              <div
                key={q.id}
                className="card p-4"
                style={{
                  borderColor:
                    q.status === "ACCEPTED" ? "#33834655" : undefined,
                  opacity: q.status === "REJECTED" ? 0.5 : 1,
                }}
              >
                <div className="flex items-start gap-3">
                  <TechnicianPhoto name={q.technician.name} size={46} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/fundilink/technicians/${q.technician.id}`}
                      className="text-sm font-semibold truncate block"
                    >
                      {q.technician.name}
                    </Link>
                    <Stars
                      rating={q.technician.rating}
                      count={q.technician.ratingCount}
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="display text-base" style={{ color: ACCENT }}>
                      {tzsShort(q.price)}
                    </p>
                    <p className="text-[0.65rem] text-[var(--color-mist)]">
                      in {q.etaHours}h
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[var(--color-mist)] mt-3 leading-relaxed">
                  {q.message}
                </p>

                {q.status !== "PENDING" ? (
                  <div className="mt-3">
                    <StatusTag status={q.status} />
                  </div>
                ) : null}

                {isOwner && job.status === "OPEN" ? (
                  <form action={acceptQuoteAction} className="mt-4 flex flex-col gap-3">
                    <input type="hidden" name="quoteId" value={q.id} />
                    <PayMethod />
                    <button className="btn btn-primary w-full">
                      Accept & pay {tzs(q.price)} into escrow
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : job.status === "OPEN" && isOwner ? (
        <section className="pad mt-6">
          <div className="card p-6 text-center">
            <p className="font-semibold text-sm">Waiting for quotes</p>
            <p className="text-xs text-[var(--color-mist)] mt-1.5 leading-relaxed">
              Technicians in {job.region} have been alerted by SMS. Quotes
              usually arrive within the hour.
            </p>
          </div>
        </section>
      ) : null}

      {/* --- Repair lifecycle timeline -------------------------------------- */}
      <section className="pad mt-6">
        <SectionTitle>Dispatch timeline</SectionTitle>
        <div className="card p-4">
          <div className="flex flex-col gap-3">
            {job.statusHistory.length === 0 ? (
              <p className="text-xs text-[var(--color-mist)]">
                Timeline starts when the job is matched.
              </p>
            ) : (
              job.statusHistory.map((h, i) => (
                <div key={h.id} className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-full grid place-items-center shrink-0"
                    style={{ background: i === job.statusHistory.length - 1 ? `${ACCENT}22` : "#3383461f", color: i === job.statusHistory.length - 1 ? ACCENT : "#338346" }}
                  >
                    {i === job.statusHistory.length - 1 ? <Route size={14} /> : <CheckCircle2 size={14} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{h.status.replaceAll("_", " ")}</p>
                    {h.note ? <p className="text-xs text-[var(--color-mist)] mt-0.5">{h.note}</p> : null}
                    <p className="text-[0.65rem] text-[var(--color-mist)] mt-1">{timeAgo(h.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* --- Workflow actions ----------------------------------------------- */}
      {isAssignedTech && next ? (
        <section className="pad mt-6">
          <SectionTitle>Next field update</SectionTitle>
          <form action={markRepairStatusAction}>
            <input type="hidden" name="jobId" value={job.id} />
            <input type="hidden" name="status" value={next[0]} />
            <button className="btn btn-primary w-full min-h-11">
              {next[1]}
            </button>
          </form>
        </section>
      ) : null}

      {isOwner && job.status === "COMPLETED" ? (
        <section className="pad mt-6">
          <form action={completeJobAction}>
            <input type="hidden" name="jobId" value={job.id} />
            <button className="btn btn-primary w-full">
              Confirm repair done & release payment
            </button>
          </form>
          <p className="text-xs text-[var(--color-mist)] text-center mt-3 leading-relaxed">
            Only release once the machine is running. Money stays protected
            until then.
          </p>
        </section>
      ) : null}
        </div>
      </div>
    </main>
  );
}
