import Link from "next/link";
import { Wrench } from "lucide-react";

/**
 * Auth screens: single column on mobile, and the reference split-screen on
 * desktop — deep charcoal brand panel beside a white form panel.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[52%_48%]">
      {/* Brand panel — desktop only */}
      <section
        className="hidden lg:flex flex-col justify-between text-white px-[8vw] py-12"
        style={{
          background:
            "radial-gradient(circle at 80% 30%, #28685b 0, #102421 45%)",
        }}
      >
        <Link href="/" className="flex items-center gap-[7px] tracking-[0.7px]">
          <Wrench size={20} />
          <span className="font-extrabold">VIWANDA</span>
          <i
            className="not-italic text-[12px] rounded px-[5px] py-[2px]"
            style={{ background: "#315546", color: "#d8ef51" }}
          >
            PRIME
          </i>
        </Link>

        <div>
          <p
            className="eyebrow mb-3"
            style={{ color: "#b8c9c3" }}
          >
            Tanzania industrial marketplace
          </p>
          <h1 className="display text-[clamp(40px,5vw,70px)] leading-[1.03]">
            Keep production
            <br />
            <em className="not-italic" style={{ color: "#d8ef51" }}>
              moving.
            </em>
          </h1>
          <p
            className="max-w-[480px] leading-[1.7] mt-6"
            style={{ color: "#c1d0ca" }}
          >
            Find a fundi, rent machinery, trade industrial waste and hire
            labour — online, or from any basic phone.
          </p>
        </div>

        <div className="signal">
          <span />
          <span />
          <span />
          <span />
          <b
            className="ml-2.5 mono text-[10px] tracking-[1px]"
            style={{ color: "#c1d0ca" }}
          >
            OFFLINE ACCESS READY
          </b>
        </div>
      </section>

      {/* Form panel */}
      <section className="grid place-items-center bg-white min-h-dvh lg:min-h-0">
        <div className="w-full max-w-[390px] px-5 lg:px-0 py-10">
          {children}
        </div>
      </section>
    </main>
  );
}
