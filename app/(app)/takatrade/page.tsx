import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, MapPin } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tzs, tzsShort } from "@/lib/format";
import { WASTE_CATEGORIES } from "@/lib/tz";
import { EmptyState, PageHeader, Pill } from "@/components/ui";

const ACCENT = "#338346";

export default async function TakaTradePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { cat } = await searchParams;

  const listings = await prisma.wasteListing.findMany({
    where: {
      status: "AVAILABLE",
      ...(cat && cat !== "All" ? { category: cat } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { seller: true },
  });

  const totalTonnes = listings.reduce(
    (sum, l) => sum + (l.unit === "TONNE" ? l.quantity : l.quantity / 1000),
    0
  );

  const cats = ["All", ...WASTE_CATEGORIES];
  const active = cat ?? "All";

  return (
    <main className="with-nav">
      <PageHeader
        topLevel
        title="TakaTrade"
        subtitle="Uza taka za viwanda — waste into raw material"
        action={
          <Link
            href="/takatrade/new"
            aria-label="List material"
            className="shrink-0 w-11 h-11 grid place-items-center rounded-xl"
            style={{ background: ACCENT, color: "#ffffff" }}
          >
            <Plus size={20} />
          </Link>
        }
      />

      <section className="pad">
        <div className="card p-4" style={{ borderColor: `${ACCENT}33` }}>
          <p className="text-xs text-[var(--color-mist)]">
            Available on the market right now
          </p>
          <p className="display text-2xl mt-1" style={{ color: ACCENT }}>
            {totalTonnes.toFixed(1)} tonnes
          </p>
          <p className="text-xs text-[var(--color-mist)] mt-1">
            diverted from landfill across {listings.length} listings
          </p>
        </div>
      </section>

      <nav className="pad flex gap-2 overflow-x-auto hide-scroll pb-1 mt-4">
        {cats.map((c) => (
          <Link
            key={c}
            href={c === "All" ? "/takatrade" : `/takatrade?cat=${encodeURIComponent(c)}`}
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
        {listings.length === 0 ? (
          <EmptyState
            title="No materials listed here"
            hint="List your factory by-products and turn them into revenue."
            cta={
              <Link href="/takatrade/new" className="btn btn-primary">
                List material
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {listings.map((l) => (
              <Link key={l.id} href={`/takatrade/${l.id}`} className="card p-4 flex gap-3">
                <div
                  className="w-16 h-16 shrink-0 rounded-xl grid place-items-center font-mono text-[0.6rem] font-bold tracking-wider"
                  style={{
                    background: `${ACCENT}14`,
                    color: ACCENT,
                    border: `1px solid ${ACCENT}25`,
                  }}
                >
                  {l.imageEmoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug line-clamp-2">
                    {l.title}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <Pill color={ACCENT}>{l.category}</Pill>
                    <Pill>
                      {l.quantity.toLocaleString()} {l.unit}
                    </Pill>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: ACCENT }}>
                      {tzsShort(l.pricePerUnit)}
                      <span className="text-[0.65rem] text-[var(--color-mist)] font-normal ml-1">
                        / {l.unit.toLowerCase()}
                      </span>
                    </span>
                    <span className="text-[0.68rem] text-[var(--color-mist)] inline-flex items-center gap-1 ml-auto">
                      <MapPin size={10} /> {l.district}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}
