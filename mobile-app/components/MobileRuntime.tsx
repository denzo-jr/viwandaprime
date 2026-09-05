"use client";

import { useEffect } from "react";

/** Registers the lightweight PWA runtime when the app is served over HTTPS. */
export default function MobileRuntime() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // LAN development commonly uses HTTP, where service workers are disabled.
      });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
