import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, MapPin } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tzsShort, PRICE_UNIT_LABEL } from "@/lib/format";
import { MACHINE_CATEGORIES } from "@/lib/tz";
import BottomNav from "@/components/BottomNav";
import { EmptyState, PageHeader, Pill } from "@/components/ui";

const ACCENT = "#0ea5e9";

export default async function MachineSharePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { cat } = await searchParams;

  const machines = await prisma.machine.findMany({
    where: {
      available: true,
      ...(cat && cat !== "All" ? { category: cat } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { owner: true },
  });

  const cats = ["All", ...MACHINE_CATEGORIES];
  const active = cat ?? "All";

  return (
    <main className="with-nav">
      <PageHeader
        title="MachineShare"
        subtitle="Kodisha mitambo — rent machinery & parts"
        accent={ACCENT}
        action={
          <Link
            href="/machineshare/new"
            aria-label="List a machine"
            className="shrink-0 w-11 h-11 grid place-items-center rounded-xl"
            style={{ background: ACCENT, color: "#04202e" }}
          >
            <Plus size={20} />
          </Link>
        }
      />

      <nav className="pad flex gap-2 overflow-x-auto hide-scroll pb-1">
        {cats.map((c) => (
          <Link
            key={c}
            href={c === "All" ? "/machineshare" : `/machineshare?cat=${encodeURIComponent(c)}`}
            className="tag shrink-0"
            style={{
              minHeight: "2.2rem",
              background: active === c ? `${ACCENT}22` : "var(--color-ink-2)",
              color: active === c ? ACCENT : "var(--color-mist)",
              border: `1px solid ${active === c ? `${ACCENT}66` : "var(--color-line)"}`,
            }}
          >
            {c}
          </Link>
        ))}
      </nav>

      <div className="pad mt-5">
        {machines.length === 0 ? (
          <EmptyState
            title="Nothing listed here yet"
            hint="Be the first to list idle equipment in this category."
            cta={
              <Link href="/machineshare/new" className="btn btn-primary">
                List your machine
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {machines.map((m) => (
              <Link key={m.id} href={`/machineshare/${m.id}`} className="card p-3">
                <div
                  className="h-20 rounded-lg grid place-items-center mb-3 font-mono text-xs font-bold tracking-wider"
                  style={{
                    background: `${ACCENT}14`,
                    color: ACCENT,
                    border: `1px solid ${ACCENT}25`,
                  }}
                >
                  {m.imageEmoji}
                </div>
                <p className="text-sm font-semibold leading-snug line-clamp-2">
                  {m.name}
                </p>
                <div className="mt-2">
                  <Pill color={m.kind === "SALE" ? "#22c55e" : ACCENT}>
                    {m.kind === "SALE" ? "For sale" : "For rent"}
                  </Pill>
                </div>
                <p className="mt-2 text-sm font-bold" style={{ color: ACCENT }}>
                  {tzsShort(m.price)}
                  <span className="text-[0.65rem] text-[var(--color-mist)] font-normal ml-1">
                    {PRICE_UNIT_LABEL[m.priceUnit]}
                  </span>
                </p>
                <p className="text-[0.68rem] text-[var(--color-mist)] mt-1.5 inline-flex items-center gap-1">
                  <MapPin size={10} /> {m.district}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
