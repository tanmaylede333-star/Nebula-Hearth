export type Palette = {
  id: string;
  name: string;
  /** particle colours, hottest first */
  colors: string[];
  /** core glow colour */
  core: string;
  /** outer nebula haze */
  haze: string;
  accent: string;
};

export const PALETTES: Palette[] = [
  {
    id: "python",
    name: "python.core",
    colors: ["#ffd43b", "#ffe98a", "#4b8bbe", "#7fc4ff", "#306998", "#fff6d2"],
    core: "#ffd43b",
    haze: "#2b6cb0",
    accent: "#ffd43b",
  },
  {
    id: "nebula",
    name: "deep.nebula",
    colors: ["#ff5aa0", "#ff9ad5", "#8a6cff", "#4dd7ff", "#ffd4f0", "#c56bff"],
    core: "#ff6bb5",
    haze: "#7a3cff",
    accent: "#ff7ec1",
  },
  {
    id: "ember",
    name: "ember.pulse",
    colors: ["#ff3d2e", "#ff8b3d", "#ffd06b", "#ff5f8f", "#fff0c2", "#ff6a00"],
    core: "#ff7a2f",
    haze: "#a01f3c",
    accent: "#ff9d4d",
  },
  {
    id: "cryo",
    name: "cryo.bloom",
    colors: ["#7ef9ff", "#4de1c1", "#59a5ff", "#bdf5ff", "#2f7bff", "#e8fbff"],
    core: "#7ef9ff",
    haze: "#1d5fd6",
    accent: "#7ef9ff",
  },
];

/** classic parametric heart, normalised roughly into [-1, 1] */
export function heartPoint(t: number): [number, number] {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y =
    13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return [x / 17, -y / 17];
}

function gauss(x: number, mu: number, sigma: number) {
  const d = (x - mu) / sigma;
  return Math.exp(-0.5 * d * d);
}

/**
 * Cardiac envelope: "lub-dub". phase in [0,1).
 * Returns roughly 0..1 contraction strength.
 */
export function beatEnvelope(phase: number): number {
  const systole = gauss(phase, 0.06, 0.042) * 1.0;
  const dub = gauss(phase, 0.3, 0.055) * 0.55;
  const shimmer = gauss(phase, 0.62, 0.16) * 0.08;
  return Math.min(1.4, systole + dub + shimmer);
}

/** stylised ECG trace for the monitor strip, phase in [0,1) -> -1..1 */
export function ecg(phase: number): number {
  const p = phase;
  let v = 0;
  v -= gauss(p, 0.045, 0.012) * 0.22; // Q
  v += gauss(p, 0.07, 0.011) * 1.0; // R
  v -= gauss(p, 0.098, 0.016) * 0.35; // S
  v += gauss(p, 0.012, 0.022) * 0.16; // P
  v += gauss(p, 0.24, 0.05) * 0.3; // T
  return v;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
