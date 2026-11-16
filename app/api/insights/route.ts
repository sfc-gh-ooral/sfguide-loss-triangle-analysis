import { NextResponse } from 'next/server';
import { COMPLETE_MODEL, executeQuery, isSnowflakeConfigured, liveError, notConfigured } from '@/lib/snowflake';

const SEGMENTS: Record<string, string[]> = {
  coverage: ['collision-overall', 'comprehensive-overall', 'liability-overall'],
  tier: ['collision-overall', 'collision-tier1', 'collision-tier2'],
};

// Segment insights with AI_COMPLETE. The facts come from the example's tables and views; the
// prompt and model are bind variables, and the response is structured output (three strings).
export async function POST(request: Request) {
  const { view } = await request.json().catch(() => ({}));
  const ids = SEGMENTS[view as string];
  if (!ids) return liveError('view must be "coverage" or "tier"', 400);
  if (!isSnowflakeConfigured()) return notConfigured();

  const t0 = Date.now();
  try {
    const { rows: facts } = await executeQuery<{ FACTS: string }>(
      `SELECT LISTAGG(line, '\\n') WITHIN GROUP (ORDER BY triangle_id) AS facts FROM (
         SELECT s.triangle_id,
                s.triangle_id || ': selected LDFs ' || s.ldfs || '; tail ' || t.tail_factor
                || '; reported $' || u.rep || 'M; IBNR $' || u.ibnr || 'M; ultimate $' || u.ult
                || 'M; prior ultimate $' || p.prior || 'M; flagged link ratios ' || COALESCE(a.flags, 'none') AS line
         FROM (SELECT triangle_id, LISTAGG(dev_period_from || '-' || dev_period_to || '=' || selected_ldf, ', ')
                      WITHIN GROUP (ORDER BY dev_period_from) AS ldfs
               FROM selected_factors GROUP BY 1) s
         JOIN tail_factors t ON t.triangle_id = s.triangle_id
         JOIN (SELECT triangle_id, ROUND(SUM(reported_loss), 1) rep, ROUND(SUM(ibnr), 1) ibnr, ROUND(SUM(ultimate_loss), 1) ult
               FROM v_ultimates GROUP BY 1) u ON u.triangle_id = s.triangle_id
         JOIN (SELECT triangle_id, ROUND(SUM(prior_ultimate), 1) prior FROM prior_ultimates GROUP BY 1) p ON p.triangle_id = s.triangle_id
         LEFT JOIN (SELECT triangle_id, LISTAGG('AY ' || accident_year || ' ' || dev_from || '-' || dev_to || ' (' || ROUND(link_ratio, 3) || ')', ', ')
                           WITHIN GROUP (ORDER BY dev_from, accident_year) AS flags
                    FROM v_anomalies WHERE is_anomalous GROUP BY 1) a ON a.triangle_id = s.triangle_id
         WHERE s.triangle_id IN (SELECT value::STRING FROM TABLE(FLATTEN(PARSE_JSON(?)))))`,
      [JSON.stringify(ids)]
    );
    const prompt =
      'You are assisting a reserving actuary reviewing synthetic auto insurance paid loss triangles ' +
      '(values in $M, accident years 2017-2024, chain-ladder method). Compare these segments and write ' +
      'exactly three short insights (one or two sentences each) about development speed, reserve change ' +
      'versus prior, and anomalies. Use only the numbers below; do not invent claim counts, causes, or ' +
      'rates that are not given. A higher LDF or tail factor means more development still to come, i.e. ' +
      'slower development. In this synthetic set every prior ultimate is 97% of the current one, ' +
      'so do not rank segments by percent change versus prior. ' +
      `Segments:\n${facts[0]?.FACTS ?? ''}`;

    const { rows } = await executeQuery<{ R: string }>(
      `SELECT AI_COMPLETE(
         model => ?, prompt => ?,
         model_parameters => {'temperature': 0, 'max_tokens': 700},
         response_format => TYPE OBJECT(insights ARRAY(STRING))
       ) AS R`,
      [COMPLETE_MODEL, prompt]
    );
    const parsed = typeof rows[0]?.R === 'string' ? JSON.parse(rows[0].R) : rows[0]?.R;
    const insights: string[] = parsed?.insights ?? [];
    if (insights.length === 0) return liveError('AI_COMPLETE returned no insights.');
    return NextResponse.json({ insights, model: COMPLETE_MODEL, latencyMs: Date.now() - t0, source: 'ai_complete' });
  } catch (error) {
    return liveError(error);
  }
}
