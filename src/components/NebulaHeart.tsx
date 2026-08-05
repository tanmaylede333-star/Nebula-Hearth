import { useEffect, useRef, type MutableRefObject } from "react";
import { beatEnvelope, heartPoint, type Palette } from "../lib/heart";

type Props = {
  bpm: number;
  palette: Palette;
  intensity: number; // 0.4 .. 1.6
  paused: boolean;
  onBeat?: (count: number) => void;
  onPhase?: (phase: number) => void;
  pulseRef?: MutableRefObject<number>;
};

type Particle = {
  t: number; // heart parameter
  r: number; // radial factor (0..1.5)
  size: number;
  ci: number; // colour index
  spin: number;
  ph: number;
  fr: number;
  amp: number;
  alpha: number;
  halo: number; // 0 = body, 1 = outer wisp
};

const LUT_N = 1024;
const LUT: Float32Array = (() => {
  const a = new Float32Array(LUT_N * 2);
  for (let i = 0; i < LUT_N; i++) {
    const [x, y] = heartPoint((i / LUT_N) * Math.PI * 2);
    a[i * 2] = x;
    a[i * 2 + 1] = y;
  }
  return a;
})();

function lutAt(t: number, out: { x: number; y: number }) {
  const f = (t / (Math.PI * 2)) * LUT_N;
  const i = ((Math.floor(f) % LUT_N) + LUT_N) % LUT_N;
  const j = (i + 1) % LUT_N;
  const k = f - Math.floor(f);
  out.x = LUT[i * 2] * (1 - k) + LUT[j * 2] * k;
  out.y = LUT[i * 2 + 1] * (1 - k) + LUT[j * 2 + 1] * k;
}

function makeSprite(color: string, size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, color);
  grd.addColorStop(0.25, color);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.globalAlpha = 1;
  g.fillStyle = grd;
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  g.fill();
  return c;
}

