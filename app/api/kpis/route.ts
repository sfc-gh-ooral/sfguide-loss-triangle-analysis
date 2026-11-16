import { NextResponse } from 'next/server';
import { executeQuery, isSnowflakeConfigured, liveError, notConfigured } from '@/lib/snowflake';

interface KpiRow {
  TOTAL_REPORTED: number;
  TOTAL_IBNR: number;
  TOTAL_ULTIMATE: number;
  ACTIVE_TRIANGLES: number;
  EVAL_DATE: string;
  PRIOR_TOTAL_ULTIMATE: number;
  CHANGE_FROM_PRIOR: number;
  CHANGE_PCT: number;
}

export async function GET() {
  if (!isSnowflakeConfigured()) return notConfigured();
  try {
    const { rows } = await executeQuery<KpiRow>('SELECT * FROM v_portfolio_kpis');
    if (rows.length === 0) return liveError('v_portfolio_kpis returned no rows. Re-run sql/setup.sql.');
    const r = rows[0];
    const kpis = {
      totalReportedLoss: r.TOTAL_REPORTED,
      ibnrEstimate: r.TOTAL_IBNR,
      ultimateEstimate: r.TOTAL_ULTIMATE,
      activeTriangles: r.ACTIVE_TRIANGLES,
      evalDate: new Date(r.EVAL_DATE).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' }),
      priorUltimate: r.PRIOR_TOTAL_ULTIMATE,
      changeFromPrior: r.CHANGE_FROM_PRIOR,
      changeFromPriorPct: r.CHANGE_PCT,
    };
    return NextResponse.json({ kpis, source: 'snowflake' });
  } catch (error) {
    return liveError(error);
  }
}
