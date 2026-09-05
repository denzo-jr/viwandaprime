"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { PageHeader } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <main className="pb-16">
      <PageHeader title="Karibu tena" subtitle="Log in to continue" back="/" />

      <form action={action} className="pad flex flex-col gap-4 mt-2">
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
            placeholder="0754 110 001"
            autoComplete="tel"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            PIN
          </label>
          <input
            id="password"
            name="password"
            type="password"
            inputMode="numeric"
            className="field"
            placeholder="••••"
            autoComplete="current-password"
            required
          />
        </div>

        {state?.error ? (
          <p className="text-sm" style={{ color: "#ef4444" }}>
            {state.error}
          </p>
        ) : null}

        <button className="btn btn-primary w-full mt-2" disabled={pending}>
          {pending ? "Checking…" : "Log in"}
        </button>

        <p className="text-center text-sm text-[var(--color-mist)] mt-2">
          New here?{" "}
          <Link href="/register" style={{ color: "#f59e0b" }}>
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
