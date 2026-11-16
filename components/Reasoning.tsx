'use client';

// Staged progress for AI calls. The steps name what the live path actually does. In Sample mode they
// advance over the simulated delay; in Live mode they advance on a timer while the real call runs, and
// the last step holds until the answer arrives.
import { Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export const AGENT_STEPS = [
  'Planning with Cortex Agent (LOSS_TRIANGLE_AGENT)',
  'Generating SQL with Cortex Analyst (LOSS_TRIANGLE_SV)',
  'Running query on LOSS_TRIANGLE_WH',
  'Composing the answer',
];

export const INSIGHT_STEPS = [
  'Reading selected LDFs, ultimates, and anomaly flags on LOSS_TRIANGLE_WH',
  'Drafting insights with AI_COMPLETE',
  'Formatting structured output',
];

export function Reasoning({ steps, expectedMs }: { steps: string[]; expectedMs: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const id = window.setInterval(() => setElapsed(Date.now() - t0), 120);
    return () => window.clearInterval(id);
  }, []);
  const per = expectedMs / steps.length;
  const step = Math.min(steps.length - 1, Math.floor(elapsed / per));

  return (
    <div className="reasoning" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-accent-light)' }}>
          <span className="reasoning-orb" aria-hidden />Working
        </div>
        <span className="text-[11px] tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{(elapsed / 1000).toFixed(1)}s</span>
      </div>
      <ol className="space-y-1.5">
        {steps.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'active' : 'todo';
          return (
            <li key={s} className={`reasoning-step ${state} flex items-center gap-2 text-xs`}>
              {state === 'done' ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-positive)' }} aria-hidden />
                : state === 'active' ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--color-accent-light)' }} aria-hidden />
                : <span className="w-3.5 h-3.5 rounded-full border" style={{ borderColor: 'var(--color-border)' }} aria-hidden />}
              <span>{s}</span>
            </li>
          );
        })}
      </ol>
      <div className="reasoning-bar mt-3" aria-hidden><span style={{ width: `${Math.min(96, (elapsed / expectedMs) * 100)}%` }} /></div>
    </div>
  );
}
