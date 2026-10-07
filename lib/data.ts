import type { LossTriangle } from './types';

// Evaluation date: 12/31/2024
// Development months: 12, 24, 36, 48, 60, 72, 84, 96
// Accident years: 2017–2024
// null = data not yet available (below the diagonal)

export const DEVELOPMENT_MONTHS = [12, 24, 36, 48, 60, 72, 84, 96];
export const ACCIDENT_YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
export const EVAL_DATE = '12/31/2024';

// ─── COLLISION — OVERALL ──────────────────────────────────────────────────────
// Notable patterns:
//   2020: COVID — VMT fell ~40% in Q2 2020; fewer claims at 12mo, sharp catch-up at 24mo
//   2022: Peak used-vehicle price inflation; elevated 24→36mo link ratio
const collisionOverall: LossTriangle = {
  id: 'collision-overall',
  name: 'Collision — Overall',
  coverage: 'collision',
  segment: 'overall',
  evalDate: EVAL_DATE,
  accidentYears: ACCIDENT_YEARS,
  developmentMonths: DEVELOPMENT_MONTHS,
  paidLosses: [
    // AY 2017: $232M ultimate — 96 months of development
    [143.8, 195.1, 217.2, 225.5, 228.8, 230.7, 231.5, 232.0],
    // AY 2018: $243M ultimate
    [150.7, 204.1, 228.0, 236.8, 240.1, 241.8, 242.5, 243.0],
    // AY 2019: $249M ultimate
    [154.4, 208.7, 233.1, 242.0, 245.5, 247.4, 248.2, null],
    // AY 2020: $218M — COVID depressed 12mo, sharp rebound at 24mo
    [109.7, 170.7, 199.9, 208.8, 212.3, 214.5, null, null],
    // AY 2021: $275M — snap-back + supply chain inflation
    [168.4, 232.1, 259.7, 269.2, 272.8, null, null, null],
    // AY 2022: $298M — peak used-car inflation; elevated 24→36mo link ratio
    [175.5, 242.2, 279.2, 290.1, null, null, null, null],
    // AY 2023: $278M — moderating but still above pre-COVID trend
    [168.1, 233.6, 261.5, null, null, null, null, null],
    // AY 2024: $265M projected — only 12 months of data
    [162.4, null, null, null, null, null, null, null],
  ],
  // Selections: volume-weighted 5yr for mature periods, 3yr for recent
  selectedLDFs: [1.364, 1.122, 1.040, 1.017, 1.009, 1.004, 1.002, null],
  tailFactor: 1.018,
};

// ─── COLLISION — TIER 1 (high-value vehicles >$35K) ─────────────────────────
const collisionTier1: LossTriangle = {
  id: 'collision-tier1',
  name: 'Collision — Tier 1 (High-Value)',
  coverage: 'collision',
  segment: 'tier1',
  evalDate: EVAL_DATE,
  accidentYears: ACCIDENT_YEARS,
  developmentMonths: DEVELOPMENT_MONTHS,
  paidLosses: [
    // AY 2017: ~58% of overall (higher average severity, fewer claims)
    [83.4, 113.2, 126.0, 130.8, 132.7, 133.8, 134.3, 134.6],
    // AY 2018
    [87.4, 118.4, 132.2, 137.3, 139.3, 140.2, 140.7, 141.0],
    // AY 2019
    [89.6, 121.1, 135.2, 140.4, 142.4, 143.5, 144.0, null],
    // AY 2020 — COVID effect proportionally smaller for high-value (different usage patterns)
    [65.8, 101.4, 117.7, 122.8, 124.9, 126.1, null, null],
    // AY 2021
    [97.7, 134.6, 150.6, 156.2, 158.4, null, null, null],
    // AY 2022 — inflation hit harder on high-value (supply chain, EV battery costs)
    [101.8, 140.5, 164.8, 171.2, null, null, null, null],
    // AY 2023
    [97.5, 135.5, 153.7, null, null, null, null, null],
    // AY 2024
    [94.2, null, null, null, null, null, null, null],
  ],
  selectedLDFs: [1.423, 1.133, 1.042, 1.018, 1.010, 1.004, 1.002, null],
  tailFactor: 1.020,
};

