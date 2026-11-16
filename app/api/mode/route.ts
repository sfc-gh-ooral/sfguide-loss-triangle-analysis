import { NextResponse } from 'next/server';
import { isSnowflakeConfigured } from '@/lib/snowflake';

// Tells the UI whether the server has a Snowflake connection, so the header can default to Live.
export function GET() {
  return NextResponse.json({ mode: isSnowflakeConfigured() ? 'live' : 'sample' });
}
