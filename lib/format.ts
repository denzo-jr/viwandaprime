export function tzs(amount: number): string {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

/**
 * Abbreviate only where it actually helps. Per-unit prices in TakaTrade are
 * often in the hundreds, so anything under 100,000 stays exact.
 */
export function tzsShort(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `TSh ${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  if (amount >= 100_000) {
    const k = amount / 1_000;
    return `TSh ${k % 1 === 0 ? k : k.toFixed(0)}K`;
  }
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

export function timeAgo(date: Date | string): string {
  const then = new Date(date).getTime();
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function shortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function csv(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const PRICE_UNIT_LABEL: Record<string, string> = {
  DAY: "/ day",
  WEEK: "/ week",
  MONTH: "/ month",
  ITEM: "each",
  HOUR: "/ hour",
  TASK: "/ task",
};