// ─── COLLISION — TIER 2 (economy vehicles ≤$35K) ────────────────────────────
const collisionTier2: LossTriangle = {
  id: 'collision-tier2',
  name: 'Collision — Tier 2 (Economy)',
  coverage: 'collision',
  segment: 'tier2',
  evalDate: EVAL_DATE,
  accidentYears: ACCIDENT_YEARS,
  developmentMonths: DEVELOPMENT_MONTHS,
  paidLosses: [
    // AY 2017: ~42% of overall — economy vehicles resolve faster (higher total-loss rate)
    [60.4, 81.9, 91.2, 94.7, 96.1, 96.9, 97.2, 97.4],
    // AY 2018
    [63.3, 85.7, 95.8, 99.5, 100.8, 101.6, 101.8, 102.0],
    // AY 2019
    [64.8, 87.6, 97.9, 101.6, 103.1, 103.9, 104.2, null],
    // AY 2020
    [43.9, 69.3, 82.2, 86.0, 87.4, 88.4, null, null],
    // AY 2021
    [70.7, 97.5, 109.1, 113.0, 114.4, null, null, null],
    // AY 2022
    [73.7, 101.7, 114.4, 118.9, null, null, null, null],
    // AY 2023
    [70.6, 98.1, 107.8, null, null, null, null, null],
    // AY 2024
    [68.2, null, null, null, null, null, null, null],
  ],
  selectedLDFs: [1.318, 1.112, 1.038, 1.016, 1.008, 1.003, 1.002, null],
  tailFactor: 1.016,
};

// ─── COMPREHENSIVE ────────────────────────────────────────────────────────────
// Comprehensive develops faster than collision (weather events, theft close quickly)
const comprehensiveOverall: LossTriangle = {
  id: 'comprehensive-overall',
  name: 'Comprehensive — Overall',
  coverage: 'comprehensive',
  segment: 'overall',
  evalDate: EVAL_DATE,
  accidentYears: ACCIDENT_YEARS,
  developmentMonths: DEVELOPMENT_MONTHS,
  paidLosses: [
    // AY 2017: $98M ultimate
    [72.5, 88.1, 93.8, 96.1, 97.1, 97.6, 97.9, 98.0],
    // AY 2018: $104M
    [77.0, 93.5, 99.8, 102.2, 103.1, 103.5, 103.8, 104.0],
    // AY 2019: $109M
    [80.7, 98.2, 104.5, 107.0, 108.0, 108.5, 108.7, null],
    // AY 2020: Lower frequency but hail events in H2 2020
    [63.5, 79.0, 85.2, 87.4, 88.3, 88.7, null, null],
    // AY 2021: $118M — elevated due to chip shortage (longer repairs)
    [86.2, 104.8, 112.0, 114.9, 116.0, null, null, null],
    // AY 2022: $122M
    [89.1, 108.8, 116.1, 119.2, null, null, null, null],
    // AY 2023: $116M
    [84.7, 103.4, 110.2, null, null, null, null, null],
    // AY 2024: $112M projected
    [81.8, null, null, null, null, null, null, null],
  ],
  selectedLDFs: [1.216, 1.068, 1.026, 1.011, 1.005, 1.002, 1.001, null],
  tailFactor: 1.010,
};

