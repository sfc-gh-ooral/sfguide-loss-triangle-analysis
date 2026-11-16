import { NextResponse } from 'next/server';
import { executeQuery, isSnowflakeConfigured, liveError, notConfigured } from '@/lib/snowflake';

interface WaterfallRow {
  CATEGORY: string;
  AMOUNT: number;
  SORT_ORDER: number;
}

export async function GET() {
  if (!isSnowflakeConfigured()) return notConfigured();
  try {
    const { rows } = await executeQuery<WaterfallRow>('SELECT * FROM v_reserve_waterfall ORDER BY sort_order');
    if (rows.length === 0) return liveError('v_reserve_waterfall returned no rows. Re-run sql/setup.sql.');
    const waterfall = rows.map(r => ({
      name: r.CATEGORY,
      value: r.AMOUNT,
      type: r.SORT_ORDER === 1 ? 'base' as const
          : r.SORT_ORDER === rows.length ? 'total' as const
          : r.AMOUNT >= 0 ? 'increase' as const : 'decrease' as const,
    }));
    return NextResponse.json({ waterfall, source: 'snowflake' });
  } catch (error) {
    return liveError(error);
  }
}
