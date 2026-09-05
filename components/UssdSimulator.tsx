"use client";

import { useState } from "react";
import { Phone, PhoneOff, CornerDownLeft } from "lucide-react";

const SERVICE_CODE = "*384*7788#";

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
          background: "#0a1f12",
          border: "1px solid #1d4a2c",
          color: "#7ff2a8",
          boxShadow: "inset 0 0 30px rgba(34,197,94,0.08)",
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
            style={{ background: "#22c55e", color: "#04240f" }}
          >
            <Phone size={17} /> Dial {SERVICE_CODE}
          </button>
        ) : (
          <button onClick={hangUp} className="btn btn-ghost w-full" style={{ color: "#ef4444" }}>
            <PhoneOff size={17} /> End session
          </button>
        )}
      </div>
    </div>
  );
}
