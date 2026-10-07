import { NS40_TABLE, PE100_PN_SDR, pnNumber } from "./ns40";

export type PNRating =
"3 PN"
| "4 PN"
| "5 PN"
  | "6 PN"
  | "8 PN"
  | "10 PN"
  | "12.5 PN"
  | "16 PN"
  | "20 PN";

export interface PipeSpec {
  dnLabel: string;
  dnMm: number;
  outsideDia: string;
  avgWeights: Partial<Record<PNRating, number>>;
}

export const PN_RATINGS: PNRating[] = [
"3 PN",
 "4 PN",
"5 PN",
  "6 PN",
  "8 PN",
   "10 PN",
  "12.5 PN",
   "16 PN",
   "20 PN",
];

// Sizes up to 200 mm: existing average weights (kg/m), unchanged.
const BASE_PIPE_DATA: PipeSpec[] = [
  {
    dnLabel: "16mm",
    dnMm: 16,
    outsideDia: "16",
    avgWeights: {
      "16 PN": 0.082,
      "20 PN": 0.097,
    },
  },
  {
    dnLabel: "20mm",
    dnMm: 20,
    outsideDia: "20",
    avgWeights: {
      "12.5 PN": 0.111,
      "16 PN": 0.128,
      "20 PN": 0.149,
    },
  },
  {
    dnLabel: "25mm",
    dnMm: 25,
    outsideDia: "25",
    avgWeights: {
      "10 PN": 0.141,
      "12.5 PN": 0.166,
      "16 PN": 0.197,
      "20 PN": 0.232,
    },
  },
  {
    dnLabel: "32mm",
    dnMm: 32,
    outsideDia: "32",
    avgWeights: {
      "8 PN": 0.184,
      "10 PN": 0.225,
      "12.5 PN": 0.269,
      "16 PN": 0.322,
      "20 PN": 0.382,
    },
  },
  {
    dnLabel: "40mm",
    dnMm: 40,
    outsideDia: "40",
    avgWeights: {
      "6 PN": 0.233,
      "8 PN": 0.287,
      "10 PN": 0.353,
      "12.5 PN": 0.427,
      "16 PN": 0.503,
      "20 PN": 0.587,
    },
  },
  {
    dnLabel: "50mm",
    dnMm: 50,
    outsideDia: "50",
    avgWeights: {
      "5 PN": 0.308,
      "6 PN": 0.363,
      "8 PN": 0.449,
      "10 PN": 0.545,
      "12.5 PN": 0.662,
      "16 PN": 0.78,
      "20 PN": 0.924,
    },
  },
  {
    dnLabel: "63mm",
    dnMm: 63,
    outsideDia: "63",
    avgWeights: {
      "5 PN": 0.488,
      "6 PN": 0.573,
      "8 PN": 0.699,
      "10 PN": 0.869,
      "12.5 PN": 1.047,
      "16 PN": 1.224,
      "20 PN": 1.469,
    },
  },
  {
    dnLabel: "75mm",
    dnMm: 75,
    outsideDia: "75",
    avgWeights: {
      "3 PN": 0.448,
      "4 PN": 0.532,
      "5 PN": 0.668,
      "6 PN": 0.821,
      "8 PN": 1.009,
      "10 PN": 1.231,
      "12.5 PN": 1.48,
      "16 PN": 1.742,
      "20 PN": 2.069,
    },
  },
  {
    dnLabel: "90mm",
    dnMm: 90,
    outsideDia: "90",
    avgWeights: {
      "3 PN": 0.617,
      "4 PN": 0.782,
      "5 PN": 0.969,
      "6 PN": 1.165,
      "8 PN": 1.416,
      "10 PN": 1.763,
      "12.5 PN": 2.108,
      "16 PN": 2.495,
      "20 PN": 2.97,
    },
  },
  {
    dnLabel: "110mm",
    dnMm: 110,
    outsideDia: "110",
    avgWeights: {
      "3 PN": 0.93,
      "4 PN": 1.147,
      "5 PN": 1.437,
      "6 PN": 1.766,
      "8 PN": 2.131,
      "10 PN": 2.598,
      "12.5 PN": 3.142,
      "16 PN": 3.74,
      "20 PN": 4.435,
    },
  },
  {
    dnLabel: "125mm",
    dnMm: 125,
    outsideDia: "125",
    avgWeights: {
      "3 PN": 1.203,
      "4 PN": 1.467,
      "5 PN": 1.831,
      "6 PN": 2.257,
      "8 PN": 2.738,
      "10 PN": 3.35,
      "12.5 PN": 4.076,
      "16 PN": 4.811,
      "20 PN": 5.716,
    },
  },
  {
    dnLabel: "140mm",
    dnMm: 140,
    outsideDia: "140",
    avgWeights: {
      "3 PN": 1.53,
      "4 PN": 1.846,
      "5 PN": 2.293,
      "6 PN": 2.826,
      "8 PN": 3.44,
      "10 PN": 4.197,
      "12.5 PN": 5.115,
      "16 PN": 6.048,
      "20 PN": 7.189,
    },
  },
  {
    dnLabel: "160mm",
    dnMm: 160,
    outsideDia: "160",
    avgWeights: {
      "3 PN": 1.937,
      "4 PN": 2.411,
      "5 PN": 3.01,
      "6 PN": 3.706,
      "8 PN": 4.513,
      "10 PN": 5.502,
      "12.5 PN": 6.669,
      "16 PN": 7.882,
      "20 PN": 9.386,
    },
  },
  {
    dnLabel: "180mm",
    dnMm: 180,
    outsideDia: "180",
    avgWeights: {
      "3 PN": 2.442,
      "4 PN": 3.051,
      "5 PN": 3.825,
      "6 PN": 4.657,
      "8 PN": 5.661,
      "10 PN": 6.96,
      "12.5 PN": 8.407,
      "16 PN": 9.957,
      "20 PN": 11.86,
    },
  },
  {
    dnLabel: "200mm",
    dnMm: 200,
    outsideDia: "200",
    avgWeights: {
      "3 PN": 3.033,
      "4 PN": 3.738,
      "5 PN": 4.682,
      "6 PN": 5.77,
      "8 PN": 6.992,
      "10 PN": 8.563,
      "12.5 PN": 10.37,
      "16 PN": 12.32,
      "20 PN": 14.64,
    },
  },
];


