import type { LossTriangle } from './types';

export interface Anomaly {
  triangleId: string;
  devFrom: number;
  devTo: number;
  accidentYear: number;
  linkRatio: number;
  meanRatio: number;
  stddevRatio: number;
  z: number;
}

// Same rule as the v_anomalies view in sql/setup.sql: a link ratio more than 1.5 sample standard
// deviations from the mean of that development period. Used in Sample mode so both modes agree.
export function computeAnomalies(triangles: LossTriangle[]): Anomaly[] {
  const out: Anomaly[] = [];
  for (const t of triangles) {
    for (let d = 0; d < t.developmentMonths.length - 1; d++) {
      const ratios: { ay: number; r: number }[] = [];
      t.accidentYears.forEach((ay, i) => {
        const a = t.paidLosses[i][d], b = t.paidLosses[i][d + 1];
        if (a != null && b != null && a !== 0) ratios.push({ ay, r: b / a });
      });
      if (ratios.length < 2) continue;
      const mean = ratios.reduce((s, x) => s + x.r, 0) / ratios.length;
      const sd = Math.sqrt(ratios.reduce((s, x) => s + (x.r - mean) ** 2, 0) / (ratios.length - 1));
      for (const x of ratios) {
        if (sd > 0 && Math.abs(x.r - mean) > 1.5 * sd) {
          out.push({ triangleId: t.id, devFrom: t.developmentMonths[d], devTo: t.developmentMonths[d + 1],
            accidentYear: x.ay, linkRatio: x.r, meanRatio: mean, stddevRatio: sd, z: (x.r - mean) / sd });
        }
      }
    }
  }
  return out.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
}
