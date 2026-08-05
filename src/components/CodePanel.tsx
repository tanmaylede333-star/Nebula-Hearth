import { useEffect, useMemo, useRef } from "react";

const SOURCE = `import numpy as np
from stardust import Nebula, Pulse

TAU = 2 * np.pi

class NebulaHeart(Nebula):
    """A heart drawn in interstellar dust."""

    def __init__(self, bpm=72, dust=3400):
        super().__init__(particles=dust)
        self.bpm = bpm
        self.t = np.random.uniform(0, TAU, dust)
        self.r = np.random.power(0.42, dust)

    def shape(self, t):
        x = 16 * np.sin(t) ** 3
        y = (13 * np.cos(t) - 5 * np.cos(2 * t)
             - 2 * np.cos(3 * t) - np.cos(4 * t))
        return np.stack([x, -y]) / 17

    def systole(self, phase):
        lub = Pulse.gaussian(phase, mu=0.06, sigma=0.042)
        dub = Pulse.gaussian(phase, mu=0.30, sigma=0.055)
        return lub + 0.55 * dub

    def beat(self, dt):
        self.phase = (self.phase + dt * self.bpm / 60) % 1
        love = self.systole(self.phase)
        self.scale = 1 + 0.115 * love
        self.emit(self.shape(self.t) * self.r * self.scale)
        return love

if __name__ == "__main__":
    heart = NebulaHeart(bpm=72)
    while heart.alive:
        heart.beat(dt=1 / 60)  # forever, in stardust`;

const KEYWORDS = new Set([
  "import",
  "from",
  "class",
  "def",
  "return",
  "while",
  "for",
  "in",
  "if",
  "else",
  "elif",
  "None",
  "True",
  "False",
  "and",
  "or",
  "not",
  "with",
  "as",
  "lambda",
  "yield",
  "super",
  "self",
  "__name__",
  "__main__",
  "__init__",
]);

type Tok = { text: string; cls: string };

function tokenize(line: string): Tok[] {
  const out: Tok[] = [];
  const re =
    /(#.*$)|("""[\s\S]*?"""|'[^']*'|"[^"]*")|([A-Za-z_]\w*)|(\d+\.?\d*)|(\s+)|([^\sA-Za-z_0-9]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1]) out.push({ text: m[1], cls: "text-slate-500 italic" });
    else if (m[2]) out.push({ text: m[2], cls: "text-emerald-300/80" });
    else if (m[3]) {
      const w = m[3];
      if (KEYWORDS.has(w)) out.push({ text: w, cls: "text-[#ff7ec1] font-medium" });
      else if (line[re.lastIndex] === "(")
        out.push({ text: w, cls: "text-[#7fc4ff]" });
      else if (/^[A-Z]/.test(w)) out.push({ text: w, cls: "text-[#ffd43b]" });
      else out.push({ text: w, cls: "text-slate-200/90" });
    } else if (m[4]) out.push({ text: m[4], cls: "text-orange-300/90" });
    else if (m[5]) out.push({ text: m[5], cls: "" });
    else out.push({ text: m[6], cls: "text-slate-400" });
  }
  return out;
}

/** lines that "run" on each beat */
const HOT_LINES = [30, 31, 32, 33, 34, 35];

export default function CodePanel({ beat }: { beat: number }) {
  const lines = useMemo(() => SOURCE.split("\n"), []);
  const tokens = useMemo(() => lines.map(tokenize), [lines]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const active = HOT_LINES[beat % HOT_LINES.length];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(`[data-line="${active}"]`);
    if (target)
      el.scrollTo({
        top: Math.max(0, target.offsetTop - el.clientHeight * 0.62),
        behavior: "smooth",
      });
  }, [active]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="font-mono-code ml-2 text-[11px] tracking-wide text-white/45">
          nebula_heart.py
        </span>
        <span className="ml-auto font-mono-code text-[10px] uppercase tracking-[0.18em] text-[#ffd43b]/70">
          running
        </span>
      </div>
      <div
        ref={scrollRef}
        className="scroll-thin font-mono-code flex-1 overflow-y-auto px-2 py-3 text-[11.5px] leading-[1.65]"
      >
        {tokens.map((toks, i) => {
          const isActive = i === active;
          return (
            <div
              key={i}
              data-line={i}
              className={`flex gap-3 rounded px-2 transition-colors duration-200 ${
                isActive ? "bg-[#ffd43b]/10" : ""
              }`}
            >
              <span
                className={`w-6 shrink-0 text-right tabular-nums ${
                  isActive ? "text-[#ffd43b]" : "text-white/20"
                }`}
              >
                {i + 1}
              </span>
              <span className="whitespace-pre">
                {toks.map((t, j) => (
                  <span key={j} className={t.cls}>
                    {t.text}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
