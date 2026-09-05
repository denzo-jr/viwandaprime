import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, ShieldCheck, CheckCircle2 } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tzs, tzsShort, PRICE_UNIT_LABEL } from "@/lib/format";
import { bookMachineAction } from "@/app/actions/machineshare";
import PayMethod from "@/components/PayMethod";
import { Avatar, PageHeader, Pill, SectionTitle, Stars } from "@/components/ui";

const ACCENT = "#3175b8";

const CONDITION_LABEL: Record<string, string> = {
  NEW: "Brand new",
  GOOD: "Good condition",
  FAIR: "Fair condition",
};

export default async function MachineDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ booked?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { booked } = await searchParams;

  const machine = await prisma.machine.findUnique({
    where: { id },
    include: {
      owner: true,
      bookings: { include: { renter: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!machine) notFound();

  const isOwner = machine.ownerId === user.id;
  const isSale = machine.kind === "SALE";

  return (
    <main className="pb-24">
      <PageHeader title="Listing" back="/machineshare" />

      {booked ? (
        <section className="pad mb-4">
          <div
            className="card p-4 flex items-center gap-3"
            style={{ borderColor: "#33834655" }}
          >
            <CheckCircle2 size={20} style={{ color: "#338346" }} />
            <p className="text-sm font-semibold">
              {isSale ? "Purchase confirmed" : "Booking confirmed"} — the owner
              has been notified.
            </p>
          </div>
        </section>
      ) : null}

      <div className="lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-8 lg:items-start lg:pr-10">
        <div className="min-w-0">
      <section className="pad">
        <div
          className="h-40 rounded-2xl grid place-items-center font-mono text-lg font-bold tracking-widest"
          style={{
            background: `${ACCENT}14`,
            color: ACCENT,
            border: `1px solid ${ACCENT}25`,
          }}
        >
          {machine.imageEmoji}
        </div>

        <h2 className="display text-xl mt-4 leading-tight">{machine.name}</h2>

        <div className="flex flex-wrap gap-2 mt-3">
          <Pill color={isSale ? "#338346" : ACCENT}>
            {isSale ? "For sale" : "For rent"}
          </Pill>
          <Pill>{machine.category}</Pill>
          <Pill>{CONDITION_LABEL[machine.condition]}</Pill>
        </div>

        <p className="display text-3xl mt-4" style={{ color: ACCENT }}>
          {tzs(machine.price)}
          <span className="text-sm text-[var(--color-mist)] font-normal ml-2">
            {PRICE_UNIT_LABEL[machine.priceUnit]}
          </span>
        </p>

        <p className="text-sm text-[var(--color-mist)] mt-4 leading-relaxed">
          {machine.description}
        </p>

        <p className="text-xs text-[var(--color-mist)] mt-4 inline-flex items-center gap-1.5">
          <MapPin size={13} /> {machine.district}, {machine.region}
        </p>
      </section>

      <section className="pad mt-5">
        <div className="card p-3.5 flex items-center gap-3">
          <Avatar
            name={machine.owner.businessName ?? machine.owner.name}
            color={machine.owner.avatarColor}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">
              {machine.owner.businessName ?? machine.owner.name}
            </p>
            <Stars
              rating={machine.owner.rating}
              count={machine.owner.ratingCount}
            />
          </div>
          <span className="text-[0.65rem] text-[var(--color-mist)] uppercase tracking-wider">
            Owner
          </span>
        </div>
      </section>
        </div>

        <div className="min-w-0 lg:sticky lg:top-6">

      {!isOwner && machine.available ? (
        <section className="pad mt-6">
          <SectionTitle>{isSale ? "Buy this item" : "Book this machine"}</SectionTitle>
          <form action={bookMachineAction} className="card p-4 flex flex-col gap-4">
            <input type="hidden" name="machineId" value={machine.id} />

            {!isSale ? (
              <div>
                <label className="label" htmlFor="days">
                  How many days?
                </label>
                <input
                  id="days"
                  name="days"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  defaultValue={3}
                  className="field"
                />
                <p className="text-xs text-[var(--color-mist)] mt-1.5">
                  {tzsShort(machine.price)} {PRICE_UNIT_LABEL[machine.priceUnit]}
                </p>
              </div>
            ) : (
              <input type="hidden" name="days" value="1" />
            )}

            <PayMethod />

            <div
              className="flex items-start gap-2 text-xs text-[var(--color-mist)] leading-relaxed"
            >
              <ShieldCheck size={15} style={{ color: ACCENT }} className="shrink-0 mt-0.5" />
              <span>
                Your money is held in escrow and only released to the owner after
                you receive the {isSale ? "item" : "machine"}.
              </span>
            </div>

            <button
              className="btn w-full"
              style={{ background: ACCENT, color: "#ffffff" }}
            >
              {isSale ? `Buy for ${tzs(machine.price)}` : "Confirm booking"}
            </button>
          </form>
        </section>
      ) : null}

      {isOwner && machine.bookings.length > 0 ? (
        <section className="pad mt-6">
          <SectionTitle>Bookings</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {machine.bookings.map((b) => (
              <div key={b.id} className="card p-3.5 flex items-center gap-3">
                <Avatar
                  name={b.renter.businessName ?? b.renter.name}
                  color={b.renter.avatarColor}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">
                    {b.renter.businessName ?? b.renter.name}
                  </p>
                  <p className="text-xs text-[var(--color-mist)]">
                    {b.days} day{b.days === 1 ? "" : "s"} · {tzs(b.totalPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {isOwner ? (
        <section className="pad mt-6">
          <Link href="/machineshare" className="btn btn-ghost w-full">
            This is your listing
          </Link>
        </section>
      ) : null}
        </div>
      </div>
    </main>
  );
}
