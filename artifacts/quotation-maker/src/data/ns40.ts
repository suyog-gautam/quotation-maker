// NS 40:2079 – Polyethylene Pipes for Water Supply – Specification
// PE 100 requirement data used by the Test Report builder.
//   Table 3 (p.9)  – mean outside diameter dem Min / Max
//   Table 4 (p.10) – wall thickness eMin / eMax per SDR
//   Table 4 PE 100 row / Annex A (p.16) – PN → SDR
//   Clause 7.4.1.1 (p.8) – dimensions expressed to the nearest 0.1 mm
//   Clause 8.2 (p.11) – reversion ≤ 3 %;  8.3 – carbon black 2.5 ± 0.5 %

export interface NsSize {
  od: [number, number];
  wall: Record<string, [number, number]>; // key = SDR
}

export const NS40_TABLE: Record<number, NsSize> = {
  16: { od: [16.0, 16.3], wall: { "9": [1.8, 2.1], "7.4": [2.2, 2.5], "6": [2.7, 3.1] } },
  20: { od: [20.0, 20.3], wall: { "11": [1.9, 2.2], "9": [2.3, 2.6], "7.4": [2.7, 3.1], "6": [3.4, 3.8] } },
  25: { od: [25.0, 25.3], wall: { "13.6": [1.9, 2.2], "11": [2.3, 2.6], "9": [2.8, 3.2], "7.4": [3.4, 3.8], "6": [4.2, 4.7] } },
  32: { od: [32.0, 32.3], wall: { "17": [1.9, 2.2], "13.6": [2.4, 2.7], "11": [2.9, 3.3], "9": [3.6, 4.1], "7.4": [4.4, 4.9], "6": [5.4, 6.0] } },
  40: { od: [40.0, 40.4], wall: { "21": [1.9, 2.2], "17": [2.4, 2.7], "13.6": [3.0, 3.4], "11": [3.7, 4.2], "9": [4.5, 5.1], "7.4": [5.4, 6.0], "6": [6.7, 7.5] } },
  50: { od: [50.0, 50.4], wall: { "26": [2.0, 2.3], "21": [2.4, 2.7], "17": [3.0, 3.4], "13.6": [3.7, 4.2], "11": [4.6, 5.2], "9": [5.6, 6.3], "7.4": [6.8, 7.6], "6": [8.4, 9.3] } },
  63: { od: [63.0, 63.4], wall: { "26": [2.5, 2.9], "21": [3.0, 3.4], "17": [3.7, 4.2], "13.6": [4.7, 5.3], "11": [5.8, 6.5], "9": [7.0, 7.8], "7.4": [8.6, 9.6], "6": [10.5, 11.7] } },
  75: { od: [75.0, 75.5], wall: { "41": [1.9, 2.2], "33": [2.3, 2.6], "26": [2.9, 3.3], "21": [3.6, 4.1], "17": [4.5, 5.1], "13.6": [5.6, 6.3], "11": [6.9, 7.7], "9": [8.4, 9.3], "7.4": [10.2, 11.3], "6": [12.5, 13.9] } },
  90: { od: [90.0, 90.6], wall: { "41": [2.2, 2.5], "33": [2.8, 3.2], "26": [3.5, 4.0], "21": [4.3, 4.8], "17": [5.3, 5.9], "13.6": [6.7, 7.5], "11": [8.2, 9.1], "9": [10.0, 11.1], "7.4": [12.2, 13.5], "6": [15.0, 16.6] } },
  110: { od: [110.0, 110.7], wall: { "41": [2.7, 3.1], "33": [3.4, 3.8], "26": [4.3, 4.8], "21": [5.3, 6.0], "17": [6.5, 7.3], "13.6": [8.1, 9.0], "11": [10.0, 11.1], "9": [12.3, 13.6], "7.4": [14.9, 16.5], "6": [18.4, 20.3] } },
  125: { od: [125.0, 125.8], wall: { "41": [3.1, 3.5], "33": [3.8, 4.3], "26": [4.8, 5.4], "21": [6.0, 6.7], "17": [7.4, 8.2], "13.6": [9.2, 10.2], "11": [11.4, 12.7], "9": [13.9, 15.4], "7.4": [16.9, 18.7], "6": [20.9, 23.1] } },
  140: { od: [140.0, 140.9], wall: { "41": [3.5, 4.0], "33": [4.3, 4.8], "26": [5.4, 6.0], "21": [6.7, 7.5], "17": [8.3, 9.2], "13.6": [10.3, 11.4], "11": [12.8, 14.2], "9": [15.6, 17.3], "7.4": [19.0, 21.0], "6": [23.4, 25.8] } },
  160: { od: [160.0, 161.0], wall: { "41": [3.9, 4.4], "33": [4.9, 5.5], "26": [6.2, 6.9], "21": [7.7, 8.6], "17": [9.5, 10.6], "13.6": [11.8, 13.1], "11": [14.6, 16.2], "9": [17.8, 19.7], "7.4": [21.7, 24.0], "6": [26.7, 29.5] } },
  180: { od: [180.0, 181.1], wall: { "41": [4.4, 4.9], "33": [5.5, 6.2], "26": [7.0, 7.8], "21": [8.6, 9.6], "17": [10.6, 11.8], "13.6": [13.3, 14.7], "11": [16.4, 18.1], "9": [20.0, 22.1], "7.4": [24.4, 26.9], "6": [30.0, 33.1] } },
  200: { od: [200.0, 201.2], wall: { "41": [4.9, 5.5], "33": [6.1, 6.8], "26": [7.7, 8.6], "21": [9.6, 10.7], "17": [11.8, 13.1], "13.6": [14.7, 16.3], "11": [18.2, 20.1], "9": [22.3, 24.6], "7.4": [27.1, 29.9], "6": [33.4, 36.8] } },
  225: { od: [225.0, 226.4], wall: { "41": [5.5, 6.2], "33": [6.9, 7.7], "26": [8.7, 9.7], "21": [10.8, 12.0], "17": [13.3, 14.7], "13.6": [16.6, 18.4], "11": [20.5, 22.7], "9": [25.0, 27.6], "7.4": [30.5, 33.7], "6": [37.5, 41.4] } },
  250: { od: [250.0, 251.5], wall: { "41": [6.1, 6.8], "33": [7.6, 8.5], "26": [9.7, 10.8], "21": [12.0, 13.3], "17": [14.7, 16.3], "13.6": [18.4, 20.3], "11": [22.8, 25.2], "9": [27.8, 30.7], "7.4": [33.8, 37.3], "6": [41.7, 46.0] } },
  280: { od: [280.0, 281.7], wall: { "41": [6.9, 7.7], "33": [8.5, 9.5], "26": [10.8, 12.0], "21": [13.4, 14.8], "17": [16.5, 18.3], "13.6": [20.6, 22.8], "11": [25.5, 28.2], "9": [31.2, 34.4], "7.4": [37.9, 41.8], "6": [46.7, 51.5] } },
  315: { od: [315.0, 316.9], wall: { "41": [7.7, 8.6], "33": [9.6, 10.7], "26": [12.2, 13.5], "21": [15.0, 16.6], "17": [18.6, 20.6], "13.6": [23.2, 25.6], "11": [28.7, 31.7], "9": [35.0, 38.6], "7.4": [42.6, 47.0], "6": [52.5, 57.9] } },
  355: { od: [355.0, 357.2], wall: { "41": [8.7, 9.7], "33": [10.8, 12.0], "26": [13.7, 15.2], "21": [16.9, 18.7], "17": [20.9, 23.1], "13.6": [26.1, 28.8], "11": [32.3, 35.6], "9": [39.5, 43.6], "7.4": [48.0, 52.9], "6": [59.2, 65.2] } },
  400: { od: [400.0, 402.4], wall: { "41": [9.8, 10.9], "33": [12.2, 13.5], "26": [15.4, 17.0], "21": [19.1, 21.1], "17": [23.6, 26.1], "13.6": [29.5, 32.6], "11": [36.4, 40.1], "9": [44.5, 49.1], "7.4": [54.1, 59.6], "6": [66.7, 73.5] } },
  450: { od: [450.0, 452.7], wall: { "41": [11.0, 12.2], "33": [13.7, 15.2], "26": [17.3, 19.1], "21": [21.5, 23.8], "17": [26.5, 29.3], "13.6": [33.1, 36.5], "11": [40.9, 45.1], "9": [50.0, 55.1], "7.4": [60.9, 67.1], "6": [75.0, 82.6] } },
  500: { od: [500.0, 503.0], wall: { "41": [12.2, 13.5], "33": [15.2, 16.8], "26": [19.3, 21.3], "21": [23.9, 26.4], "17": [29.5, 32.6], "13.6": [36.8, 40.6], "11": [45.5, 50.2], "9": [55.6, 61.3], "7.4": [67.6, 74.5], "6": [83.4, 91.8] } },
  560: { od: [560.0, 563.4], wall: { "41": [13.7, 15.2], "33": [17.0, 18.8], "26": [21.6, 23.9], "21": [26.7, 29.5], "17": [33.0, 36.4], "13.6": [41.2, 45.4], "11": [50.9, 56.1], "9": [62.3, 68.6], "7.4": [75.7, 83.4], "6": [93.4, 102.8] } },
  630: { od: [630.0, 633.8], wall: { "41": [15.4, 17.0], "33": [19.1, 21.1], "26": [24.3, 26.8], "21": [30.0, 33.1], "17": [37.1, 40.9], "13.6": [46.4, 51.1], "11": [57.3, 63.1], "9": [70.0, 77.1], "7.4": [85.2, 93.8], "6": [105.0, 115.6] } },
};

