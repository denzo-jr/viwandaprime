"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";

const LINKS = [
  { href: "#modules", label: "Modules" },
  { href: "#escrow", label: "Escrow" },
  { href: "#ussd", label: "USSD" },
  { href: "#impact", label: "Impact" },
];

export default function Nav({ loggedIn }: { loggedIn: boolean }) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: solid ? "rgba(16,36,33,0.94)" : "transparent",
        backdropFilter: solid ? "blur(12px)" : "none",
        borderBottom: `1px solid ${solid ? "#294039" : "transparent"}`,
      }}
    >
      <div className="mx-auto max-w-[1400px] px-5 lg:px-10 h-[70px] flex items-center gap-6 text-white">
        <Link
          href="/"
          className="flex items-center gap-[7px] shrink-0 tracking-[0.7px]"
        >
          <Wrench size={19} />
          <span className="font-extrabold hidden sm:inline">VIWANDA</span>
          <i
            className="not-italic text-[12px] rounded px-[5px] py-[2px]"
            style={{ background: "#315546", color: "#d8ef51" }}
          >
            PRIME
          </i>
        </Link>

        <nav className="hidden md:flex items-center gap-7 ml-4">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] transition-colors"
              style={{ color: "#bdcac5" }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <Link
          href={loggedIn ? "/home" : "/login"}
          className="btn ml-auto min-h-[40px] text-[13px] whitespace-nowrap"
          style={{ background: "#d8ef51", color: "#19362e" }}
        >
          {loggedIn ? "Open dashboard" : "Sign in"}
        </Link>
      </div>
    </header>
  );
}
