import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { initials } from "@/lib/format";

export function PageHeader({
  title,
  subtitle,
  back = "/home",
  accent = "#f59e0b",
  action,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  accent?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="pad pt-6 pb-4 flex items-start gap-3">
      <Link
        href={back}
        aria-label="Go back"
        className="shrink-0 w-11 h-11 -ml-1 grid place-items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-2)]"
      >
        <ChevronLeft size={20} className="text-[var(--color-mist)]" />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="display text-2xl leading-tight" style={{ color: accent }}>
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-[var(--color-mist)] mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

export function Avatar({
  name,
  color = "#f59e0b",
  size = 44,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  return (
    <div
      className="shrink-0 grid place-items-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        background: `${color}22`,
        border: `1px solid ${color}55`,
        color,
        fontSize: size * 0.36,
      }}
    >
      {initials(name)}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#0ea5e9",
  AVAILABLE: "#22c55e",
  ASSIGNED: "#f59e0b",
  PENDING: "#f59e0b",
  RESERVED: "#f59e0b",
  CONFIRMED: "#0ea5e9",
  IN_PROGRESS: "#a855f7",
  ACTIVE: "#a855f7",
  ACCEPTED: "#22c55e",
  FILLED: "#a855f7",
  COMPLETED: "#22c55e",
  COLLECTED: "#22c55e",
  RETURNED: "#22c55e",
  SOLD: "#64748b",
  RELEASED: "#22c55e",
  HELD_IN_ESCROW: "#f59e0b",
  REJECTED: "#ef4444",
  CANCELLED: "#ef4444",
  FAILED: "#ef4444",
};

export function StatusTag({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "#64748b";
  return (
    <span
      className="tag"
      style={{ background: `${color}1f`, color, border: `1px solid ${color}44` }}
    >
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export function Pill({
  children,
  color = "#8fa3b8",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="tag"
      style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}
    >
      {children}
    </span>
  );
}

export function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--color-mist)]">
      <span style={{ color: "#f59e0b" }}>★</span>
      <span className="font-semibold text-[var(--color-chalk)]">
        {rating > 0 ? rating.toFixed(1) : "New"}
      </span>
      {count && count > 0 ? <span>({count})</span> : null}
    </span>
  );
}

export function EmptyState({
  title,
  hint,
  cta,
}: {
  title: string;
  hint?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="card p-8 text-center">
      <p className="font-semibold">{title}</p>
      {hint ? (
        <p className="text-sm text-[var(--color-mist)] mt-1.5">{hint}</p>
      ) : null}
      {cta ? <div className="mt-4">{cta}</div> : null}
    </div>
  );
}

export function SectionTitle({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-3">
      <h2 className="display text-base">{children}</h2>
      {right}
    </div>
  );
}
