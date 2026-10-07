import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { LossTriangle, LinkRatios } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatM(value: number | null, decimals = 1): string {
  if (value === null) return '—';
  return `$${value.toFixed(decimals)}M`;
}

export function formatFactor(value: number | null, decimals = 3): string {
  if (value === null) return '—';
  return value.toFixed(decimals);
}

export function formatPercent(value: number, decimals = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Returns heat intensity 0-6 based on how early in development this cell is */
export function getHeatLevel(ayIdx: number, devIdx: number, totalDevPeriods: number): number {
  // Higher devIdx = more mature = higher heat
  const maturity = devIdx / (totalDevPeriods - 1);
  return Math.min(6, Math.floor(maturity * 7));
}

/** Computes age-to-age factors from a triangle */
export function computeLinkRatios(triangle: LossTriangle): LinkRatios[] {
  const { paidLosses, accidentYears, developmentMonths, selectedLDFs } = triangle;
  const ratios: LinkRatios[] = [];

  for (let d = 0; d < developmentMonths.length - 1; d++) {
    const fromMonth = developmentMonths[d];
    const toMonth = developmentMonths[d + 1];
    const period = `${fromMonth}–${toMonth}`;

    const factors: (number | null)[] = [];
    for (let a = 0; a < accidentYears.length; a++) {
      const from = paidLosses[a][d];
      const to = paidLosses[a][d + 1];
      if (from !== null && to !== null && from > 0) {
        factors.push(to / from);
      } else {
        factors.push(null);
      }
    }

    const validFactors = factors.filter((f): f is number => f !== null);
    const n = validFactors.length;

    // Volume-weighted averages (weight by denominator)
    const vw3yr = computeVolumeWeighted(paidLosses, d, Math.min(3, n));
    const vw5yr = computeVolumeWeighted(paidLosses, d, Math.min(5, n));

    // Simple averages (most recent years)
    const simple3yr = validFactors.length >= 3
      ? avg(validFactors.slice(-3))
      : avg(validFactors);
    const simple5yr = validFactors.length >= 5
      ? avg(validFactors.slice(-5))
      : avg(validFactors);

    // Check for anomalies (> 1.5 std devs from mean)
    const mean = avg(validFactors);
    const stddev = Math.sqrt(validFactors.reduce((s, f) => s + (f - mean) ** 2, 0) / validFactors.length);
    const anomalyIdx = factors.findIndex(f => f !== null && Math.abs(f - mean) > 1.5 * stddev);

    ratios.push({
      period,
      factors,
      volumeWeighted3yr: vw3yr,
      volumeWeighted5yr: vw5yr,
      simple3yr,
      simple5yr,
      selected: selectedLDFs[d] ?? vw5yr,
      isAnomalous: anomalyIdx >= 0 && stddev > 0.01,
      anomalyYear: anomalyIdx >= 0 ? anomalyIdx : undefined,
    });
  }

  return ratios;
}

function computeVolumeWeighted(paidLosses: (number | null)[][], devIdx: number, years: number): number {
  let numerator = 0;
  let denominator = 0;
  const n = paidLosses.length;
  let count = 0;
  for (let a = n - 1; a >= 0 && count < years; a--) {
    const from = paidLosses[a][devIdx];
    const to = paidLosses[a][devIdx + 1];
    if (from !== null && to !== null && from > 0) {
      numerator += to;
      denominator += from;
      count++;
    }
  }
  return denominator > 0 ? numerator / denominator : 1;
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 1;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Compute CDFs from selected LDFs + tail */
export function computeCDFs(selectedLDFs: (number | null)[], tailFactor: number): number[] {
  const cdfs: number[] = [];
  let cdf = tailFactor;
  for (let i = selectedLDFs.length - 1; i >= 0; i--) {
    cdf *= (selectedLDFs[i] ?? 1);
    cdfs.unshift(cdf);
  }
  return cdfs;
}

/** Get the latest diagonal (most recent paid loss for each AY) */
export function getLatestDiagonal(triangle: LossTriangle): { ayIdx: number; devIdx: number; value: number }[] {
  return triangle.accidentYears.map((_, ayIdx) => {
    let latestDev = -1;
    let latestVal = 0;
    for (let d = 0; d < triangle.developmentMonths.length; d++) {
      if (triangle.paidLosses[ayIdx][d] !== null) {
        latestDev = d;
        latestVal = triangle.paidLosses[ayIdx][d] as number;
      }
    }
    return { ayIdx, devIdx: latestDev, value: latestVal };
  });
}