// ─── Sizes above 200 mm (225–400 mm) ──────────────────────────────────────────
// Average weight = (min weight + max weight) / 2, from NS 40:2079 dimensions:
//   min weight = π × (dem,min − eMin) × eMin × ρ / 1000   (kg/m)
//   max weight = π × (dem,max − eMax) × eMax × ρ / 1000   (kg/m)
// dem = mean outside diameter (Table 3), e = wall thickness for the PN's SDR (Table 4).
// ρ = 0.95 g/cm³ reproduces the existing ≤200 mm table to within ~0.1 % on average.

const PE_DENSITY = 0.95; // g/cm³

function pipeWeightKgPerM(od: number, wall: number): number {
  return (Math.PI * (od - wall) * wall * PE_DENSITY) / 1000;
}

function nsAverageWeight(dnMm: number, pn: PNRating): number | undefined {
  const size = NS40_TABLE[dnMm];
  const sdr = PE100_PN_SDR[String(pnNumber(pn))];
  const wall = size && sdr ? size.wall[String(sdr)] : undefined;
  if (!size || !wall) return undefined;
  const minWt = pipeWeightKgPerM(size.od[0], wall[0]);
  const maxWt = pipeWeightKgPerM(size.od[1], wall[1]);
  return Math.round(((minWt + maxWt) / 2) * 1000) / 1000;
}

const ALL_PNS: PNRating[] = ["3 PN", "4 PN", "5 PN", "6 PN", "8 PN", "10 PN", "12.5 PN", "16 PN", "20 PN"];
const LARGE_SIZES_MM = [225, 250, 280, 315, 355, 400];

const LARGE_PIPE_DATA: PipeSpec[] = LARGE_SIZES_MM.map((dn) => {
  const avgWeights: Partial<Record<PNRating, number>> = {};
  for (const pn of ALL_PNS) {
    const w = nsAverageWeight(dn, pn);
    if (w !== undefined) avgWeights[pn] = w;
  }
  return { dnLabel: `${dn}mm`, dnMm: dn, outsideDia: String(dn), avgWeights };
});

export const PIPE_DATA: PipeSpec[] = [...BASE_PIPE_DATA, ...LARGE_PIPE_DATA];

export function getAvgWeight(
  dnLabel: string,
  pn: PNRating,
): number | undefined {
  const spec = PIPE_DATA.find((p) => p.dnLabel === dnLabel);
  return spec?.avgWeights[pn];
}

export function getAvailablePNs(dnLabel: string): PNRating[] {
  const spec = PIPE_DATA.find((p) => p.dnLabel === dnLabel);
  if (!spec) return [];
  return PN_RATINGS.filter((pn) => spec.avgWeights[pn] !== undefined);
}

export const PIPE_SIZES = PIPE_DATA.map((p) => p.dnLabel);
