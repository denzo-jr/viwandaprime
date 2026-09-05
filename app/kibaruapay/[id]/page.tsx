import { notFound, redirect } from "next/navigation";
import { MapPin, Users, Calendar, ShieldCheck } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tzs, shortDate, timeAgo, PRICE_UNIT_LABEL } from "@/lib/format";
import {
  acceptWorkerAction,
  applyAction,
  payWorkerAction,
} from "@/app/actions/kibaruapay";
import PayMethod from "@/components/PayMethod";
import {
  Avatar,
  PageHeader,
  Pill,
  SectionTitle,
  Stars,
  StatusTag,
} from "@/components/ui";

const ACCENT = "#a855f7";

export default async function LabourJobDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const job = await prisma.labourJob.findUnique({
    where: { id },
    include: {
      business: true,
      applications: {
        include: { worker: true, payments: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!job) notFound();

  const isOwner = job.businessId === user.id;
  const isWorker = user.roles.includes("WORKER");
  const myApplication = job.applications.find((a) => a.workerId === user.id);

  const totalPay =
    job.payUnit === "HOUR"
      ? job.payRate * 8 * job.durationDays
      : job.payUnit === "DAY"
        ? job.payRate * job.durationDays
        : job.payRate;

  return (
    <main className="pb-24">
      <PageHeader title="Labour job" back="/kibaruapay" accent={ACCENT} />

      <section className="pad">
        <div className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="display text-lg leading-tight">{job.title}</h2>
            <StatusTag status={job.status} />
          </div>

          <div className="flex items-end gap-4 mt-4">
            <div>
              <p className="text-xs text-[var(--color-mist)]">Pay rate</p>
              <p className="display text-2xl" style={{ color: ACCENT }}>
                {tzs(job.payRate)}
                <span className="text-xs text-[var(--color-mist)] font-normal ml-1">
                  {PRICE_UNIT_LABEL[job.payUnit]}
                </span>
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-[var(--color-mist)]">Total for job</p>
              <p className="display text-2xl">{tzs(totalPay)}</p>
            </div>
          </div>

          <p className="text-sm text-[var(--color-mist)] mt-4 leading-relaxed">
            {job.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-[var(--color-line)]">
            <Pill color={ACCENT}>{job.category}</Pill>
            <span className="text-xs text-[var(--color-mist)] inline-flex items-center gap-1">
              <Users size={12} /> {job.workersNeeded} needed
            </span>
            <span className="text-xs text-[var(--color-mist)] inline-flex items-center gap-1">
              <Calendar size={12} /> {shortDate(job.startDate)} ·{" "}
              {job.durationDays}d
            </span>
            <span className="text-xs text-[var(--color-mist)] inline-flex items-center gap-1">
              <MapPin size={12} /> {job.district}
            </span>
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
            Employer
          </span>
        </div>
      </section>

      {/* --- Worker applies -------------------------------------------------- */}
      {isWorker && !isOwner && job.status === "OPEN" ? (
        <section className="pad mt-6">
          <SectionTitle>
            {myApplication ? "Your application" : "Apply for this work"}
          </SectionTitle>

          {myApplication && myApplication.status !== "PENDING" ? (
            <div className="card p-4">
              <StatusTag status={myApplication.status} />
              <p className="text-sm text-[var(--color-mist)] mt-3 leading-relaxed">
                {myApplication.message}
              </p>
            </div>
          ) : (
            <form action={applyAction} className="card p-4 flex flex-col gap-4">
              <input type="hidden" name="jobId" value={job.id} />
              <div>
                <label className="label" htmlFor="message">
                  Why should they pick you?
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  className="field"
                  defaultValue={myApplication?.message ?? ""}
                  placeholder="Your experience and when you can start."
                  required
                />
              </div>
              <button
                className="btn w-full"
                style={{ background: ACCENT, color: "#1a0630" }}
              >
                {myApplication ? "Update application" : "Apply now"}
              </button>
            </form>
          )}
        </section>
      ) : null}

      {/* --- Employer reviews applicants ------------------------------------- */}
      {isOwner ? (
        <section className="pad mt-6">
          <SectionTitle>
            {job.applications.length} applicant
            {job.applications.length === 1 ? "" : "s"}
          </SectionTitle>

          {job.applications.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="font-semibold text-sm">No applications yet</p>
              <p className="text-xs text-[var(--color-mist)] mt-1.5 leading-relaxed">
                Every worker in {job.region} received an SMS about this job.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {job.applications.map((a) => {
                const held = a.payments.find(
                  (p) => p.status === "HELD_IN_ESCROW"
                );
                const paid = a.payments.find((p) => p.status === "RELEASED");
                return (
                  <div key={a.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={a.worker.name}
                        color={a.worker.avatarColor}
                        size={40}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {a.worker.name}
                        </p>
                        <Stars
                          rating={a.worker.rating}
                          count={a.worker.ratingCount}
                        />
                        <p className="text-[0.68rem] text-[var(--color-mist)] mt-0.5">
                          {a.worker.district} · applied {timeAgo(a.createdAt)}
                        </p>
                      </div>
                      <StatusTag status={a.status} />
                    </div>

                    <p className="text-xs text-[var(--color-mist)] mt-3 leading-relaxed">
                      {a.message}
                    </p>

                    {a.status === "PENDING" ? (
                      <form
                        action={acceptWorkerAction}
                        className="mt-4 flex flex-col gap-3"
                      >
                        <input
                          type="hidden"
                          name="applicationId"
                          value={a.id}
                        />
                        <PayMethod accent={ACCENT} />
                        <button
                          className="btn w-full"
                          style={{ background: ACCENT, color: "#1a0630" }}
                        >
                          Hire & secure {tzs(totalPay)}
                        </button>
                      </form>
                    ) : null}

                    {a.status === "ACCEPTED" && held ? (
                      <form action={payWorkerAction} className="mt-4">
                        <input
                          type="hidden"
                          name="applicationId"
                          value={a.id}
                        />
                        <div className="flex items-start gap-2 text-xs text-[var(--color-mist)] leading-relaxed mb-3">
                          <ShieldCheck
                            size={15}
                            style={{ color: "#f59e0b" }}
                            className="shrink-0 mt-0.5"
                          />
                          <span>
                            {tzs(held.amount)} held in escrow ·{" "}
                            <span className="font-mono">{held.reference}</span>
                          </span>
                        </div>
                        <button className="btn btn-primary w-full">
                          Confirm work done & pay
                        </button>
                      </form>
                    ) : null}

                    {paid ? (
                      <p
                        className="text-xs mt-3 font-semibold"
                        style={{ color: "#22c55e" }}
                      >
                        Paid {tzs(paid.amount)} · {paid.reference}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
