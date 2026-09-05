"use client";

import { useEffect, useRef } from "react";

type Node = {
  lat: number;
  lon: number;
  accent: string;
  pulse: number;
};

const ACCENTS = ["#d8ef51", "#4fb3a4", "#8fd0c4", "#ff9a74"];

/** Tanzania sits around -6.4 lat, 34.9 lon — cluster nodes near it. */
function makeNodes(count: number): Node[] {
  const nodes: Node[] = [
    { lat: -6.8, lon: 39.28, accent: "#d8ef51", pulse: 0 }, // Dar es Salaam
    { lat: -3.37, lon: 36.69, accent: "#4fb3a4", pulse: 0.3 }, // Arusha
    { lat: -2.52, lon: 32.9, accent: "#d8ef51", pulse: 0.6 }, // Mwanza
    { lat: -6.17, lon: 35.75, accent: "#8fd0c4", pulse: 0.9 }, // Dodoma
    { lat: -8.91, lon: 33.46, accent: "#ff9a74", pulse: 1.2 }, // Mbeya
    { lat: -5.07, lon: 39.1, accent: "#4fb3a4", pulse: 1.5 }, // Tanga
  ];

  for (let i = nodes.length; i < count; i++) {
    // Even-ish spread via golden angle, biased toward the visible hemisphere.
    const t = i / count;
    nodes.push({
      lat: Math.asin(2 * t - 1) * (180 / Math.PI),
      lon: (i * 137.508) % 360 - 180,
      accent: ACCENTS[i % ACCENTS.length],
      pulse: Math.random() * 3,
    });
  }
  return nodes;
}

export default function NetworkGlobe({ size = 460 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const nodes = makeNodes(58);
    const R = size * 0.36;
    const cx = size / 2;
    const cy = size / 2;

    let rot = 0;
    let raf = 0;
    let running = true;

    // Pause when off-screen so we are not burning battery on a phone.
    const io = new IntersectionObserver(
      ([e]) => {
        running = e.isIntersecting;
        if (running && !reduce) raf = requestAnimationFrame(draw);
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    function project(lat: number, lon: number) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + rot) * (Math.PI / 180);
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      return { x: cx + x * R, y: cy - y * R, z };
    }

    function draw(now: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);

      // Atmosphere
      const halo = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.55);
      halo.addColorStop(0, "rgba(216,239,81,0.14)");
      halo.addColorStop(0.55, "rgba(40,104,91,0.20)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // Sphere body
      const body = ctx.createRadialGradient(
        cx - R * 0.35,
        cy - R * 0.4,
        R * 0.1,
        cx,
        cy,
        R
      );
      body.addColorStop(0, "rgba(40,104,91,0.55)");
      body.addColorStop(1, "rgba(16,36,33,0.95)");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Meridians
      ctx.strokeStyle = "rgba(216,239,81,0.10)";
      ctx.lineWidth = 1;
      for (let m = 0; m < 180; m += 30) {
        ctx.beginPath();
        for (let lat = -90; lat <= 90; lat += 4) {
          const p = project(lat, m);
          if (p.z > -0.05) {
            const first = lat === -90;
            first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          }
        }
        ctx.stroke();
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 4) {
          const p = project(lat, lon);
          if (p.z > -0.05) {
            started ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      const pts = nodes.map((n) => ({ ...n, ...project(n.lat, n.lon) }));

      // Connections between nearby visible nodes
      for (let i = 0; i < pts.length; i++) {
        if (pts[i].z < 0) continue;
        for (let j = i + 1; j < pts.length; j++) {
          if (pts[j].z < 0) continue;
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d > R * 0.7) continue;
          const a = (1 - d / (R * 0.7)) * 0.62 * Math.min(pts[i].z + 0.35, 1);
          ctx.strokeStyle = `rgba(216,239,81,${a.toFixed(3)})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }

      // Nodes, painted back-to-front
      pts
        .slice()
        .sort((a, b) => a.z - b.z)
        .forEach((p) => {
          if (p.z < -0.2) return;
          const depth = (p.z + 1) / 2;
          const beat = 0.5 + 0.5 * Math.sin(now / 620 + p.pulse * 4);
          const r = (1.1 + depth * 2.2) * (0.85 + beat * 0.35);

          ctx.globalAlpha = 0.25 + depth * 0.75;
          ctx.fillStyle = p.accent;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();

          if (depth > 0.72) {
            ctx.globalAlpha = (depth - 0.72) * 0.9 * beat;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 3.4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        });

      rot += 0.13;
      if (running && !reduce) raf = requestAnimationFrame(draw);
    }

    if (reduce) draw(0);
    else raf = requestAnimationFrame(draw);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ width: size, height: size, display: "block" }}
    />
  );
}
