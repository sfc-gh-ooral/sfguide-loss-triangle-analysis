import { NextResponse } from 'next/server';
import { executeQuery, isSnowflakeConfigured, liveError, notConfigured } from '@/lib/snowflake';
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
  const triangleId = new URL(request.url).searchParams.get('triangleId');
  if (!triangleId) return liveError('triangleId is required', 400);
  if (!isSnowflakeConfigured()) return notConfigured();
  try {
    const { rows } = await executeQuery<UltimateDbRow>(
      'SELECT * FROM v_ultimates WHERE triangle_id = ? ORDER BY accident_year',
      [triangleId]
    );
    const ultimates: UltimateRow[] = rows.map(r => ({
      accidentYear: r.ACCIDENT_YEAR,
      reportedLoss: r.REPORTED_LOSS,
      cdf: r.CDF,
      ultimateLoss: r.ULTIMATE_LOSS,
      ibnr: r.IBNR,
    }));
    return NextResponse.json({ ultimates, source: 'snowflake' });
  } catch (error) {
    return liveError(error);
  }
}
