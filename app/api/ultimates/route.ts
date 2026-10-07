import { NextResponse } from 'next/server';
import { executeQuery, isSnowflakeConfigured } from '@/lib/snowflake';
import { ALL_TRIANGLES } from '@/lib/data';
import { computeCDFs, getLatestDiagonal } from '@/lib/utils';
import type { UltimateRow } from '@/lib/types';

interface UltimateDbRow {
  TRIANGLE_ID: string;
  ACCIDENT_YEAR: number;
  REPORTED_LOSS: number;
  CDF: number;
  ULTIMATE_LOSS: number;
  IBNR: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const triangleId = searchParams.get('triangleId');

  if (!isSnowflakeConfigured() || !triangleId) {
    const triangle = ALL_TRIANGLES.find(t => t.id === triangleId) ?? ALL_TRIANGLES[0];
    const cdfs = computeCDFs(triangle.selectedLDFs, triangle.tailFactor);
    const diagonal = getLatestDiagonal(triangle);
    const ultimates: UltimateRow[] = triangle.accidentYears.map((ay, i) => {
      const d = diagonal[i];
      const cdf = d.devIdx >= 0 ? cdfs[d.devIdx] : 1;
      return {
        accidentYear: ay,
        reportedLoss: d.value,
        cdf,
        ultimateLoss: d.value * cdf,
        ibnr: d.value * cdf - d.value,
      };
    });
    return NextResponse.json({ ultimates, source: 'mock' });
  }

  try {
    const { rows } = await executeQuery<UltimateDbRow>(
      'SELECT * FROM v_ultimates WHERE triangle_id = ? ORDER BY accident_year',
      [triangleId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ ultimates: [], source: 'snowflake' });
    }

    const ultimates: UltimateRow[] = rows.map(r => ({
      accidentYear: r.ACCIDENT_YEAR,
      reportedLoss: r.REPORTED_LOSS,
      cdf: r.CDF,
      ultimateLoss: r.ULTIMATE_LOSS,
      ibnr: r.IBNR,
    }));

    return NextResponse.json({ ultimates, source: 'snowflake' });
  } catch (error) {
    console.error('Ultimates query failed:', error);
    return NextResponse.json({ ultimates: [], source: 'mock', error: String(error) });
  }
}
