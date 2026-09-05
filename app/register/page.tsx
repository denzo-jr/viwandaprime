"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction } from "@/app/actions/auth";
import { PageHeader } from "@/components/ui";
import { REGIONS, REGION_NAMES, TECH_SKILLS } from "@/lib/tz";

const ROLES = [
  {
    id: "BUSINESS",
    label: "Business",
    hint: "I run a factory, workshop or SME",
  },
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
    <main className="pb-20">
      <PageHeader
        title="Join Viwanda Prime"
        subtitle="Takes under a minute"
        back="/"
      />

      <form action={action} className="pad flex flex-col gap-5 mt-2">
        <div>
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
        </div>

        <div>
          <label className="label" htmlFor="phone">
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
          <p className="text-xs text-[var(--color-mist)] mt-1.5">
            We send job alerts and payment confirmations to this number.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="password">
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
        </div>

        <div>
          <span className="label">I am a…</span>
          <div className="flex flex-col gap-2">
            {ROLES.map((r) => {
              const on = roles.includes(r.id);
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => toggle(roles, setRoles, r.id)}
                  className="card p-3 text-left flex items-center gap-3"
                  style={{ borderColor: on ? "#f59e0b" : undefined }}
                >
                  <span
                    className="w-5 h-5 rounded-md border grid place-items-center text-[0.7rem] font-bold shrink-0"
                    style={{
                      borderColor: on ? "#f59e0b" : "#24303e",
                      background: on ? "#f59e0b" : "transparent",
                      color: "#1a1205",
                    }}
                  >
                    {on ? "✓" : ""}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {r.label}
                    </span>
                    <span className="block text-xs text-[var(--color-mist)]">
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
        </div>

        {roles.includes("BUSINESS") ? (
          <div>
            <label className="label" htmlFor="businessName">
              Business name
            </label>
            <input
              id="businessName"
              name="businessName"
              className="field"
              placeholder="Mwanza Steel Works"
            />
          </div>
        ) : null}

        {roles.includes("TECHNICIAN") ? (
          <div>
            <span className="label">Your skills</span>
            <div className="flex flex-wrap gap-2">
              {TECH_SKILLS.map((s) => {
                const on = skills.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggle(skills, setSkills, s)}
                    className="tag"
                    style={{
                      background: on ? "#f59e0b22" : "#1c2632",
                      color: on ? "#f59e0b" : "#8fa3b8",
                      border: `1px solid ${on ? "#f59e0b66" : "#24303e"}`,
                      minHeight: "2rem",
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
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
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
          <p className="text-sm" style={{ color: "#ef4444" }}>
            {state.error}
          </p>
        ) : null}

        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>

        <p className="text-center text-sm text-[var(--color-mist)]">
          Already registered?{" "}
          <Link href="/login" style={{ color: "#f59e0b" }}>
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
