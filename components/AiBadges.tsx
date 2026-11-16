// Labels every AI output by where it actually came from, and surfaces live errors instead of
// falling back to sample data.
import { AlertTriangle, FlaskConical, Sparkles } from 'lucide-react';

export function AiSourceBadge({ live, feature, ms }: { live: boolean; feature: string; ms?: number }) {
  return live ? (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold"
      style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-positive)' }}>
      <Sparkles className="w-3 h-3" aria-hidden />Powered by {feature} (live){ms != null ? ` · ${(ms / 1000).toFixed(1)} s` : ''}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold"
      style={{ background: 'rgba(245,158,11,0.14)', color: 'var(--color-warning)' }}>
      <FlaskConical className="w-3 h-3" aria-hidden />Sample AI response
    </span>
  );
}

export function LiveError({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg px-4 py-3 mb-6 flex items-start gap-2 text-xs"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', color: 'var(--color-text-secondary)' }}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-negative)' }} aria-hidden />
      <div><strong style={{ color: 'var(--color-negative)' }}>Live query failed.</strong> {message}
        {' '}No sample data was substituted. Check your <code>.env.local</code> and that <code>sql/setup.sql</code> ran, or switch to Sample.</div>
    </div>
  );
}

export function DataSourceChip({ live }: { live: boolean }) {
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
      style={{ background: 'rgba(41,181,232,0.15)', color: 'var(--color-snowflake)', border: '1px solid rgba(41,181,232,0.25)' }}>
      {live ? 'Live · Snowflake views on LOSS_TRIANGLE_WH' : 'Sample data (synthetic, bundled)'}
    </span>
  );
}