// ─── LIABILITY ────────────────────────────────────────────────────────────────
// Liability has the slowest development — bodily injury claims take years to resolve
const liabilityOverall: LossTriangle = {
  id: 'liability-overall',
  name: 'Liability — Overall',
  coverage: 'liability',
  segment: 'overall',
  evalDate: EVAL_DATE,
  accidentYears: ACCIDENT_YEARS,
  developmentMonths: DEVELOPMENT_MONTHS,
  paidLosses: [
    // AY 2017: $78M ultimate — takes 96+ months to fully develop
    [32.5, 51.5, 62.3, 68.6, 72.1, 74.5, 76.0, 77.2],
    // AY 2018: $84M
    [35.1, 55.3, 67.1, 73.8, 77.6, 80.0, 81.6, null],
    // AY 2019: $87M
    [36.3, 57.4, 69.3, 76.3, 80.3, 82.9, null, null],
    // AY 2020: $79M — COVID reduced accidents, delayed litigation
    [27.4, 45.1, 57.7, 64.6, 68.3, null, null, null],
    // AY 2021: $91M — litigation bounce-back, nuclear verdicts increasing
    [38.2, 60.8, 73.7, 81.2, null, null, null, null],
    // AY 2022: $97M — social inflation, larger jury awards
    [40.8, 64.5, 79.3, null, null, null, null, null],
    // AY 2023: $93M
    [38.9, 61.6, null, null, null, null, null, null],
    // AY 2024: $88M projected
    [37.1, null, null, null, null, null, null, null],
  ],
  selectedLDFs: [1.592, 1.257, 1.122, 1.058, 1.032, 1.018, 1.010, null],
  tailFactor: 1.042,
};

export const ALL_TRIANGLES: LossTriangle[] = [
  collisionOverall,
  collisionTier1,
  collisionTier2,
  comprehensiveOverall,
  liabilityOverall,
];

export const TRIANGLES_BY_ID: Record<string, LossTriangle> = Object.fromEntries(
  ALL_TRIANGLES.map(t => [t.id, t])
);

// ─── PORTFOLIO KPI DATA ───────────────────────────────────────────────────────
export const PORTFOLIO_KPIS = {
  totalReportedLoss: 2401.3, // $M
  ibnrEstimate: 312.7,       // $M
  ultimateEstimate: 2714.0,  // $M
  activeTriangles: 18,
  evalDate: EVAL_DATE,
  priorUltimate: 2612.5,
  changeFromPrior: 101.5,
  changeFromPriorPct: 3.9,
};

// ─── DEVELOPMENT TREND CHART DATA ────────────────────────────────────────────
export const DEVELOPMENT_TREND_DATA = [
  { period: '12mo', ay2019: 154.4, ay2020: 109.7, ay2021: 168.4, ay2022: 175.5, ay2023: 168.1, ay2024: 162.4 },
  { period: '24mo', ay2019: 208.7, ay2020: 170.7, ay2021: 232.1, ay2022: 242.2, ay2023: 233.6, ay2024: null },
  { period: '36mo', ay2019: 233.1, ay2020: 199.9, ay2021: 259.7, ay2022: 279.2, ay2023: null, ay2024: null },
  { period: '48mo', ay2019: 242.0, ay2020: 208.8, ay2021: 269.2, ay2022: null, ay2023: null, ay2024: null },
  { period: '60mo', ay2019: 245.5, ay2020: 212.3, ay2021: null, ay2022: null, ay2023: null, ay2024: null },
  { period: '72mo', ay2019: 247.4, ay2020: null, ay2021: null, ay2022: null, ay2023: null, ay2024: null },
];

// ─── RESERVE WATERFALL ────────────────────────────────────────────────────────
export const RESERVE_WATERFALL = [
  { name: 'Prior Carried', value: 2612.5, type: 'base' as const },
  { name: '2022 Dev', value: 63.4, type: 'increase' as const },
  { name: '2024 Emergence', value: 31.2, type: 'increase' as const },
  { name: 'Tail Revision', value: 13.3, type: 'increase' as const },
  { name: '2020 Run-off', value: -6.4, type: 'decrease' as const },
  { name: 'Current Est.', value: 2714.0, type: 'total' as const },
];