export default function NebulaHeart({
  bpm,
  palette,
  intensity,
  paused,
  onBeat,
  onPhase,
  pulseRef: externalPulse,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({ bpm, palette, intensity, paused, onBeat, onPhase });
  propsRef.current = { bpm, palette, intensity, paused, onBeat, onPhase };

  const localPulse = useRef(0);
  const pulseRef = externalPulse ?? localPulse;
  const pointerRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    let sprites: HTMLCanvasElement[] = propsRef.current.palette.colors.map((c) =>
      makeSprite(c),
    );
    let spriteKey = propsRef.current.palette.id;

    // ---- particles -------------------------------------------------------
    const MAX = 3400;
    const particles: Particle[] = [];
    for (let i = 0; i < MAX; i++) {
      const halo = Math.random() < 0.22 ? 1 : 0;
      const rBase = halo
        ? 1.0 + Math.random() * 0.55
        : 0.12 + Math.pow(Math.random(), 0.42) * 0.92;
      particles.push({
        t: Math.random() * Math.PI * 2,
        r: rBase,
        size: (halo ? 6 + Math.random() * 16 : 2.2 + Math.random() * 9) * (0.6 + rBase * 0.5),
        ci: Math.floor(Math.random() * 6),
        spin: (Math.random() - 0.5) * 0.16,
        ph: Math.random() * Math.PI * 2,
        fr: 0.4 + Math.random() * 2.2,
        amp: halo ? 0.05 + Math.random() * 0.09 : 0.012 + Math.random() * 0.035,
        alpha: halo ? 0.1 + Math.random() * 0.16 : 0.22 + Math.random() * 0.6,
        halo,
      });
    }

    // ---- stars -----------------------------------------------------------
    let starLayer = document.createElement("canvas");
    const buildStars = () => {
      starLayer = document.createElement("canvas");
      starLayer.width = canvas.width;
      starLayer.height = canvas.height;
      const g = starLayer.getContext("2d");
      if (!g) return;
      const n = Math.round(((canvas.width * canvas.height) / (1400 * 900)) * 420);
      for (let i = 0; i < n; i++) {
        const x = Math.random() * starLayer.width;
        const y = Math.random() * starLayer.height;
        const r = Math.random() * 1.25 * dpr + 0.25 * dpr;
        const a = 0.15 + Math.random() * 0.65;
        g.globalAlpha = a;
        g.fillStyle = Math.random() < 0.12 ? "#ffd9a8" : Math.random() < 0.25 ? "#a8ccff" : "#ffffff";
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
    };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      w = Math.max(320, rect.width);
      h = Math.max(320, rect.height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#04030c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      buildStars();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ---- interaction -----------------------------------------------------
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerRef.current.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onDown = () => {
      pulseRef.current = 1;
    };
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onDown);

    // ---- loop ------------------------------------------------------------
    let last = performance.now();
    let phase = 0;
    let beats = 0;
    let time = 0;
    const rings: { life: number }[] = [];
    const pt = { x: 0, y: 0 };

    const drawHeartPath = (
      cx: number,
      cy: number,
      R: number,
      scale: number,
      step = 8,
    ) => {
      ctx.beginPath();
      for (let i = 0; i <= LUT_N; i += step) {
        const idx = i % LUT_N;
        const x = cx + LUT[idx * 2] * R * scale;
        const y = cy + LUT[idx * 2 + 1] * R * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const p = propsRef.current;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.06) dt = 0.06;

      if (p.palette.id !== spriteKey) {
        sprites = p.palette.colors.map((c) => makeSprite(c));
        spriteKey = p.palette.id;
      }

      const speed = p.paused ? 0 : 1;
      time += dt * speed;
      const prevPhase = phase;
      phase += dt * speed * (p.bpm / 60);
      if (Math.floor(phase) > Math.floor(prevPhase)) {
        beats++;
        rings.push({ life: 0 });
        p.onBeat?.(beats);
      }
      const ph = phase % 1;
      p.onPhase?.(ph);

      pulseRef.current *= Math.exp(-dt * 3.2);
      const beat = Math.min(1.5, beatEnvelope(ph) + pulseRef.current * 1.1);

      // pointer easing (parallax)
      pointerRef.current.x += (pointerRef.current.tx - pointerRef.current.x) * Math.min(1, dt * 3);
      pointerRef.current.y += (pointerRef.current.ty - pointerRef.current.y) * Math.min(1, dt * 3);

      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2 + pointerRef.current.x * 24 * dpr;
      const cy = H / 2 + pointerRef.current.y * 18 * dpr + H * 0.01;
      const R = Math.min(W, H) * 0.33;

      // fade previous frame -> nebula smear
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(4,3,12,0.20)";
      ctx.fillRect(0, 0, W, H);

      // stars
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.1 + 0.05 * Math.sin(time * 0.7);
      ctx.drawImage(starLayer, 0, 0);

      // deep haze clouds
      const hazeCount = 3;
      for (let i = 0; i < hazeCount; i++) {
        const a = time * (0.05 + i * 0.03) + (i * Math.PI * 2) / hazeCount;
        const hx = cx + Math.cos(a) * R * 0.55;
        const hy = cy + Math.sin(a * 1.3) * R * 0.4;
        const rad = R * (1.15 + 0.25 * Math.sin(time * 0.4 + i));
        const grd = ctx.createRadialGradient(hx, hy, 0, hx, hy, rad);
        grd.addColorStop(0, p.palette.haze);
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 0.045 + 0.03 * beat;
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
      }

      // core glow
      const coreR = R * (0.75 + 0.16 * beat);
      const core = ctx.createRadialGradient(cx, cy - R * 0.05, 0, cx, cy - R * 0.05, coreR);
      core.addColorStop(0, p.palette.core);
      core.addColorStop(0.45, p.palette.haze);
      core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = 0.07 + 0.13 * beat;
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, W, H);

      // particles
      const count = Math.min(MAX, Math.round(MAX * Math.min(1, p.intensity / 1.2)));
      const scale = 1 + 0.115 * beat;
      for (let i = 0; i < count; i++) {
        const q = particles[i];
        q.t += q.spin * dt * speed;
        const wob = Math.sin(time * q.fr + q.ph) * q.amp;
        const push = q.halo ? beat * 0.22 * (0.5 + q.r * 0.5) : beat * 0.05;
        const rEff = q.r + wob + push;
        lutAt(q.t, pt);
        const x = cx + pt.x * R * scale * rEff;
        const y = cy + pt.y * R * scale * rEff;
        const twinkle = 0.55 + 0.45 * Math.sin(time * (q.fr * 1.7) + q.ph * 2.1);
        let a = q.alpha * twinkle * (0.65 + 0.55 * beat) * (0.7 + 0.5 * p.intensity * 0.5);
        if (a <= 0.004) continue;
        if (a > 1) a = 1;
        const s = q.size * dpr * (1 + 0.4 * beat) * (q.halo ? 1.2 : 1);
        ctx.globalAlpha = a;
        ctx.drawImage(sprites[q.ci % sprites.length], x - s / 2, y - s / 2, s, s);
      }

      // shock rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.life += dt * 1.5;
        if (ring.life >= 1) {
          rings.splice(i, 1);
          continue;
        }
        const e = 1 - Math.pow(1 - ring.life, 2);
        ctx.globalAlpha = (1 - ring.life) * 0.22;
        ctx.strokeStyle = p.palette.accent;
        ctx.lineWidth = Math.max(1, (1 - ring.life) * 2.4 * dpr);
        drawHeartPath(cx, cy, R, 1 + e * 0.75, 6);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full cursor-crosshair touch-none select-none"
    />
  );
}
