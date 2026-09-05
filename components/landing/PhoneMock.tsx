"use client";

import { useEffect, useRef, useState } from "react";

const SCRIPT = [
  { t: "dial", body: "*384*7788#" },
  {
    t: "screen",
    body:
      "Karibu Viwanda Prime, Juma.\n1. Ripoti hitilafu\n2. Tafuta kazi\n3. Bei za taka\n4. Salio langu",
  },
  { t: "dial", body: "2" },
  {
    t: "screen",
    body:
      "Kazi zilizopo:\n1. Container offloading - TSh 22,000/day\n2. Packaging line - TSh 18,000/day\n3. Factory deep clean - TSh 20,000/day",
  },
  { t: "dial", body: "1" },
  {
    t: "screen",
    body:
      "Ombi limetumwa!\nApplication sent for Container offloading at Azania Plastics Ltd.\nTSh 22,000 kwa day.",
  },
];

/** Feature-phone mock that replays a real USSD session on loop. */
export default function PhoneMock() {
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), {
      threshold: 0.3,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!live) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(SCRIPT.length - 1);
      return;
    }
    const id = setTimeout(
      () => setStep((s) => (s + 1) % SCRIPT.length),
      step === SCRIPT.length - 1 ? 3400 : 1700
    );
    return () => clearTimeout(id);
  }, [step, live]);

  const current = SCRIPT[step];
  const lastScreen =
    current.t === "screen"
      ? current.body
      : SCRIPT.slice(0, step).reverse().find((s) => s.t === "screen")?.body ??
        "Dial *384*7788# to start";

  return (
    <div ref={ref} className="mx-auto" style={{ width: 238 }}>
      <div
        className="rounded-[18px] p-3 pb-6"
        style={{
          background: "#213c36",
          border: "1px solid #2f544b",
          boxShadow: "0 30px 60px -34px rgba(20,36,34,0.55)",
        }}
      >
        <div
          className="h-1 w-10 mx-auto rounded-full mb-3"
          style={{ background: "#3d6157" }}
        />
        <div
          className="rounded-[6px] p-3 mono text-[0.63rem] leading-[1.55] whitespace-pre-wrap"
          style={{
            background: "#d8ef51",
            color: "#19362e",
            minHeight: 134,
          }}
        >
          {lastScreen}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
            (k) => {
              const hot = current.t === "dial" && current.body.includes(k);
              return (
                <div
                  key={k}
                  className="h-5 rounded grid place-items-center mono text-[0.55rem] font-medium transition-colors duration-200"
                  style={{
                    background: hot ? "#d8ef51" : "#2c4c44",
                    color: hot ? "#19362e" : "#7d968d",
                  }}
                >
                  {k}
                </div>
              );
            }
          )}
        </div>
      </div>

      <p className="text-center eyebrow mt-3">
        {current.t === "dial" ? `dialling ${current.body}` : " "}
      </p>
    </div>
  );
}
