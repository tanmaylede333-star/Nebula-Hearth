import { useEffect, useRef, type MutableRefObject } from "react";
import { ecg } from "../lib/heart";

type Props = {
  phaseRef: MutableRefObject<number>;
  color: string;
  paused: boolean;
};

export default function EcgStrip({ phaseRef, color, paused }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ color, paused });
  stateRef.current = { color, paused };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let dpr = 1;
    const N = 460;
    const buf = new Float32Array(N);
    let head = 0;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(120, Math.floor(rect.width * dpr));
      canvas.height = Math.max(40, Math.floor(rect.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const { color: col, paused: isPaused } = stateRef.current;
      if (!isPaused) {
        buf[head] = ecg(phaseRef.current);
        head = (head + 1) % N;
      }
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // grid
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 26 * dpr) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 18 * dpr) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // trace
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const idx = (head + i) % N;
        const x = (i / (N - 1)) * W;
        const y = H * 0.62 - buf[idx] * H * 0.44;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.6 * dpr;
      ctx.shadowBlur = 10 * dpr;
      ctx.shadowColor = col;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // head dot
      const lastY = H * 0.62 - buf[(head - 1 + N) % N] * H * 0.44;
      ctx.beginPath();
      ctx.arc(W - 1.5 * dpr, lastY, 2.4 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [phaseRef]);

  return <canvas ref={ref} className="h-full w-full" />;
}
