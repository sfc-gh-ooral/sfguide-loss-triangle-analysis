import { NextResponse } from 'next/server';
import { isSnowflakeConfigured, executeQuery } from '@/lib/snowflake';
import { matchResponseKey, AGENT_RESPONSES } from '@/lib/responses';

export async function POST(request: Request) {
  const { message } = await request.json();

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // If Snowflake is configured, try the Cortex Agent
  if (isSnowflakeConfigured() && process.env.SNOWFLAKE_AGENT_NAME) {
    try {
      return await callCortexAgent(message);
    } catch (error) {
      console.error('Cortex Agent call failed, falling back to scripted responses:', error);
    }
  }

  // Fallback: use scripted keyword-matched responses
  const key = matchResponseKey(message);
  const response = AGENT_RESPONSES[key];

  return NextResponse.json({
    text: response.text,
    embeddedTriangleId: response.embeddedTriangleId,
    highlightCells: response.highlightCells,
    comparisonData: response.comparisonData,
    responseKey: key,
    source: 'mock',
  });
}

async function callCortexAgent(message: string): Promise<NextResponse> {
  const agentName = process.env.SNOWFLAKE_AGENT_NAME!;
  const messagesJson = JSON.stringify({
    messages: [{ role: 'user', content: [{ type: 'text', text: message }] }],
  });

  // Use DATA_AGENT_RUN to call the agent and extract the text response
  const { rows } = await executeQuery<{ TEXT_CONTENT: string }>(
    `WITH agent_response AS (
       SELECT TRY_PARSE_JSON(
         SNOWFLAKE.CORTEX.DATA_AGENT_RUN('${agentName}', ?, TRUE)
       ) AS resp
     )
     SELECT f.value:text::STRING AS TEXT_CONTENT
     FROM agent_response, LATERAL FLATTEN(input => resp:content) f
     WHERE f.value:type::STRING = 'text'
     LIMIT 1`,
    [messagesJson]
  );

  if (rows.length === 0 || !rows[0].TEXT_CONTENT) {
    throw new Error('Empty response from Cortex Agent');
  }

  return NextResponse.json({
    text: rows[0].TEXT_CONTENT,
    source: 'cortex-agent',
  });
}
