"use client";
// The hero's snowfall (owner, 2026-11-06: "it's Christmas themed, so make it snowing"), drawn on one canvas behind the
// hero's copy: soft round flakes, a few six-armed crystals and gold glints that twinkle, in three depths, drifting on a
// slow wind, parting gently around the pointer. Decoration only (aria-hidden, no taps). It runs only in the holiday
// window (`html[data-season="christmas"]`, lib/season.ts) with motion on (`html[data-motion]`, lib/motion.ts), starts
// when the browser is idle, stops while the hero is off screen or the tab is hidden, and costs no layout: the canvas is
// absolutely positioned and the server HTML has only an empty <canvas>. Without it the CSS snow in globals.css shows.
import { useEffect, useRef } from "react";

type Flake = { x: number; y: number; r: number; z: number; vy: number; ph: number; sp: number; kind: 0 | 1 | 2; rot: number; vr: number; c: number };

function rgbVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? v.split(/\s+/).join(",") : fallback;
}

/** One pre-drawn sprite per colour and kind, so each frame is only drawImage calls. */
function sprite(kind: 0 | 1 | 2, rgb: string, px: number) {
  const s = Math.ceil(px * 2 + 4);
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const m = s / 2;
  if (kind === 0) {
    const grad = g.createRadialGradient(m, m, 0, m, m, px);
    grad.addColorStop(0, `rgba(${rgb},1)`);
    grad.addColorStop(0.45, `rgba(${rgb},0.85)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(m, m, px, 0, Math.PI * 2);
    g.fill();
  } else if (kind === 1) {
    g.strokeStyle = `rgba(${rgb},0.95)`;
    g.lineCap = "round";
    g.lineWidth = Math.max(1, px / 7);
    g.translate(m, m);
    for (let i = 0; i < 6; i++) {
      g.rotate(Math.PI / 3);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(0, -px * 0.9);
      g.moveTo(0, -px * 0.5);
      g.lineTo(px * 0.22, -px * 0.7);
      g.moveTo(0, -px * 0.5);
      g.lineTo(-px * 0.22, -px * 0.7);
      g.stroke();
    }
  } else {
    // A four-point glint.
    g.fillStyle = `rgba(${rgb},1)`;
    g.translate(m, m);
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const rr = i % 2 ? px * 0.22 : px;
      g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
  }
  return c;
}

export function HeroSnow({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const html = document.documentElement;
    if (!canvas || html.dataset.season !== "christmas" || !html.hasAttribute("data-motion")) return;
    const host = canvas.parentElement as HTMLElement;
    const ctx = canvas.getContext("2d");
    if (!ctx || !host) return;

    let W = 0, H = 0, raf = 0, last = 0, visible = true, running = false, alive = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const phone = window.matchMedia("(max-width: 640px)").matches;
    let flakes: Flake[] = [];
    let sprites: HTMLCanvasElement[][] = [];
    const pointer = { x: -9999, y: -9999 };
    let wind = 0, gust = 0, scrollKick = 0, lastScroll = window.scrollY;

    const paint = () => {
      const night = html.dataset.theme === "night";
      const accent = rgbVar("--accent", "222,72,126");
      const gold = rgbVar("--gold", "176,132,52");
      // [colour per flake index c]: 0 snow (--snow: the site's own pale tint by day, white at night), 1 accent, 2 gold.
      const snow = night ? "255,255,255" : rgbVar("--snow", "214,186,204");
      const cols = [snow, accent, gold];
      sprites = cols.map((rgb) => [sprite(0, rgb, 8 * dpr), sprite(1, rgb, 9 * dpr), sprite(2, rgb, 7 * dpr)]);
    };

    const make = (fresh: boolean): Flake => {
      const z = Math.random(); // 0 far … 1 near
      const kindRoll = Math.random();
      const kind: 0 | 1 | 2 = kindRoll < 0.72 ? 0 : kindRoll < 0.9 ? 1 : 2;
      const c = kind === 2 ? 2 : Math.random() < 0.65 ? 0 : Math.random() < 0.5 ? 1 : 2;
      return {
        x: Math.random() * W,
        y: fresh ? Math.random() * H : -20 - Math.random() * 40,
        r: (kind === 0 ? 1.8 + z * 3.4 : 4 + z * 4.5) * (phone ? 0.9 : 1),
        z,
        vy: 12 + z * 30 + Math.random() * 8,
        ph: Math.random() * Math.PI * 2,
        sp: 0.4 + Math.random() * 0.9,
        kind,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.6,
        c,
      };
    };

    const size = () => {
      const r = host.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      const want = Math.min(phone ? 60 : 140, Math.round((W * H) / (phone ? 5200 : 5500)));
      while (flakes.length < want) flakes.push(make(true));
      flakes.length = want;
    };

    const frame = (t: number) => {
      if (!alive) return;
      raf = 0;
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
      last = t;
      gust += (Math.sin(t / 5200) * 0.6 + Math.sin(t / 1900) * 0.25 - gust) * 0.02;
      wind = gust * 18;
      scrollKick *= 0.92;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const f of flakes) {
        f.ph += f.sp * dt;
        f.y += (f.vy - scrollKick * (0.4 + f.z)) * dt;
        f.x += (Math.sin(f.ph) * (6 + f.z * 10) + wind * (0.5 + f.z)) * dt;
        // Part around the pointer, nearer flakes more.
        const dx = f.x - pointer.x, dy = f.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 9000) {
          const k = (1 - d2 / 9000) * (40 + f.z * 60) * dt;
          const d = Math.sqrt(d2) || 1;
          f.x += (dx / d) * k;
          f.y += (dy / d) * k * 0.5;
        }
        f.rot += f.vr * dt;
        if (f.y > H + 20) Object.assign(f, make(false));
        if (f.x > W + 20) f.x = -20;
        else if (f.x < -20) f.x = W + 20;
        const img = sprites[f.c][f.kind];
        const s = (f.r * 2 * dpr) / (f.kind === 0 ? 1 : 1.15);
        let a = 0.45 + f.z * 0.5;
        if (f.kind === 2) a *= 0.55 + 0.45 * Math.sin(f.ph * 3);
        ctx.globalAlpha = Math.max(0, a);
        if (f.kind === 1) {
          ctx.setTransform(1, 0, 0, 1, f.x * dpr, f.y * dpr);
          ctx.rotate(f.rot);
          ctx.drawImage(img, -s / 2, -s / 2, s, s);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        } else {
          ctx.drawImage(img, f.x * dpr - s / 2, f.y * dpr - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onLeave = () => {
      pointer.x = pointer.y = -9999;
    };
    const onScroll = () => {
      const y = window.scrollY;
      scrollKick = Math.max(-120, Math.min(120, scrollKick + (y - lastScroll) * 0.8));
      lastScroll = y;
    };
    const onVis = () => (document.hidden ? stop() : start());
    const ro = new ResizeObserver(() => size());
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    // Repaint the sprites when the visitor switches day/night.
    const mo = new MutationObserver(() => paint());

    const boot = () => {
      if (!alive) return;
      paint();
      size();
      ro.observe(host);
      io.observe(host);
      mo.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
      host.addEventListener("pointermove", onMove, { passive: true });
      host.addEventListener("pointerleave", onLeave, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVis);
      // The CSS snow underneath steps aside once the canvas is drawing.
      html.setAttribute("data-snow-live", "");
      canvas.style.opacity = "1";
      start();
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const idle = w.requestIdleCallback ? w.requestIdleCallback(boot, { timeout: 1500 }) : window.setTimeout(boot, 400);

    return () => {
      alive = false;
      stop();
      if (w.cancelIdleCallback) w.cancelIdleCallback(idle as number);
      else clearTimeout(idle as number);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      html.removeAttribute("data-snow-live");
    };
  }, []);
  return <canvas ref={ref} aria-hidden="true" className={`mo-bg mo-snow ${className}`} />;
}
