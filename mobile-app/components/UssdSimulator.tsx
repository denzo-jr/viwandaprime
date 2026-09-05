"use client";

import { useState } from "react";
import { Phone, PhoneOff, CornerDownLeft } from "lucide-react";
import { USSD_CODE } from "@/lib/tz";

const SERVICE_CODE = USSD_CODE;

export default function UssdSimulator({ phone }: { phone: string }) {
  const [screen, setScreen] = useState<string>(
    `Dial ${SERVICE_CODE} to start a session.`
  );
  const [text, setText] = useState<string>("");
  const [active, setActive] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(nextText: string) {
    setBusy(true);
    try {
      const body = new URLSearchParams({
        sessionId: `sim-${Date.now()}`,
        serviceCode: SERVICE_CODE,
        phoneNumber: phone,
        text: nextText,
      });
      const res = await fetch("/api/ussd", { method: "POST", body });
      const raw = await res.text();

      if (raw.startsWith("CON ")) {
        setScreen(raw.slice(4));
        setText(nextText);
        setActive(true);
      } else {
        setScreen(raw.slice(4));
        setText("");
        setActive(false);
      }
    } catch {
      setScreen("Network error. Try again.");
      setActive(false);
    } finally {
      setBusy(false);
      setInput("");
    }
  }

  function dial() {
    send("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    send(text === "" ? input.trim() : `${text}*${input.trim()}`);
  }

  function hangUp() {
    setActive(false);
    setText("");
    setInput("");
    setScreen(`Dial ${SERVICE_CODE} to start a session.`);
  }

  return (
    <div>
      {/* Feature-phone screen */}
      <div
        className="rounded-2xl p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap min-h-[13rem]"
        style={{
          background: "#213c36",
          border: "1px solid #2f544b",
          color: "#d8ef51",
          boxShadow: "inset 0 0 30px rgba(216,239,81,0.06)",
        }}
      >
        {busy ? "…" : screen}
      </div>

      {active ? (
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            inputMode="numeric"
            className="field flex-1"
            placeholder="Enter choice"
            autoFocus
          />
          <button
            className="btn btn-primary px-4"
            disabled={busy}
            aria-label="Send"
          >
            <CornerDownLeft size={18} />
          </button>
        </form>
      ) : null}

      <div className="mt-4 flex gap-2">
        {!active ? (
          <button
            onClick={dial}
            disabled={busy}
            className="btn w-full"
            style={{ background: "#d8ef51", color: "#19362e" }}
          >
            <Phone size={17} /> Dial {SERVICE_CODE}
          </button>
        ) : (
          <button onClick={hangUp} className="btn btn-ghost w-full" style={{ color: "#c43e21" }}>
            <PhoneOff size={17} /> End session
          </button>
        )}
      </div>
    </div>
  );
}
