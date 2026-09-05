import { notFound, redirect } from "next/navigation";
import { MapPin, ShieldCheck, CheckCircle2, Recycle } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tzs } from "@/lib/format";
import { orderWasteAction } from "@/app/actions/takatrade";
import PayMethod from "@/components/PayMethod";
import { Avatar, PageHeader, Pill, SectionTitle, Stars } from "@/components/ui";

const ACCENT = "#22c55e";

export default async function ListingDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ordered?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { ordered } = await searchParams;

  const listing = await prisma.wasteListing.findUnique({
    where: { id },
    include: {
      seller: true,
      orders: { include: { buyer: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!listing) notFound();

  const isSeller = listing.sellerId === user.id;
  const unitLower = listing.unit.toLowerCase();

  return (
    <main className="pb-24">
      <PageHeader title="Material" back="/takatrade" accent={ACCENT} />

      {ordered ? (
        <section className="pad mb-4">
          <div
            className="card p-4 flex items-center gap-3"
            style={{ borderColor: "#22c55e55" }}
          >
            <CheckCircle2 size={20} style={{ color: ACCENT }} />
            <p className="text-sm font-semibold">
              Order placed — the seller has been notified to arrange collection.
            </p>
          </div>
        </section>
      ) : null}

      <section className="pad">
        <div
          className="h-32 rounded-2xl grid place-items-center"
          style={{
            background: `${ACCENT}14`,
            border: `1px solid ${ACCENT}25`,
          }}
        >
          <Recycle size={40} style={{ color: ACCENT }} strokeWidth={1.5} />
        </div>

        <h2 className="display text-xl mt-4 leading-tight">{listing.title}</h2>

        <div className="flex flex-wrap gap-2 mt-3">
          <Pill color={ACCENT}>{listing.category}</Pill>
          <Pill>{listing.material}</Pill>
        </div>

        <div className="flex items-end gap-4 mt-4">
          <div>
            <p className="text-xs text-[var(--color-mist)]">Price</p>
            <p className="display text-2xl" style={{ color: ACCENT }}>
              {tzs(listing.pricePerUnit)}
              <span className="text-xs text-[var(--color-mist)] font-normal ml-1">
                / {unitLower}
              </span>
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-[var(--color-mist)]">Available</p>
            <p className="display text-2xl">
              {listing.quantity.toLocaleString()}
              <span className="text-xs text-[var(--color-mist)] font-normal ml-1">
                {unitLower}
              </span>
            </p>
          </div>
        </div>

        <p className="text-sm text-[var(--color-mist)] mt-4 leading-relaxed">
          {listing.description}
        </p>

        <p className="text-xs text-[var(--color-mist)] mt-4 inline-flex items-center gap-1.5">
          <MapPin size={13} /> {listing.district}, {listing.region}
        </p>
      </section>

      <section className="pad mt-5">
        <div className="card p-3.5 flex items-center gap-3">
          <Avatar
            name={listing.seller.businessName ?? listing.seller.name}
            color={listing.seller.avatarColor}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">
              {listing.seller.businessName ?? listing.seller.name}
            </p>
            <Stars
              rating={listing.seller.rating}
              count={listing.seller.ratingCount}
            />
          </div>
          <span className="text-[0.65rem] text-[var(--color-mist)] uppercase tracking-wider">
            Seller
          </span>
        </div>
      </section>

      {!isSeller && listing.status === "AVAILABLE" ? (
        <section className="pad mt-6">
          <SectionTitle>Place an order</SectionTitle>
          <form action={orderWasteAction} className="card p-4 flex flex-col gap-4">
            <input type="hidden" name="listingId" value={listing.id} />

            <div>
              <label className="label" htmlFor="quantity">
                How much do you need? ({unitLower})
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                inputMode="decimal"
                step="any"
                min={0.1}
                max={listing.quantity}
                defaultValue={Math.min(listing.quantity, 500)}
                className="field"
                required
              />
              <p className="text-xs text-[var(--color-mist)] mt-1.5">
                Maximum {listing.quantity.toLocaleString()} {unitLower} available
              </p>
            </div>

            <PayMethod accent={ACCENT} />

            <div className="flex items-start gap-2 text-xs text-[var(--color-mist)] leading-relaxed">
              <ShieldCheck size={15} style={{ color: ACCENT }} className="shrink-0 mt-0.5" />
              <span>
                Payment is held in escrow until you collect and inspect the
                material.
              </span>
            </div>

            <button
              className="btn w-full"
              style={{ background: ACCENT, color: "#04240f" }}
            >
              Order & pay into escrow
            </button>
          </form>
        </section>
      ) : null}

      {isSeller && listing.orders.length > 0 ? (
        <section className="pad mt-6">
          <SectionTitle>Orders</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {listing.orders.map((o) => (
              <div key={o.id} className="card p-3.5 flex items-center gap-3">
                <Avatar
                  name={o.buyer.businessName ?? o.buyer.name}
                  color={o.buyer.avatarColor}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">
                    {o.buyer.businessName ?? o.buyer.name}
                  </p>
                  <p className="text-xs text-[var(--color-mist)]">
                    {o.quantity.toLocaleString()} {unitLower} ·{" "}
                    {tzs(o.totalPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
