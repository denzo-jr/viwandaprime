"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  Gauge,
  Recycle,
  Settings,
} from "lucide-react";

const ITEMS = [
  { href: "/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fundilink", label: "Fundi", icon: Wrench },
  { href: "/machineshare", label: "Machines", icon: Gauge },
  { href: "/takatrade", label: "Taka", icon: Recycle },
  { href: "/account", label: "Account", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[34rem] z-50"
      style={{
        background: "#102421",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="flex items-stretch">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex flex-col items-center justify-center gap-1 min-h-[3.6rem] py-2"
                style={{ color: active ? "#d8ef51" : "#8ba099" }}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
                <span
                  className="mono text-[0.58rem] tracking-wide"
                  style={{ fontWeight: active ? 500 : 400 }}
                >
                  {label.toUpperCase()}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
