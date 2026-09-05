"use client";

import { useState } from "react";
import { PAYMENT_METHODS } from "@/lib/tz";

/** Mobile-money picker used wherever money changes hands. */
export default function PayMethod({ accent = "#f59e0b" }: { accent?: string }) {
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0].id);

  return (
    <div>
      <span className="label">Pay with</span>
      <div className="grid grid-cols-2 gap-2">
        {PAYMENT_METHODS.map((m) => {
          const on = method === m.id;
          return (
            <button
              type="button"
              key={m.id}
              onClick={() => setMethod(m.id)}
              className="card p-3 text-left"
              style={{ borderColor: on ? accent : undefined }}
            >
              <span
                className="block text-sm font-semibold"
                style={{ color: on ? accent : undefined }}
              >
                {m.label}
              </span>
              <span className="block text-[0.68rem] text-[var(--color-mist)]">
                {m.hint}
              </span>
            </button>
          );
        })}
      </div>
      <input type="hidden" name="method" value={method} />
    </div>
  );
}
