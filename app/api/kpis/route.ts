import { NextResponse } from 'next/server';
import { executeQuery, isSnowflakeConfigured } from '@/lib/snowflake';
import { PORTFOLIO_KPIS } from '@/lib/data';

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
  if (!isSnowflakeConfigured()) {
    return NextResponse.json({ kpis: PORTFOLIO_KPIS, source: 'mock' });
  }

  try {
    const { rows } = await executeQuery<KpiRow>('SELECT * FROM v_portfolio_kpis');
    if (rows.length === 0) {
      return NextResponse.json({ kpis: PORTFOLIO_KPIS, source: 'mock' });
    }

    const r = rows[0];
    const kpis = {
      totalReportedLoss: r.TOTAL_REPORTED,
      ibnrEstimate: r.TOTAL_IBNR,
      ultimateEstimate: r.TOTAL_ULTIMATE,
      activeTriangles: r.ACTIVE_TRIANGLES,
      evalDate: r.EVAL_DATE,
      priorUltimate: r.PRIOR_TOTAL_ULTIMATE,
      changeFromPrior: r.CHANGE_FROM_PRIOR,
      changeFromPriorPct: r.CHANGE_PCT,
    };

    return NextResponse.json({ kpis, source: 'snowflake' });
  } catch (error) {
    console.error('KPI query failed, falling back to mock:', error);
    return NextResponse.json({ kpis: PORTFOLIO_KPIS, source: 'mock', error: String(error) });
  }
}