/** PE 100 pressure rating (bar) → SDR, NS 40:2079 Table 4. */
export const PE100_PN_SDR: Record<string, number> = {
  "3": 41, "4": 33, "5": 26, "6": 21, "8": 17,
  "10": 13.6, "12.5": 11, "16": 9, "20": 7.4,
};

export const STANDARD = "NS 40:2079";

export function pnNumber(pn: string): number {
  return parseFloat(pn.replace(/[^\d.]/g, ""));
}

export function sdrFor(pn: string): number | undefined {
  return PE100_PN_SDR[String(pnNumber(pn))];
}

export function nsSize(dnMm: number): NsSize | undefined {
  return NS40_TABLE[dnMm];
}

/** PN ratings with an NS 40 PE 100 wall-thickness entry for this size. */
export function nsPNsForSize(dnMm: number): number[] {
  const size = nsSize(dnMm);
  if (!size) return [];
  return Object.entries(PE100_PN_SDR)
    .filter(([, sdr]) => size.wall[String(sdr)])
    .map(([pn]) => parseFloat(pn))
    .sort((a, b) => a - b);
}

export interface Requirements {
  sdr: number;
  od: [number, number];
  wall: [number, number];
  pn: number;
}

export function requirementsFor(dnMm: number, pn: number): Requirements | undefined {
  const size = nsSize(dnMm);
  const sdr = PE100_PN_SDR[String(pn)];
  if (!size || !sdr) return undefined;
  const wall = size.wall[String(sdr)];
  if (!wall) return undefined;
  return { sdr, od: size.od, wall, pn };
}

