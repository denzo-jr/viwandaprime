import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import UssdSimulator from "@/components/UssdSimulator";
import { PageHeader, SectionTitle } from "@/components/ui";

const ACCENT = "#338346";

export default async function UssdPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <main className="pb-20">
      <PageHeader
        topLevel
        title="USSD access"
        subtitle="For the 60% on feature phones"
        back="/home"
      />

      <section className="pad">
        <div className="card p-4" style={{ borderColor: `${ACCENT}33` }}>
          <p className="text-sm leading-relaxed">
            Most fundis and workers in Tanzania do not carry a smartphone. The
            whole marketplace also runs over USSD, so a technician with a
            10,000/= handset can still receive work.
          </p>
          <p className="text-xs text-[var(--color-mist)] mt-3 leading-relaxed">
            This simulator posts to the same{" "}
            <span className="font-mono text-[var(--color-chalk)]">
              /api/ussd
            </span>{" "}
            endpoint that Africa&rsquo;s Talking calls in production — the
            request and response format is identical.
          </p>
        </div>
      </section>

      <section className="pad mt-6">
        <SectionTitle>Try it as {user.phone}</SectionTitle>
        <UssdSimulator phone={user.phone} />
      </section>

      <section className="pad mt-7">
        <SectionTitle>What you can do</SectionTitle>
        <div className="flex flex-col gap-2.5">
          {[
            {
              n: "1",
              t: "Ripoti hitilafu",
              d: "Report a machine breakdown — alerts every technician in your region.",
            },
            {
              n: "2",
              t: "Tafuta kazi",
              d: "Browse and apply for labour jobs near you.",
            },
            {
              n: "3",
              t: "Bei za taka",
              d: "Check current market prices for industrial materials.",
            },
            {
              n: "4",
              t: "Salio langu",
              d: "See your wallet balance and money held in escrow.",
            },
          ].map((i) => (
            <div key={i.n} className="card p-3.5 flex gap-3">
              <span
                className="w-7 h-7 shrink-0 rounded-lg grid place-items-center font-mono text-xs font-bold"
                style={{ background: `${ACCENT}1f`, color: ACCENT }}
              >
                {i.n}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{i.t}</p>
                <p className="text-xs text-[var(--color-mist)] mt-0.5 leading-relaxed">
                  {i.d}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
