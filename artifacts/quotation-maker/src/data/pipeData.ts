export type PNRating = "6 PN" | "8 PN" | "10 PN" | "12.5 PN" | "16 PN" | "20 PN";

export interface PipeSpec {
  size: string;
  outsideDia: string;
  avgWeights: Partial<Record<PNRating, number>>;
}

export const PN_RATINGS: PNRating[] = ["6 PN", "8 PN", "10 PN", "12.5 PN", "16 PN", "20 PN"];

export const PIPE_DATA: PipeSpec[] = [
  {
    size: '1/2"',
    outsideDia: "16",
    avgWeights: {
      "6 PN": 0.066,
      "8 PN": 0.082,
      "10 PN": 0.111,
      "12.5 PN": 0.166,
      "16 PN": 0.197,
      "20 PN": 0.232,
    },
  },
  {
    size: '3/4"',
    outsideDia: "20",
    avgWeights: {
      "6 PN": 0.104,
      "8 PN": 0.128,
      "10 PN": 0.166,
      "12.5 PN": 0.269,
      "16 PN": 0.322,
      "20 PN": 0.382,
    },
  },
  {
    size: '1"',
    outsideDia: "25",
    avgWeights: {
      "6 PN": 0.141,
      "8 PN": 0.184,
      "10 PN": 0.225,
      "12.5 PN": 0.427,
      "16 PN": 0.503,
      "20 PN": 0.587,
    },
  },
  {
    size: '1 1/4"',
    outsideDia: "32",
    avgWeights: {
      "6 PN": 0.233,
      "8 PN": 0.287,
      "10 PN": 0.353,
      "12.5 PN": 0.662,
      "16 PN": 0.78,
      "20 PN": 0.924,
    },
  },
  {
    size: '1 1/2"',
    outsideDia: "40",
    avgWeights: {
      "6 PN": 0.363,
      "8 PN": 0.449,
      "10 PN": 0.545,
      "12.5 PN": 1.047,
      "16 PN": 1.224,
      "20 PN": 1.459,
    },
  },
  {
    size: '2"',
    outsideDia: "50",
    avgWeights: {
      "6 PN": 0.573,
      "8 PN": 0.699,
      "10 PN": 0.869,
      "12.5 PN": 1.48,
      "16 PN": 1.742,
      "20 PN": 2.069,
    },
  },
  {
    size: '2 1/2"',
    outsideDia: "63",
    avgWeights: {
      "6 PN": 0.821,
      "8 PN": 1.009,
      "10 PN": 1.231,
      "12.5 PN": 2.108,
      "16 PN": 2.495,
      "20 PN": 2.97,
    },
  },
  {
    size: '3"',
    outsideDia: "75",
    avgWeights: {
      "6 PN": 0.821,
      "8 PN": 1.165,
      "10 PN": 1.763,
      "12.5 PN": 3.142,
      "16 PN": 3.714,
      "20 PN": 4.435,
    },
  },
  {
    size: '4"',
    outsideDia: "90",
    avgWeights: {
      "6 PN": 1.437,
      "8 PN": 2.131,
      "10 PN": 2.598,
      "12.5 PN": 4.076,
      "16 PN": 4.811,
      "20 PN": 5.716,
    },
  },
  {
    size: '5"',
    outsideDia: "110",
    avgWeights: {
      "6 PN": 2.349,
      "8 PN": 2.738,
      "10 PN": 3.35,
      "12.5 PN": 5.115,
      "16 PN": 6.048,
      "20 PN": 7.189,
    },
  },
  {
    size: '6"',
    outsideDia: "125",
    avgWeights: {
      "6 PN": 2.826,
      "8 PN": 3.44,
      "10 PN": 4.197,
      "12.5 PN": 6.669,
      "16 PN": 6.048,
      "20 PN": 9.386,
    },
  },
  {
    size: '8"',
    outsideDia: "140",
    avgWeights: {
      "6 PN": 3.706,
      "8 PN": 4.513,
      "10 PN": 5.502,
      "12.5 PN": 6.669,
      "16 PN": 7.882,
      "20 PN": 9.386,
    },
  },
  {
    size: '10"',
    outsideDia: "160",
    avgWeights: {
      "6 PN": 4.599,
      "8 PN": 5.661,
      "10 PN": 6.892,
      "12.5 PN": 8.407,
      "16 PN": 9.957,
      "20 PN": 11.936,
    },
  },
  {
    size: '12"',
    outsideDia: '180 DN 6"',
    avgWeights: {
      "6 PN": 4.682,
      "8 PN": 5.77,
      "10 PN": 7.093,
      "12.5 PN": 10.37,
      "16 PN": 12.32,
      "20 PN": 14.64,
    },
  },
];

export function getAvgWeight(size: string, pn: PNRating): number | undefined {
  const spec = PIPE_DATA.find((p) => p.size === size);
  return spec?.avgWeights[pn];
}

export const PIPE_SIZES = PIPE_DATA.map((p) => p.size);
