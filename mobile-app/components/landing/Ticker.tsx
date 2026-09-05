"use client";

/** Infinite marquee. Children are duplicated so the loop is seamless. */
export default function Ticker({ items }: { items: string[] }) {
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 mono text-[11px] tracking-[0.08em] text-[var(--color-mist)] whitespace-nowrap">
            {t}
          </span>
          <span
            className="w-1 h-1 rounded-full shrink-0"
            style={{ background: "#00877d" }}
          />
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee-mask overflow-hidden py-4 border-b border-[var(--color-line)]">
      <div className="marquee">
        {row}
        {row}
      </div>
    </div>
  );
}
