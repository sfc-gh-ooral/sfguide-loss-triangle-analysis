import { NextResponse } from 'next/server';
import { executeQuery, isSnowflakeConfigured } from '@/lib/snowflake';
import { ALL_TRIANGLES } from '@/lib/data';
import { computeLinkRatios } from '@/lib/utils';

interface LinkRatioRow {
  TRIANGLE_ID: string;
  DEV_FROM: number;
  DEV_TO: number;
  ACCIDENT_YEAR: number;
  LINK_RATIO: number;
  VOLUME_WEIGHTED_3YR: number | null;
  VOLUME_WEIGHTED_5YR: number | null;
  SIMPLE_AVG_3YR: number | null;
  SIMPLE_AVG_5YR: number | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const triangleId = searchParams.get('triangleId');

  if (!isSnowflakeConfigured() || !triangleId) {
    const triangle = ALL_TRIANGLES.find(t => t.id === triangleId) ?? ALL_TRIANGLES[0];
    const ratios = computeLinkRatios(triangle);
    return NextResponse.json({ ratios, source: 'mock' });
  }

  try {
    const { rows } = await executeQuery<LinkRatioRow>(
      'SELECT * FROM v_link_ratios WHERE triangle_id = ? ORDER BY dev_from, accident_year',
      [triangleId]
    );

    if (rows.length === 0) {
      const triangle = ALL_TRIANGLES.find(t => t.id === triangleId);
      if (triangle) {
        return NextResponse.json({ ratios: computeLinkRatios(triangle), source: 'mock' });
      }
      return NextResponse.json({ ratios: [], source: 'snowflake' });
    }

    // Group by dev period
    const periodMap = new Map<string, {
      period: string;
      factors: (number | null)[];
      volumeWeighted3yr: number;
      volumeWeighted5yr: number;
      simple3yr: number;
      simple5yr: number;
      selected: number;
    }>();

    for (const row of rows) {
      const key = `${row.DEV_FROM}–${row.DEV_TO}`;
      if (!periodMap.has(key)) {
        periodMap.set(key, {
          period: key,
          factors: [],
          volumeWeighted3yr: row.VOLUME_WEIGHTED_3YR ?? 1,
          volumeWeighted5yr: row.VOLUME_WEIGHTED_5YR ?? 1,
          simple3yr: row.SIMPLE_AVG_3YR ?? 1,
          simple5yr: row.SIMPLE_AVG_5YR ?? 1,
          selected: row.VOLUME_WEIGHTED_5YR ?? 1,
        });
      }
      periodMap.get(key)!.factors.push(row.LINK_RATIO);
    }

    return NextResponse.json({ ratios: Array.from(periodMap.values()), source: 'snowflake' });
  } catch (error) {
    console.error('Link ratios query failed:', error);
    const triangle = ALL_TRIANGLES.find(t => t.id === triangleId);
    if (triangle) {
      return NextResponse.json({ ratios: computeLinkRatios(triangle), source: 'mock', error: String(error) });
    }
    return NextResponse.json({ ratios: [], source: 'mock', error: String(error) });
  }
}
