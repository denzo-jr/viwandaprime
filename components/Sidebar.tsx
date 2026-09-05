"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  Gauge,
  Recycle,
  BriefcaseBusiness,
  Signal,
  Bell,
  Settings,
  Factory,
} from "lucide-react";
import { tzs } from "@/lib/format";

const PRIMARY = [
  { href: "/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fundilink", label: "FundiLink", icon: Wrench, tag: "REPAIR" },
  { href: "/machineshare", label: "MachineShare", icon: Gauge },
  { href: "/takatrade", label: "TakaTrade", icon: Recycle },
  { href: "/kibaruapay", label: "KibaruaPay", icon: BriefcaseBusiness },
];

const SECONDARY = [
  { href: "/ussd", label: "USSD access", icon: Signal },
  { href: "/inbox", label: "SMS inbox", icon: Bell },
  { href: "/account", label: "Account", icon: Settings },
];

export default function Sidebar({
  name,
  wallet,
  unread,
}: {
  name: string;
  wallet: number;
  color: string;
  unread: number;
}) {
  const pathname = usePathname();
  const isOn = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[250px] flex-col text-white z-40 px-[15px] py-[27px]"
      style={{ background: "#102421" }}
    >
      <Link
        href="/"
        className="flex items-center gap-[7px] px-3 pb-7 tracking-[0.7px]"
      >
        <Wrench size={20} />
        <b className="font-extrabold text-[0.95rem]">VIWANDA</b>
        <em
          className="not-italic text-[12px] rounded px-[5px] py-[2px]"
          style={{ background: "#315546", color: "#d8ef51" }}
        >
          PRIME
        </em>
      </Link>

      {/* Who is signed in */}
      <div
        className="flex gap-2.5 px-3 py-[15px]"
        style={{ borderTop: "1px solid #294039", borderBottom: "1px solid #294039" }}
      >
        <Factory size={17} className="shrink-0 mt-0.5" />
        <span className="min-w-0">
          <small
            className="block mono text-[10px] mb-[3px]"
            style={{ color: "#93a59f" }}
          >
            FACTORY PORTAL
          </small>
          <b className="block text-[12px] truncate">{name}</b>
        </span>
      </div>

      <nav className="mt-5 grid gap-[3px]">
        {PRIMARY.map(({ href, label, icon: Icon, tag }) => {
          const on = isOn(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-[11px] px-3 py-[11px] rounded-md text-[13px] transition-colors"
              style={{
                background: on ? "#203a34" : "transparent",
                color: on ? "#fff" : "#bdcac5",
                fontWeight: on ? 700 : 500,
              }}
            >
              <Icon size={18} />
              {label}
              {tag ? (
                <i
                  className="not-italic mono text-[9px] ml-auto"
                  style={{ color: "#d8ef51" }}
                >
                  {tag}
                </i>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <nav className="mt-5 grid gap-[3px]">
        {SECONDARY.map(({ href, label, icon: Icon }) => {
          const on = isOn(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-[11px] px-3 py-[11px] rounded-md text-[13px] transition-colors"
              style={{
                background: on ? "#203a34" : "transparent",
                color: on ? "#fff" : "#bdcac5",
                fontWeight: on ? 700 : 500,
              }}
            >
              <Icon size={18} />
              {label}
              {href === "/inbox" && unread > 0 ? (
                <i
                  className="not-italic mono text-[9px] ml-auto"
                  style={{ color: "#d8ef51" }}
                >
                  {unread}
                </i>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <p
          className="mono text-[9px] px-3 mt-5 leading-relaxed"
          style={{ color: "#71837d" }}
        >
          WALLET BALANCE
          <span className="block mt-1.5" style={{ color: "#b6d84b" }}>
            {tzs(wallet)}
          </span>
        </p>
        <p
          className="mono text-[9px] px-3 mt-4 leading-relaxed"
          style={{ color: "#71837d" }}
        >
          NETWORK STATUS
          <span className="block mt-1.5" style={{ color: "#b6d84b" }}>
            ● OPERATIONAL
          </span>
        </p>
      </div>
    </aside>
  );
}
