import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NebulaHeart from "./components/NebulaHeart";
import CodePanel from "./components/CodePanel";
import { PALETTES } from "./lib/heart";

const DUST_PRESETS: { label: string; value: number }[] = [
  { label: "wisp", value: 0.4 },
  { label: "soft", value: 0.7 },
  { label: "full", value: 1.0 },
  { label: "cosmic", value: 1.4 },
];

const LOVE_DROPS = Array.from({ length: 24 }, (_, index) => ({
  id: `love-${index}`,
  text: "love",
  left: `${Math.round(5 + (index * 3.7) % 90)}%`,
  duration: `${8 + (index % 5) * 1.2}s`,
  delay: `${(index * 0.7) % 10}s`,
  opacity: 0.16 + (index % 4) * 0.08,
  size: 10 + (index % 5) * 1.4,
  rotate: index % 2 === 0 ? "-12deg" : "8deg",
}));

export default function App() {
  const [bpm, setBpm] = useState(72);
  const [intensity, setIntensity] = useState(1.0);
  const [paletteId, setPaletteId] = useState(PALETTES[1].id);
  const [paused, setPaused] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [userName, setUserName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [beats, setBeats] = useState(0);

  const phaseRef = useRef(0);
  const pulseRef = useRef(0);

  const palette = useMemo(
    () => PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0],
    [paletteId],
  );

  const handleBeat = useCallback((n: number) => {
    setBeats(n);
  }, []);

  const handlePhase = useCallback((p: number) => {
    phaseRef.current = p;
  }, []);

  const kick = () => {
    pulseRef.current = 1;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        kick();
      }
      if (e.key.toLowerCase() === "p") setPaused((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#04030c]">
      {/* ---- canvas ---- */}
      <div className="fixed inset-0">
        <NebulaHeart
          bpm={bpm}
          palette={palette}
          intensity={intensity}
          paused={paused}
          onBeat={handleBeat}
          onPhase={handlePhase}
          pulseRef={pulseRef}
        />
      </div>

      {/* vignette */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(2,1,8,0.75)_100%)]" />

      {/* love rain */}
      <div className="pointer-events-none love-rain">
        {LOVE_DROPS.map((drop) => (
          <span
            key={drop.id}
            className="love-drop"
            style={{
              left: drop.left,
              animationDuration: drop.duration,
              animationDelay: drop.delay,
              opacity: drop.opacity,
              fontSize: `${drop.size}px`,
              transform: `translateX(0) rotate(${drop.rotate})`,
            }}
          >
            {drop.text}
          </span>
        ))}
        {userName &&
          Array.from({ length: 16 }, (_, index) => ({
            id: `name-${index}`,
            text: userName,
            left: `${Math.round(8 + (index * 5.1) % 84)}%`,
            duration: `${9 + (index % 4) * 1.1}s`,
            delay: `${(index * 0.9) % 11}s`,
            opacity: 0.18 + (index % 3) * 0.08,
            size: 12 + (index % 4) * 1.3,
            rotate: index % 2 === 0 ? "-10deg" : "10deg",
          })).map((drop) => (
            <span
              key={drop.id}
              className="love-drop"
              style={{
                left: drop.left,
                animationDuration: drop.duration,
                animationDelay: drop.delay,
                opacity: drop.opacity,
                fontSize: `${drop.size}px`,
                transform: `translateX(0) rotate(${drop.rotate})`,
              }}
            >
              {drop.text}
            </span>
          ))}
      </div>

      {/* ---- floating controls (no headings) ---- */}
      <header className="pointer-events-none relative z-10 flex items-start justify-end gap-6 p-5 sm:p-8">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setShowPanel((v) => !v)}
            className="font-mono-code rounded-full border border-white/12 bg-black/40 px-3.5 py-1.5 text-[11px] tracking-wider text-white/55 backdrop-blur-md transition hover:border-white/30 hover:text-white"
          >
            {showPanel ? "hide panel" : "show panel"}
          </button>
          <button
            onClick={() => setShowControls((v) => !v)}
            className="font-mono-code rounded-full border border-white/12 bg-black/40 px-3.5 py-1.5 text-[11px] tracking-wider text-white/55 backdrop-blur-md transition hover:border-white/30 hover:text-white"
          >
            {showControls ? "hide controls" : "show controls"}
          </button>
          <button
            onClick={() => setPaused((v) => !v)}
            className="font-mono-code rounded-full border border-white/12 bg-black/40 px-3.5 py-1.5 text-[11px] tracking-wider text-white/55 backdrop-blur-md transition hover:border-white/30 hover:text-white"
          >
            {paused ? "▶ resume" : "❚❚ pause"}
          </button>
        </div>
      </header>

      {/* ---- code panel ---- */}
      {showPanel && (
        <aside className="pointer-events-auto fixed top-24 right-5 z-10 hidden h-[min(60vh,520px)] w-[380px] lg:block xl:w-[430px]">
          <CodePanel beat={beats} />
        </aside>
      )}


      {/* ---- control dock ---- */}
      <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center p-4 sm:p-6">
        <div className={`pointer-events-auto flex w-full max-w-3xl flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border border-white/10 bg-black/45 px-5 py-4 backdrop-blur-md ${showControls ? "" : "hidden"}`}>
          <label className="flex min-w-[190px] flex-1 flex-col gap-1.5">
            <span className="font-mono-code flex justify-between text-[10px] tracking-[0.18em] text-white/40 uppercase">
              <span>heart rate</span>
              <span className="text-white/70 tabular-nums">{bpm} bpm</span>
            </span>
            <input
              type="range"
              min={38}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
          </label>

          <div className="flex min-w-[210px] flex-1 flex-col gap-1.5">
            <span className="font-mono-code text-[10px] tracking-[0.18em] text-white/40 uppercase">
              dust
            </span>
            <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {DUST_PRESETS.map((d) => {
                const on = Math.abs(intensity - d.value) < 0.001;
                return (
                  <button
                    key={d.label}
                    onClick={() => setIntensity(d.value)}
                    className={`font-mono-code flex-1 rounded-lg px-2 py-1.5 text-[10px] tracking-[0.12em] uppercase transition ${
                      on ? "text-black" : "text-white/45 hover:text-white/80"
                    }`}
                    style={
                      on
                        ? {
                            background: palette.accent,
                            boxShadow: `0 0 16px ${palette.accent}66`,
                          }
                        : undefined
                    }
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPaletteId(p.id)}
                  title={p.name}
                  className={`h-7 w-7 rounded-full border transition ${
                    p.id === paletteId
                      ? "scale-110 border-white/80"
                      : "border-white/15 hover:border-white/40"
                  }`}
                  style={{
                    background: `radial-gradient(circle at 32% 30%, ${p.colors[0]}, ${p.colors[2]} 55%, ${p.haze})`,
                    boxShadow: p.id === paletteId ? `0 0 16px ${p.accent}99` : undefined,
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNameInput((v) => !v)}
                className="font-mono-code rounded-full border border-white/12 bg-black/40 px-3 py-2 text-[11px] tracking-[0.2em] uppercase transition hover:border-white/30 hover:text-white"
              >
                {userName ? "edit name" : "enter name"}
              </button>
              {showNameInput && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const field = form.elements.namedItem("name") as HTMLInputElement | null;
                    if (field?.value.trim()) {
                      setUserName(field.value.trim());
                    }
                    setShowNameInput(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    name="name"
                    defaultValue={userName}
                    className="w-40 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-[11px] text-white outline-none"
                    placeholder="Your name"
                  />
                  <button
                    type="submit"
                    className="font-mono-code rounded-full border border-white/12 bg-black/40 px-3 py-2 text-[11px] tracking-[0.2em] uppercase transition hover:border-white/30 hover:text-white"
                  >
                    ok
                  </button>
                </form>
              )}
            </div>
          </div>

          <button
            onMouseDown={kick}
            onTouchStart={kick}
            className="font-mono-code rounded-xl border px-4 py-2 text-[11px] tracking-[0.2em] uppercase transition active:scale-95"
            style={{
              borderColor: `${palette.accent}66`,
              color: palette.accent,
              background: `${palette.accent}14`,
              boxShadow: `0 0 20px ${palette.accent}33`,
            }}
          >
            pulse
          </button>
        </div>
      </footer>

      {/* hint */}
      <div className="pointer-events-none fixed right-6 bottom-2 z-10 hidden text-[10px] tracking-[0.15em] text-white/25 uppercase sm:block">
        click the void · space = pulse · p = pause
      </div>
    </div>
  );
}
