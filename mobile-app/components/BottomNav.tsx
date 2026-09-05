"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Wrench, Gauge, Recycle, UserRound } from "lucide-react";

const ITEMS = [
  { href: "/home", label: "Home", icon: LayoutGrid },
  { href: "/fundilink", label: "Fundi", icon: Wrench, accent: "#ff7449" },
  { href: "/machineshare", label: "Machines", icon: Gauge, accent: "#3175b8" },
  { href: "/takatrade", label: "Taka", icon: Recycle, accent: "#338346" },
  { href: "/account", label: "Account", icon: UserRound },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav fixed left-1/2 -translate-x-1/2 z-50 w-full max-w-[34rem]">
      <ul className="mobile-nav-inner">
        {ITEMS.map(({ href, label, icon: Icon, accent }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const color = active ? accent ?? "#d8ef51" : "#91a39d";
          return (
            <li key={href} className="flex-1 min-w-0">
              <Link href={href} className="mobile-nav-link" aria-current={active ? "page" : undefined}>
                <span className={`mobile-nav-icon ${active ? "is-active" : ""}`} style={{ color }}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.9} />
                </span>
                <span className="mobile-nav-label" style={{ color }}>{label}</span>
                {active ? <i className="mobile-nav-dot" style={{ background: color }} /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