/** Round half-up to 0.1 mm as clause 7.4.1.1 requires. */
export function round01(x: number): number {
  return Math.round(x * 10 + 1e-9) / 10;
}

export type Status = "OK" | "Not OK" | "";

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export function rangeStatus(minS: string, maxS: string, lim: [number, number]): Status {
  const a = num(minS), b = num(maxS);
  if (a === null || b === null) return "";
  return round01(a) >= lim[0] && round01(b) <= lim[1] && a <= b ? "OK" : "Not OK";
}

export const LIMITS = {
  reversionMax: 3,          // %
  carbonBlack: [2.0, 3.0],  // %
  mfr: [0.4, 1.1],          // g/10 min
} as const;

export function reversionStatus(v: string): Status {
  const n = num(v); if (n === null) return "";
  return n <= LIMITS.reversionMax ? "OK" : "Not OK";
}
export function carbonBlackStatus(v: string): Status {
  const n = num(v); if (n === null) return "";
  return n >= LIMITS.carbonBlack[0] && n <= LIMITS.carbonBlack[1] ? "OK" : "Not OK";
}
export function mfrStatus(v: string): Status {
  const n = num(v); if (n === null) return "";
  return n >= LIMITS.mfr[0] && n <= LIMITS.mfr[1] ? "OK" : "Not OK";
}

