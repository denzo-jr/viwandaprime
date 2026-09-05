"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { registerAction } from "@/app/actions/auth";
import { Eyebrow } from "@/components/ui";
import { REGIONS, REGION_NAMES, TECH_SKILLS } from "@/lib/tz";

const ROLES = [
  { id: "BUSINESS", label: "Business", hint: "I run a factory, workshop or SME" },
  { id: "TECHNICIAN", label: "Fundi", hint: "I repair and service machines" },
  { id: "WORKER", label: "Worker", hint: "I take on short-term manual jobs" },
];

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined);
  const [roles, setRoles] = useState<string[]>(["BUSINESS"]);
  const [region, setRegion] = useState(REGION_NAMES[0]);
  const [skills, setSkills] = useState<string[]>([]);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  return (
    <>
      <Eyebrow>Join the network</Eyebrow>
      <h2 className="display text-[28px] mt-2">Create your account</h2>
      <p className="text-[var(--color-mist)] text-[0.9rem] mt-2">
        Takes under a minute.
      </p>

      <form action={action} className="mt-7">
        <label className="label" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          name="name"
          className="field"
          placeholder="Asha Mwakalinga"
          required
        />

        <label className="label mt-[18px]" htmlFor="phone">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          className="field"
          placeholder="0754 000 000"
          required
        />
        <p className="text-[11px] text-[var(--color-mist)] mt-1.5">
          Job alerts and payment confirmations are sent here.
        </p>

        <label className="label mt-[18px]" htmlFor="password">
          Choose a PIN
        </label>
        <input
          id="password"
          name="password"
          type="password"
          inputMode="numeric"
          className="field"
          placeholder="At least 4 digits"
          required
        />

        <span className="label mt-[18px]">I am a…</span>
        <div className="grid gap-2">
          {ROLES.map((r) => {
            const on = roles.includes(r.id);
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => toggle(roles, setRoles, r.id)}
                className="text-left flex items-center gap-3 rounded-[7px] p-3 border transition-colors"
                style={{
                  borderColor: on ? "#00877d" : "#dce5e2",
                  background: on ? "#eff9f6" : "#fff",
                }}
              >
                <span
                  className="w-5 h-5 rounded grid place-items-center shrink-0 border"
                  style={{
                    borderColor: on ? "#00877d" : "#cbd8d4",
                    background: on ? "#00877d" : "#fff",
                    color: "#fff",
                  }}
                >
                  {on ? <Check size={13} strokeWidth={3} /> : null}
                </span>
                <span>
                  <span
                    className="block text-[13px] font-extrabold"
                    style={{ color: on ? "#006f66" : undefined }}
                  >
                    {r.label}
                  </span>
                  <span className="block text-[11px] text-[var(--color-mist)]">
                    {r.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {roles.map((r) => (
          <input key={r} type="hidden" name="roles" value={r} />
        ))}

        {roles.includes("BUSINESS") ? (
          <>
            <label className="label mt-[18px]" htmlFor="businessName">
              Business name
            </label>
            <input
              id="businessName"
              name="businessName"
              className="field"
              placeholder="Mwanza Steel Works"
            />
          </>
        ) : null}

        {roles.includes("TECHNICIAN") ? (
          <>
            <span className="label mt-[18px]">Your skills</span>
            <div className="flex flex-wrap gap-2">
              {TECH_SKILLS.map((s) => {
                const on = skills.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggle(skills, setSkills, s)}
                    className="rounded-[7px] px-3 py-2 text-[12px] font-bold border transition-colors"
                    style={{
                      borderColor: on ? "#00877d" : "#dce5e2",
                      background: on ? "#eff9f6" : "#fff",
                      color: on ? "#006f66" : "#71807d",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {skills.map((s) => (
              <input key={s} type="hidden" name="skills" value={s} />
            ))}
          </>
        ) : null}

        <div className="grid grid-cols-2 gap-3 mt-[18px]">
          <div>
            <label className="label" htmlFor="region">
              Region
            </label>
            <select
              id="region"
              name="region"
              className="field"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {REGION_NAMES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="district">
              District
            </label>
            <select id="district" name="district" className="field">
              {(REGIONS[region] ?? []).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {state?.error ? (
          <p className="text-[13px] mt-4" style={{ color: "#c43e21" }}>
            {state.error}
          </p>
        ) : null}

        <button className="btn btn-primary w-full mt-6" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}{" "}
          <ArrowRight size={18} />
        </button>
      </form>

      <p className="text-center text-[0.85rem] text-[var(--color-mist)] mt-5">
        Already registered?{" "}
        <Link href="/login" className="link">
          Sign in
        </Link>
      </p>
    </>
  );
}
