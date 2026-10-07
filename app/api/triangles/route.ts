import { NextResponse } from 'next/server';
import { executeQuery, isSnowflakeConfigured } from '@/lib/snowflake';
import { ALL_TRIANGLES, DEVELOPMENT_MONTHS, ACCIDENT_YEARS, EVAL_DATE } from '@/lib/data';
import type { LossTriangle } from '@/lib/types';

interface TriangleRow {
  TRIANGLE_ID: string;
  TRIANGLE_NAME: string;
  COVERAGE: string;
  SEGMENT: string;
  EVAL_DATE: string;
  ACCIDENT_YEAR: number;
  DEV_MONTH: number;
  CUMULATIVE_PAID: number;
}

interface FactorRow {
  TRIANGLE_ID: string;
  DEV_PERIOD_FROM: number;
  DEV_PERIOD_TO: number;
  SELECTED_LDF: number;
}

interface TailRow {
  TRIANGLE_ID: string;
  TAIL_FACTOR: number;
}

export async function GET() {
  // If Snowflake is not configured, return mock data
  if (!isSnowflakeConfigured()) {
    return NextResponse.json({ triangles: ALL_TRIANGLES, source: 'mock' });
  }

  try {
    const [triResult, factorResult, tailResult] = await Promise.all([
      executeQuery<TriangleRow>(
        'SELECT * FROM paid_loss_triangles ORDER BY triangle_id, accident_year, dev_month'
      ),
      executeQuery<FactorRow>(
        'SELECT * FROM selected_factors ORDER BY triangle_id, dev_period_from'
      ),
      executeQuery<TailRow>('SELECT * FROM tail_factors'),
    ]);

    // Group rows into LossTriangle objects
    const triangleMap = new Map<string, LossTriangle>();

    for (const row of triResult.rows) {
      if (!triangleMap.has(row.TRIANGLE_ID)) {
        triangleMap.set(row.TRIANGLE_ID, {
          id: row.TRIANGLE_ID,
          name: row.TRIANGLE_NAME,
          coverage: row.COVERAGE as LossTriangle['coverage'],
          segment: row.SEGMENT as LossTriangle['segment'],
          evalDate: row.EVAL_DATE,
          accidentYears: ACCIDENT_YEARS,
          developmentMonths: DEVELOPMENT_MONTHS,
          paidLosses: ACCIDENT_YEARS.map(() => DEVELOPMENT_MONTHS.map(() => null as number | null)),
          selectedLDFs: DEVELOPMENT_MONTHS.map(() => null as number | null),
          tailFactor: 1,
        });
      }
      const tri = triangleMap.get(row.TRIANGLE_ID)!;
      const ayIdx = ACCIDENT_YEARS.indexOf(row.ACCIDENT_YEAR);
      const devIdx = DEVELOPMENT_MONTHS.indexOf(row.DEV_MONTH);
      if (ayIdx >= 0 && devIdx >= 0) {
        tri.paidLosses[ayIdx][devIdx] = row.CUMULATIVE_PAID;
      }
    }

    // Apply selected LDFs
    for (const row of factorResult.rows) {
      const tri = triangleMap.get(row.TRIANGLE_ID);
      if (tri) {
        const devIdx = DEVELOPMENT_MONTHS.indexOf(row.DEV_PERIOD_FROM);
        if (devIdx >= 0) {
          tri.selectedLDFs[devIdx] = row.SELECTED_LDF;
        }
      }
    }

    // Apply tail factors
    for (const row of tailResult.rows) {
      const tri = triangleMap.get(row.TRIANGLE_ID);
      if (tri) {
        tri.tailFactor = row.TAIL_FACTOR;
      }
    }

    const triangles = Array.from(triangleMap.values());
    return NextResponse.json({ triangles, source: 'snowflake' });
  } catch (error) {
    console.error('Snowflake query failed, falling back to mock data:', error);
    return NextResponse.json({ triangles: ALL_TRIANGLES, source: 'mock', error: String(error) });
  }
}
