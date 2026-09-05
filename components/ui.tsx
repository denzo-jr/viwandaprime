import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { initials } from "@/lib/format";

/** Small mono label that sits above a heading. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function PageHeader({
  title,
  subtitle,
  back = "/home",
  accent,
  action,
  topLevel = false,
  crumb,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  accent?: string;
  action?: React.ReactNode;
  /** Top-level screens have sidebar nav on desktop, so the back arrow is noise. */
  topLevel?: boolean;
  crumb?: string;
}) {
  return (
    <header className="pad pt-6 pb-5 lg:pt-8 flex items-start gap-3">
      <Link
        href={back}
        aria-label="Go back"
        className={`shrink-0 w-10 h-10 -ml-0.5 grid place-items-center rounded-full border border-[var(--color-line)] bg-white ${
          topLevel ? "lg:hidden" : ""
        }`}
      >
        <ChevronLeft size={19} className="text-[var(--color-mist)]" />
      </Link>
      <div className="min-w-0 flex-1">
        {crumb ? <Eyebrow>{crumb}</Eyebrow> : null}
        <h1
          className="display text-[1.55rem] lg:text-[1.75rem] leading-tight"
          style={accent ? { color: accent } : undefined}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="text-[0.82rem] text-[var(--color-mist)] mt-1.5">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

export function Avatar({
  name,
  color = "#00877d",
  size = 40,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  return (
    <div
      className="shrink-0 grid place-items-center rounded-full font-extrabold"
      style={{
        width: size,
        height: size,
        background: `${color}1c`,
        color,
        fontSize: size * 0.34,
      }}
    >
      {initials(name)}
    </div>
  );
}

/** Pastel badge tones, keyed by workflow status. */
const STATUS_TONE: Record<string, [string, string]> = {
  // teal — in the pipeline
  OPEN: ["#e4f4f1", "#08756c"],
  CREATED: ["#e4f4f1", "#08756c"],
  MATCHING: ["#e4f4f1", "#08756c"],
  TECHNICIAN_FOUND: ["#e4f4f1", "#08756c"],
  ACCEPTED: ["#e4f4f1", "#08756c"],
  // orange — active work
  ASSIGNED: ["#fff1e7", "#bf572d"],
  EN_ROUTE: ["#fff1e7", "#bf572d"],
  ARRIVED: ["#fff1e7", "#bf572d"],
  REPAIRING: ["#fff1e7", "#bf572d"],
  IN_PROGRESS: ["#fff1e7", "#bf572d"],
  ACTIVE: ["#fff1e7", "#bf572d"],
  PENDING: ["#fff1e7", "#bf572d"],
  RESERVED: ["#fff1e7", "#bf572d"],
  HELD_IN_ESCROW: ["#fff1e7", "#bf572d"],
  FILLED: ["#f1ecff", "#7554b5"],
  // green — done
  COMPLETED: ["#e7f5e9", "#328044"],
  CONFIRMED: ["#e7f5e9", "#328044"],
  COLLECTED: ["#e7f5e9", "#328044"],
  RETURNED: ["#e7f5e9", "#328044"],
  RELEASED: ["#e7f5e9", "#328044"],
  AVAILABLE: ["#e7f5e9", "#328044"],
  // red — stopped
  REJECTED: ["#fdecea", "#c43e21"],
  CANCELLED: ["#fdecea", "#c43e21"],
  FAILED: ["#fdecea", "#c43e21"],
  SOLD: ["#eef2f0", "#587069"],
};

export function StatusTag({ status }: { status: string }) {
  const [bg, fg] = STATUS_TONE[status] ?? ["#eef2f0", "#587069"];
  return (
    <span className="badge" style={{ background: bg, color: fg }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Pill({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="badge"
      style={color ? { background: `${color}16`, color } : undefined}
    >
      {children}
    </span>
  );
}

export function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[0.78rem] text-[var(--color-mist)]">
      <span style={{ color: "#f0a500" }}>★</span>
      <span className="font-bold text-[var(--color-ink)]">
        {rating > 0 ? rating.toFixed(1) : "New"}
      </span>
      {count && count > 0 ? <span>· {count} jobs</span> : null}
    </span>
  );
}

/** The green "● AVAILABLE NOW" signal from the operations UI. */
export function AvailableNow({ label = "Available now" }: { label?: string }) {
  return <span className="available">● {label.toUpperCase()}</span>;
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
    <div className="panel p-10 text-center">
      <p className="font-extrabold">{title}</p>
      {hint ? (
        <p className="text-[0.85rem] text-[var(--color-mist)] mt-2 max-w-sm mx-auto leading-relaxed">
          {hint}
        </p>
      ) : null}
      {cta ? <div className="mt-5 inline-flex">{cta}</div> : null}
    </div>
  );
}

export function SectionTitle({
  children,
  eyebrow,
  right,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="display text-[1.05rem] mt-0.5">{children}</h2>
      </div>
      {right}
    </div>
  );
}

/** Stat tile with a pastel icon chip. */
export function Stat({
  icon,
  value,
  label,
  tone = "teal",
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tone?: "blue" | "orange" | "green" | "purple" | "teal";
}) {
  return (
    <div className={`stat tone-${tone}`}>
      <span className="chip">{icon}</span>
      <b>{value}</b>
      <span className="k">{label}</span>
    </div>
  );
}
