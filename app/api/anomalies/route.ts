import { NextResponse } from 'next/server';
import { executeQuery, isSnowflakeConfigured, liveError, notConfigured } from '@/lib/snowflake';
import type { Anomaly } from '@/lib/anomalies';

interface Row {
  TRIANGLE_ID: string; DEV_FROM: number; DEV_TO: number; ACCIDENT_YEAR: number;
  LINK_RATIO: number; MEAN_RATIO: number; STDDEV_RATIO: number;
}

// Flagged link ratios from the v_anomalies view (a SQL rule, not a model).
export async function GET() {
  if (!isSnowflakeConfigured()) return notConfigured();
  try {
    const { rows } = await executeQuery<Row>(
      `SELECT triangle_id, dev_from, dev_to, accident_year, link_ratio, mean_ratio, stddev_ratio
       FROM v_anomalies WHERE is_anomalous`
    );
    const anomalies: Anomaly[] = rows.map(r => ({
      triangleId: r.TRIANGLE_ID, devFrom: r.DEV_FROM, devTo: r.DEV_TO, accidentYear: r.ACCIDENT_YEAR,
      linkRatio: r.LINK_RATIO, meanRatio: r.MEAN_RATIO, stddevRatio: r.STDDEV_RATIO,
      z: (r.LINK_RATIO - r.MEAN_RATIO) / r.STDDEV_RATIO,
    })).sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    return NextResponse.json({ anomalies, source: 'snowflake' });
  } catch (error) {
    return liveError(error);
  }
}
