"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { Eyebrow } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <>
      <Eyebrow>Welcome back</Eyebrow>
      <h2 className="display text-[28px] mt-2">Sign in to your workspace</h2>
      <p className="text-[var(--color-mist)] text-[0.9rem] mt-2">
        Use a demo account or your registered number.
      </p>

      <form action={action} className="mt-7">
        <label className="label mt-[18px]" htmlFor="phone">
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
          defaultValue="0754110001"
          required
        />

        <label className="label mt-[18px]" htmlFor="password">
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
          defaultValue="1234"
          required
        />

        {state?.error ? (
          <p className="text-[13px] mt-4" style={{ color: "#c43e21" }}>
            {state.error}
          </p>
        ) : null}

        <button className="btn btn-primary w-full mt-6" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"} <ArrowRight size={18} />
        </button>
      </form>

      <p className="text-[12px] text-[var(--color-mist)] text-center mt-6">
        Demo: <b className="text-[var(--color-ink)]">0754110001</b> ·{" "}
        <b className="text-[var(--color-ink)]">1234</b>
      </p>

      <p className="text-center text-[0.85rem] text-[var(--color-mist)] mt-5">
        New here?{" "}
        <Link href="/register" className="link">
          Create an account
        </Link>
      </p>
    </>
  );
}
