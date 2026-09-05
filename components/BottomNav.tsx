"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, Package, Recycle, User } from "lucide-react";

const ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/fundilink", label: "Fundi", icon: Wrench },
  { href: "/machineshare", label: "Machines", icon: Package },
  { href: "/takatrade", label: "Taka", icon: Recycle },
  { href: "/account", label: "Account", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[34rem] z-50 border-t border-[var(--color-line)]"
      style={{
        background: "rgba(11,15,20,0.92)",
        backdropFilter: "blur(14px)",
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
                className="flex flex-col items-center justify-center gap-1 min-h-[3.75rem] py-2"
                style={{ color: active ? "#f59e0b" : "#66798f" }}
              >
                <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
                <span className="text-[0.65rem] font-semibold tracking-wide">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
