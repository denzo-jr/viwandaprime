import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Gauge,
  Wrench,
  Recycle,
  BriefcaseBusiness,
  AlertTriangle,
} from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MODULES } from "@/lib/tz";
import { demoLoginAction } from "./actions/auth";
import Nav from "@/components/landing/Nav";
import Reveal from "@/components/landing/Reveal";
import CountUp from "@/components/landing/CountUp";
import NetworkGlobe from "@/components/landing/NetworkGlobe";
import Ticker from "@/components/landing/Ticker";
import PhoneMock from "@/components/landing/PhoneMock";
import { Avatar, Eyebrow } from "@/components/ui";

const MODULE_ICON = {
  fundilink: Wrench,
  machineshare: Gauge,
  takatrade: Recycle,
  kibaruapay: BriefcaseBusiness,
} as const;

const MODULE_TONE = {
  fundilink: "orange",
  machineshare: "blue",
  takatrade: "green",
  kibaruapay: "purple",
} as const;

export default async function Landing() {
  const user = await currentUser();

  const [openJobs, machines, waste, labour, technicians, demoUsers] =
    await Promise.all([
      prisma.jobRequest.count({ where: { status: "OPEN" } }),
      prisma.machine.count({ where: { available: true } }),
      prisma.wasteListing.findMany({
        where: { status: "AVAILABLE" },
        select: { quantity: true, unit: true },
      }),
      prisma.labourJob.findMany({
        where: { status: "OPEN" },
        select: { workersNeeded: true },
      }),
      prisma.user.count({ where: { roles: { contains: "TECHNICIAN" } } }),
      prisma.user.findMany({
        where: {
          phone: { in: ["+255754110001", "+255754110002", "+255754110003"] },
        },
        orderBy: { phone: "asc" },
      }),
    ]);

  const tonnes = waste.reduce(
    (s, l) => s + (l.unit === "TONNE" ? l.quantity : l.quantity / 1000),
    0
  );
  const seats = labour.reduce((s, j) => s + j.workersNeeded, 0);

  const counts: Record<string, string> = {
    fundilink: `${openJobs} OPEN`,
    machineshare: `${machines} LISTED`,
    takatrade: `${tonnes.toFixed(1)} TONNES`,
    kibaruapay: `${seats} POSITIONS`,
  };

  return (
    <>
      <Nav loggedIn={Boolean(user)} />

      {/* ================= HERO ================= */}
      <section
        className="relative text-white overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 80% 30%, #28685b 0, #102421 45%)",
        }}
      >
        <div className="mx-auto max-w-[1400px] px-5 lg:px-10 pt-[120px] pb-20 lg:py-[130px] grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
          <div>
            <Reveal>
              <p className="eyebrow" style={{ color: "#b8c9c3" }}>
                Industrial marketplace · Tanzania
              </p>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="display text-[clamp(40px,5.6vw,70px)] leading-[1.03] mt-4">
                Keep production
                <br />
                <em className="not-italic" style={{ color: "#d8ef51" }}>
                  moving.
                </em>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p
                className="max-w-[480px] leading-[1.7] mt-6"
                style={{ color: "#c1d0ca" }}
              >
                One network that connects factories to verified technicians,
                shared machinery, reusable materials and reliable labour —
                online, or from any basic phone.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="flex flex-wrap items-center gap-3 mt-9">
                <Link
                  href={user ? "/home" : "/register"}
                  className="btn"
                  style={{ background: "#d8ef51", color: "#19362e" }}
                >
                  {user ? "Open your dashboard" : "Get started free"}
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#modules"
                  className="btn"
                  style={{
                    background: "transparent",
                    border: "1px solid #3d6157",
                    color: "#fff",
                  }}
                >
                  See how it works
                </a>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="signal mt-12">
                <span />
                <span />
                <span />
                <span />
                <b
                  className="ml-2.5 mono text-[10px] tracking-[1px]"
                  style={{ color: "#c1d0ca" }}
                >
                  OFFLINE ACCESS READY · *384*7788#
                </b>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200} className="hidden lg:flex justify-center">
            <NetworkGlobe size={430} />
          </Reveal>
        </div>
      </section>

      <div className="bg-white">
        <Ticker
          items={[
            "FUNDILINK — TECHNICIANS ON DEMAND",
            "MACHINESHARE — RENT MACHINERY & SPARE PARTS",
            "TAKATRADE — INDUSTRIAL WASTE MARKETPLACE",
            "KIBARUAPAY — LABOUR WITH SECURE PAY",
            "M-PESA · MIXX · AIRTEL MONEY · HALOPESA",
            "USSD *384*7788# — WORKS ON ANY PHONE",
          ]}
        />
      </div>

      {/* ================= LIVE STATS ================= */}
      <section className="mx-auto max-w-[1400px] px-5 lg:px-10 py-16 lg:py-20">
        <Reveal>
          <Eyebrow>Live on the network</Eyebrow>
          <h2 className="display text-[clamp(1.7rem,3.4vw,2.4rem)] mt-2 max-w-2xl">
            Real capacity, updating as the market moves.
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[15px] mt-10">
          {[
            { icon: Wrench, v: technicians, l: "Verified technicians", t: "orange", d: 0, s: "" },
            { icon: Gauge, v: machines, l: "Machines shared", t: "blue", d: 0, s: "" },
            { icon: Recycle, v: tonnes, l: "Tonnes diverted", t: "green", d: 1, s: "t" },
            { icon: BriefcaseBusiness, v: seats, l: "Paid positions open", t: "purple", d: 0, s: "" },
          ].map(({ icon: Icon, v, l, t, d, s }, i) => (
            <Reveal key={l} delay={i * 70}>
              <div className={`stat tone-${t}`}>
                <span className="chip">
                  <Icon size={18} />
                </span>
                <b>
                  <CountUp to={v} decimals={d} suffix={s} />
                </b>
                <span className="k">{l}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= PROBLEM ================= */}
      <section className="bg-white border-y border-[var(--color-line)]">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-10 py-16 lg:py-24">
          <Reveal>
            <Eyebrow>The problem</Eyebrow>
            <h2 className="display text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.1] mt-3 max-w-3xl">
              A broken machine can stop a factory for{" "}
              <span style={{ color: "#db4d30" }}>days</span> — because nobody
              knows who can fix it.
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {[
              {
                n: "Downtime",
                d: "Finding a qualified fundi means phoning around and hoping. Production waits.",
              },
              {
                n: "Idle capital",
                d: "Heavy machinery sits unused in one yard while a workshop nearby cannot afford to buy it.",
              },
              {
                n: "Wasted material",
                d: "Factory by-products go to landfill while another SME imports the same thing as raw input.",
              },
              {
                n: "Unreliable work",
                d: "Skilled and manual workers have no trusted way to find short-term jobs, or to be paid safely.",
              },
            ].map((p, i) => (
              <Reveal key={p.n} delay={i * 70}>
                <div className="panel p-6 h-full">
                  <h3 className="display text-[1.05rem]">{p.n}</h3>
                  <p className="text-[0.85rem] text-[var(--color-mist)] mt-3 leading-relaxed">
                    {p.d}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MODULES ================= */}
      <section
        id="modules"
        className="mx-auto max-w-[1400px] px-5 lg:px-10 py-16 lg:py-24 scroll-mt-20"
      >
        <Reveal>
          <Eyebrow>Four markets, one platform</Eyebrow>
          <h2 className="display text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.1] mt-3">
            Everything a factory needs to keep running.
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-[15px] mt-12">
          {MODULES.map((m, i) => {
            const Icon = MODULE_ICON[m.slug];
            const tone = MODULE_TONE[m.slug];
            return (
              <Reveal key={m.slug} delay={i * 80}>
                <Link
                  href={user ? m.href : "/login"}
                  className="panel card-lift p-7 h-full block group"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`stat tone-${tone} !p-0 !border-0 !bg-transparent !grid-cols-1`}
                    >
                      <span className="chip !w-[42px] !h-[42px]">
                        <Icon size={20} />
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="display text-[1.3rem]">{m.name}</h3>
                        <span
                          className="badge"
                          style={{
                            background: `${m.accent}14`,
                            color: m.accent,
                          }}
                        >
                          {counts[m.slug]}
                        </span>
                      </div>
                      <p className="text-[0.8rem] text-[var(--color-mist)] mt-1">
                        {m.swahili}
                      </p>
                    </div>
                  </div>

                  <p className="text-[0.9rem] text-[var(--color-mist)] mt-5 leading-relaxed">
                    {m.description}
                  </p>

                  <span className="link mt-6 group-hover:gap-2 transition-all">
                    Open {m.name} <ChevronRight size={16} />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ================= ESCROW ================= */}
      <section
        id="escrow"
        className="bg-white border-y border-[var(--color-line)] scroll-mt-20"
      >
        <div className="mx-auto max-w-[1400px] px-5 lg:px-10 py-16 lg:py-24">
          <Reveal>
            <Eyebrow>KibaruaPay escrow</Eyebrow>
            <h2 className="display text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.1] mt-3 max-w-3xl">
              Nobody gets paid on trust.
            </h2>
            <p className="text-[var(--color-mist)] mt-5 max-w-2xl leading-relaxed">
              The single biggest reason informal industrial work fails is
              payment. So money never moves directly between strangers — it
              moves through escrow, in every one of the four modules.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-[15px] mt-12">
            {[
              {
                n: "01",
                t: "Buyer funds escrow",
                d: "The business pays by M-Pesa, Mixx, Airtel Money or HaloPesa the moment they accept a quote or hire a worker.",
              },
              {
                n: "02",
                t: "Money is held",
                d: "Funds sit in escrow while the work happens. The technician knows the money is real; the business knows it is safe.",
              },
              {
                n: "03",
                t: "Released on confirmation",
                d: "The buyer confirms the machine runs, and the wallet is credited instantly. Both sides get an SMS.",
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div className="panel p-7 h-full">
                  <span
                    className="mono text-[2rem] font-medium"
                    style={{ color: "#cfdad7" }}
                  >
                    {s.n}
                  </span>
                  <h3
                    className="display text-[1.05rem] mt-3"
                    style={{ color: "#00877d" }}
                  >
                    {s.t}
                  </h3>
                  <p className="text-[0.85rem] text-[var(--color-mist)] mt-3 leading-relaxed">
                    {s.d}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="panel p-6 mt-[15px] flex items-center gap-4">
              <ShieldCheck size={22} style={{ color: "#00877d" }} />
              <p className="text-[0.88rem] text-[var(--color-mist)] leading-relaxed">
                The same hold-then-release flow protects repair jobs, machine
                bookings, material orders and labour shifts.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= USSD ================= */}
      <section
        id="ussd"
        className="mx-auto max-w-[1400px] px-5 lg:px-10 py-16 lg:py-24 scroll-mt-20"
      >
        <div className="grid lg:grid-cols-[1fr_auto] gap-14 items-center">
          <div>
            <Reveal>
              <Eyebrow>No internet? No problem.</Eyebrow>
              <h2 className="display text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.1] mt-3">
                The fundi who needs this most
                <br />
                <span style={{ color: "#00877d" }}>
                  does not own a smartphone.
                </span>
              </h2>
              <p className="text-[var(--color-mist)] mt-5 max-w-xl leading-relaxed">
                So the entire marketplace also runs over USSD. A technician with
                a 10,000/= handset receives job alerts by SMS and quotes by
                dialling a short code — no data, no app, no problem.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <div className="flex flex-wrap gap-2 mt-7">
                {[
                  "Report a breakdown",
                  "Find and apply for work",
                  "Check material prices",
                  "See your balance",
                ].map((f) => (
                  <span
                    key={f}
                    className="badge"
                    style={{ background: "#e4f4f1", color: "#08756c" }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={190}>
              <div className="offline mt-9">
                <div className="ussd-icon">*#</div>
                <div className="min-w-0">
                  <p className="eyebrow">Africa&rsquo;s Talking ready</p>
                  <h3 className="display text-[1.05rem] mt-1.5">
                    Dial *384*7788# from any phone.
                  </h3>
                  <p
                    className="text-[0.78rem] mt-1.5 leading-relaxed"
                    style={{ color: "#bdccc6" }}
                  >
                    <span className="mono">POST /api/ussd</span> implements the
                    provider contract exactly, so a live service code points
                    straight at it.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={160}>
            <PhoneMock />
          </Reveal>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section
        id="impact"
        className="bg-white border-t border-[var(--color-line)] scroll-mt-20"
      >
        <div className="mx-auto max-w-[1400px] px-5 lg:px-10 py-16 lg:py-24">
          <Reveal>
            <div className="panel p-9 lg:p-14 text-center">
              <span
                className="inline-grid place-items-center w-12 h-12 rounded-[7px] mx-auto"
                style={{ background: "#fff0e9", color: "#ed653b" }}
              >
                <AlertTriangle size={22} />
              </span>
              <h2 className="display text-[clamp(1.7rem,3.4vw,2.5rem)] leading-[1.1] mt-6 max-w-2xl mx-auto">
                Every machine fixed. Every worker paid.
              </h2>
              <p className="text-[var(--color-mist)] mt-4 max-w-lg mx-auto leading-relaxed">
                Try the full marketplace with seeded operations data from Dar es
                Salaam, Mwanza and Tanga.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <Link
                  href={user ? "/home" : "/register"}
                  className="btn btn-primary px-7"
                >
                  {user ? "Open your dashboard" : "Create a free account"}
                  <ArrowRight size={18} />
                </Link>
                {!user ? (
                  <Link href="/login" className="btn btn-outline px-6">
                    Sign in
                  </Link>
                ) : null}
              </div>

              {!user && demoUsers.length > 0 ? (
                <div className="mt-12">
                  <Eyebrow>Judges — one tap, no typing</Eyebrow>
                  <div className="flex flex-wrap justify-center gap-2.5 mt-4">
                    {demoUsers.map((u) => (
                      <form action={demoLoginAction} key={u.id}>
                        <input type="hidden" name="phone" value={u.phone} />
                        <button
                          type="submit"
                          className="panel card-lift px-4 py-3 flex items-center gap-3 text-left"
                        >
                          <Avatar name={u.name} size={34} />
                          <span>
                            <span className="block text-[0.85rem] font-extrabold">
                              {u.businessName ?? u.name}
                            </span>
                            <span className="block eyebrow mt-0.5">
                              {u.roles.split(",").join(" · ")}
                            </span>
                          </span>
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Reveal>
        </div>
      </section>

      <footer style={{ background: "#102421" }} className="text-white">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-10 py-9 flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-[7px] tracking-[0.7px]">
            <Wrench size={17} />
            <b className="text-[0.85rem]">VIWANDA</b>
            <i
              className="not-italic text-[11px] rounded px-[5px] py-[2px]"
              style={{ background: "#315546", color: "#d8ef51" }}
            >
              PRIME
            </i>
          </span>
          <span className="text-[0.8rem]" style={{ color: "#93a59f" }}>
            The operating marketplace for Tanzania&rsquo;s industrial economy.
          </span>
          <span className="mono text-[10px] ml-auto" style={{ color: "#b6d84b" }}>
            ● OPERATIONAL · *384*7788#
          </span>
        </div>
      </footer>
    </>
  );
}