export interface Observed {
  odMin: string; odMax: string;
  wallMin: string; wallMax: string;
  reversion: string;     // %
  carbonBlack: string;   // %
  dispersion: "Satisfactory" | "Not satisfactory" | "";
  mfr: string;           // g/10 min
  creep: "Did not burst during testing" | "Burst during testing" | "";
}

export const EMPTY_OBSERVED: Observed = {
  odMin: "", odMax: "", wallMin: "", wallMax: "",
  reversion: "", carbonBlack: "", dispersion: "", mfr: "", creep: "",
};

/** Illustrative values inside the NS limits – SAMPLE MODE ONLY. */
export function sampleObserved(req: Requirements): Observed {
  const r = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
  const [odLo, odHi] = req.od, odSpan = odHi - odLo;
  const [eLo, eHi] = req.wall, eSpan = eHi - eLo;
  const odA = odLo + odSpan * r(0.2, 0.35), odB = odLo + odSpan * r(0.5, 0.7);
  const eA = eLo + eSpan * r(0.15, 0.3), eB = eLo + eSpan * r(0.45, 0.65);
  return {
    odMin: odA.toFixed(2), odMax: odB.toFixed(2),
    wallMin: eA.toFixed(2), wallMax: eB.toFixed(2),
    reversion: r(0.2, 0.5).toFixed(3),
    carbonBlack: r(2.2, 2.6).toFixed(2),
    dispersion: "Satisfactory",
    mfr: r(0.45, 0.55).toFixed(3),
    creep: "Did not burst during testing",
  };
}

export interface ReportRow {
  sn: number;
  characteristic: string;
  required: string;
  observed: string;
  status: Status;
}

const mm = (a: number, b: number) => `${a.toFixed(2)}-${b.toFixed(2)} mm`;
const obsRange = (a: string, b: string) => (a && b ? `${a}-${b} mm` : "");

export function buildRows(req: Requirements, o: Observed): ReportRow[] {
  return [
    { sn: 1, characteristic: "Outside Diameter (DN)", required: mm(...req.od), observed: obsRange(o.odMin, o.odMax), status: rangeStatus(o.odMin, o.odMax, req.od) },
    { sn: 2, characteristic: "Wall thickness (mm)", required: mm(...req.wall), observed: obsRange(o.wallMin, o.wallMax), status: rangeStatus(o.wallMin, o.wallMax, req.wall) },
    { sn: 3, characteristic: "Reversion test at 110°C", required: "Maximum 3%", observed: o.reversion ? `${o.reversion}%` : "", status: reversionStatus(o.reversion) },
    { sn: 4, characteristic: "Carbon black content", required: "2.5±0.5%", observed: o.carbonBlack ? `${o.carbonBlack}%` : "", status: carbonBlackStatus(o.carbonBlack) },
    { sn: 5, characteristic: "Carbon black dispersion", required: "Should be satisfactory", observed: o.dispersion, status: o.dispersion ? (o.dispersion === "Satisfactory" ? "OK" : "Not OK") : "" },
    { sn: 6, characteristic: "Melt flow rate", required: "0.40-1.10gm/10 min", observed: o.mfr ? `${o.mfr} gm/10 min` : "", status: mfrStatus(o.mfr) },
    { sn: 7, characteristic: "Internal creep rupture test at 80°C (48 hrs)", required: `Should not burst ${req.pn} kgf/cm² pressure & at 80°C temperature during testing`, observed: o.creep, status: o.creep ? (o.creep === "Did not burst during testing" ? "OK" : "Not OK") : "" },
  ];
}
