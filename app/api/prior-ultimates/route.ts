import { NextResponse } from 'next/server';
import { executeQuery, isSnowflakeConfigured } from '@/lib/snowflake';

const DEFAULT_PRIOR_ULTIMATES: Record<string, number> = {
  'collision-overall': 2037.5,
  'collision-tier1': 1201.1,
  'collision-tier2': 841.2,
  'comprehensive-overall': 847.0,
  'liability-overall': 706.8,
};

interface PriorRow {
  TRIANGLE_ID: string;
  TOTAL_PRIOR: number;
}

export async function GET() {
  if (!isSnowflakeConfigured()) {
    return NextResponse.json({ priorUltimates: DEFAULT_PRIOR_ULTIMATES, source: 'mock' });
  }

  try {
    const { rows } = await executeQuery<PriorRow>(
      `SELECT triangle_id, SUM(prior_ultimate) AS total_prior
       FROM prior_ultimates
       GROUP BY triangle_id`
    );

    if (rows.length === 0) {
      return NextResponse.json({ priorUltimates: DEFAULT_PRIOR_ULTIMATES, source: 'mock' });
    }

    const priorUltimates: Record<string, number> = {};
    for (const r of rows) {
      priorUltimates[r.TRIANGLE_ID] = r.TOTAL_PRIOR;
    }

    return NextResponse.json({ priorUltimates, source: 'snowflake' });
  } catch (error) {
    console.error('Prior ultimates query failed:', error);
    return NextResponse.json({ priorUltimates: DEFAULT_PRIOR_ULTIMATES, source: 'mock', error: String(error) });
  }
}
