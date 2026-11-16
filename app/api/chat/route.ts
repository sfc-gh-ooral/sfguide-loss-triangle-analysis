import { NextResponse } from 'next/server';
import { agentName, executeQuery, isSnowflakeConfigured, liveError, notConfigured } from '@/lib/snowflake';

// Live chat only: sends the question to the Cortex Agent, which uses Cortex Analyst over
// LOSS_TRIANGLE_SV. Sample mode answers in the browser and never calls this route.
export async function POST(request: Request) {
  const { message } = await request.json().catch(() => ({}));
  if (!message || typeof message !== 'string') return liveError('Message is required', 400);
  if (!isSnowflakeConfigured()) return notConfigured();

  const t0 = Date.now();
  try {
    const messagesJson = JSON.stringify({
      messages: [{ role: 'user', content: [{ type: 'text', text: message }] }],
    });
    const { rows } = await executeQuery<{ TEXT_CONTENT: string }>(
      `WITH agent_response AS (
         SELECT TRY_PARSE_JSON(SNOWFLAKE.CORTEX.DATA_AGENT_RUN('${agentName()}', ?, TRUE)) AS resp
       )
       SELECT LISTAGG(f.value:text::STRING, '\\n\\n') WITHIN GROUP (ORDER BY f.index) AS TEXT_CONTENT
       FROM agent_response, LATERAL FLATTEN(input => resp:content) f
       WHERE f.value:type::STRING = 'text'`,
      [messagesJson]
    );
    if (!rows[0]?.TEXT_CONTENT) return liveError('The Cortex Agent returned no text. Check that sql/cortex-agent.sql ran.');
    return NextResponse.json({ text: rows[0].TEXT_CONTENT, latencyMs: Date.now() - t0, source: 'cortex-agent' });
  } catch (error) {
    return liveError(error);
  }
}
