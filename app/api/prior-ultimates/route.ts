import { NextResponse } from 'next/server';
import { executeQuery, isSnowflakeConfigured, liveError, notConfigured } from '@/lib/snowflake';

interface PriorRow {
  TRIANGLE_ID: string;
  TOTAL_PRIOR: number;
}

export async function GET() {
  if (!isSnowflakeConfigured()) return notConfigured();
  try {
    const { rows } = await executeQuery<PriorRow>(
      `SELECT triangle_id, SUM(prior_ultimate) AS total_prior
       FROM prior_ultimates
       GROUP BY triangle_id`
    );
    if (rows.length === 0) return liveError('prior_ultimates is empty. Re-run sql/setup.sql.');
    const priorUltimates: Record<string, number> = {};
    for (const r of rows) priorUltimates[r.TRIANGLE_ID] = r.TOTAL_PRIOR;
    return NextResponse.json({ priorUltimates, source: 'snowflake' });
  } catch (error) {
    return liveError(error);
  }
}
