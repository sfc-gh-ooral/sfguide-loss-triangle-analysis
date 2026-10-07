export type Coverage = 'collision' | 'comprehensive' | 'liability';
export type Segment = 'overall' | 'tier1' | 'tier2';

export interface LossTriangle {
  id: string;
  name: string;
  coverage: Coverage;
  segment: Segment;
  evalDate: string;
  accidentYears: number[];
  developmentMonths: number[];
  // paidLosses[ayIdx][devIdx] = cumulative paid loss in $M, null if not yet available
  paidLosses: (number | null)[][];
  selectedLDFs: (number | null)[];
  tailFactor: number;
}

export interface LinkRatios {
  period: string;
  factors: (number | null)[];
  volumeWeighted3yr: number;
  volumeWeighted5yr: number;
  simple3yr: number;
  simple5yr: number;
  selected: number;
  isAnomalous?: boolean;
  anomalyYear?: number; // index of AY with the anomalous factor
}

export interface UltimateRow {
  accidentYear: number;
  reportedLoss: number; // latest diagonal
  cdf: number;
  ultimateLoss: number;
  ibnr: number;
  priorUltimate?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  embeddedTriangleId?: string;
  highlightCells?: Array<{ ayIdx: number; devIdx: number; type: 'highlight' | 'anomaly' }>;
  comparisonData?: ComparisonRow[];
  responseKey?: string; // which scripted response this is
}

export interface ComparisonRow {
  segment: string;
  priorUltimate: number;
  currentUltimate: number;
  change: number;
  changePct: number;
}

export interface ConsistencyRule {
  periods: string[];
  method: 'vol-wtd-3yr' | 'vol-wtd-5yr' | 'simple-3yr' | 'simple-5yr';
  tailFactor: number;
}
