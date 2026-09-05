import Link from "next/link";
import { Factory, Signal, Wrench } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-mobile min-h-dvh">
      <section className="auth-brand">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <Link href="/" className="relative flex items-center gap-2 tracking-[0.06em]">
          <span className="brand-mark"><Wrench size={18} /></span>
          <b className="text-[0.9rem]">VIWANDA</b>
          <em className="brand-prime">PRIME</em>
        </Link>
        <div className="relative mt-10">
          <span className="auth-kicker"><Factory size={13} /> INDUSTRY IN YOUR POCKET</span>
          <h1 className="display text-[2.45rem] leading-[0.98] mt-4">
            Keep production<br /><span>moving.</span>
          </h1>
          <p className="text-[0.82rem] leading-relaxed mt-4 max-w-[19rem]">
            Fundis, machinery, materials and trusted workers — wherever work happens.
          </p>
        </div>
        <div className="relative flex items-center gap-2 mt-7 text-[0.66rem] font-semibold tracking-wide">
          <Signal size={14} /> SMARTPHONE + USSD READY
        </div>
      </section>

      <section className="auth-sheet">
        <div className="auth-handle" />
        {children}
      </section>
    </main>
  );
}
