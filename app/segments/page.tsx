'use client';

import { useState, useEffect, useMemo } from 'react';
import { TRIANGLES_BY_ID } from '@/lib/data';
import type { LossTriangle } from '@/lib/types';
import TriangleTable from '@/components/TriangleTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { liveJson, useMode } from '@/lib/mode';
import { sampleDelayMs, wait } from '@/lib/sample-timing';
import { AiSourceBadge, LiveError } from '@/components/AiBadges';
import { INSIGHT_STEPS, Reasoning } from '@/components/Reasoning';
import { Layers, Info, TrendingUp, Sparkles } from 'lucide-react';

type ViewMode = 'coverage' | 'tier';

const COVERAGE_SEGMENTS = [
  { id: 'collision-overall', label: 'Collision', color: '#C44FE8' },
  { id: 'comprehensive-overall', label: 'Comprehensive', color: '#29B5E8' },
  { id: 'liability-overall', label: 'Liability', color: '#F59E0B' },
];

const TIER_SEGMENTS = [
  { id: 'collision-overall', label: 'All Segments', color: '#9C27B0' },
  { id: 'collision-tier1', label: 'Tier 1 (High-Value)', color: '#C44FE8' },
  { id: 'collision-tier2', label: 'Tier 2 (Economy)', color: '#7C3AED' },
];

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 text-xs shadow-xl"
      style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)' }}>
      <div className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--color-text-secondary)' }}>{p.name}:</span>
          <span className="font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            {p.value.toFixed(3)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Scripted Sample-mode insights. Every number is taken from the bundled synthetic data (the same
// values sql/setup.sql loads), so they match what AI_COMPLETE sees in Live mode.
const SAMPLE_INSIGHTS: Record<ViewMode, string[]> = {
  coverage: [
    'Liability develops slowest: its selected 12→24 LDF is 1.592 versus 1.364 for collision and 1.216 for comprehensive, and its 1.042 tail factor is the largest, so it carries the most IBNR relative to paid ($159.6M on $569.2M reported).',
    'Comprehensive is the most mature line, with a 12→24 LDF of 1.216 and a 1.010 tail, leaving $46.5M of IBNR on $826.6M reported.',
    'Every flagged link ratio on the three overall triangles is in AY 2020, mostly at 12→24 and 24→36 months. That points to one accident year with delayed, then catch-up emergence rather than a line-specific trend.',
  ],
  tier: [
    'Tier 1 develops more than Tier 2 at every early age: the selected 12→24 LDF is 1.423 versus 1.318, and the tail factor is 1.020 versus 1.016.',
    'Tier 1 carries $115.2M of IBNR on $1,123.2M reported (10.3%), versus $65.2M on $801.3M (8.1%) for Tier 2. Both ultimates are about 3% above prior.',
    'A single blended collision triangle (12→24 LDF 1.364) sits below the Tier 1 pattern and above Tier 2, so reviewing the tiers separately shows where the blend shifts reserves between them.',
  ],
};

export default function SegmentsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('tier');
  const [trianglesById, setTrianglesById] = useState<Record<string, LossTriangle>>(TRIANGLES_BY_ID);

  const { mode } = useMode();
  const live = mode === 'live';
  const [error, setError] = useState<string>();
  const [insights, setInsights] = useState<{ view: ViewMode; items: string[]; ms?: number; model?: string } | null>(null);
  const [insightState, setInsightState] = useState<{ running: boolean; expectedMs: number; error?: string }>({ running: false, expectedMs: 6000 });

  useEffect(() => {
    if (mode !== 'live') return;
    liveJson<{ triangles: LossTriangle[] }>('/api/triangles').then(data => {
      const byId: Record<string, LossTriangle> = {};
      for (const t of data.triangles) byId[t.id] = t;
      setTrianglesById(byId);
    }).catch((e: Error) => setError(e.message));
  }, [mode]);

  const generateInsights = async () => {
    const view = viewMode;
    if (!live) {
      const ms = sampleDelayMs();
      setInsightState({ running: true, expectedMs: ms });
      await wait(ms);
      setInsights({ view, items: SAMPLE_INSIGHTS[view] });
      setInsightState({ running: false, expectedMs: ms });
      return;
    }
    setInsightState({ running: true, expectedMs: 8000 });
    try {
      const r = await liveJson<{ insights: string[]; latencyMs: number; model: string }>('/api/insights', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ view }),
      });
      setInsights({ view, items: r.insights, ms: r.latencyMs, model: r.model });
      setInsightState({ running: false, expectedMs: 8000 });
    } catch (e) {
      setInsightState({ running: false, expectedMs: 8000, error: (e as Error).message });
    }
  };
  const shown = insights?.view === viewMode ? insights : null;

  // Compute LDF comparison data from live triangles
  const devComparisonData = useMemo(() => {
    const periods = ['12→24','24→36','36→48','48→60','60→72','72→84'];
    const ids = ['collision-overall','collision-tier1','collision-tier2','comprehensive-overall','liability-overall'];
    const keys = ['overall','tier1','tier2','comp','liability'] as const;
    return periods.map((period, i) => {
      const row: Record<string, string | number> = { period };
      ids.forEach((id, j) => {
        const t = trianglesById[id];
        if (t?.selectedLDFs?.[i] != null) row[keys[j]] = t.selectedLDFs[i] as number;
      });
      row['collision'] = row['overall'] ?? 1;
      return row;
    });
  }, [trianglesById]);
  const segments = viewMode === 'coverage' ? COVERAGE_SEGMENTS : TIER_SEGMENTS;
  const chartKeys = viewMode === 'coverage'
    ? ['collision', 'comp', 'liability']
    : ['overall', 'tier1', 'tier2'];
  const chartLabels = viewMode === 'coverage'
    ? { collision: 'Collision', comp: 'Comprehensive', liability: 'Liability' }
    : { overall: 'Overall', tier1: 'Tier 1', tier2: 'Tier 2' };
  const chartColors = viewMode === 'coverage'
    ? { collision: '#C44FE8', comp: '#29B5E8', liability: '#F59E0B' }
    : { overall: '#9C27B0', tier1: '#C44FE8', tier2: '#7C3AED' };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5" style={{ color: 'var(--color-accent-light)' }} />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Segment Analysis
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Compare development patterns across portfolio segments
          </p>
        </div>
        {/* Toggle */}
        <div className="flex rounded-lg p-1" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          {(['tier', 'coverage'] as ViewMode[]).map(mode => (
            <button key={mode}
              onClick={() => setViewMode(mode)}
              className="px-4 py-2 rounded-md text-xs font-medium transition-all"
              style={viewMode === mode
                ? { background: 'var(--color-accent)', color: 'white' }
                : { color: 'var(--color-text-secondary)' }}>
              {mode === 'tier' ? 'By Vehicle Tier' : 'By Coverage'}
            </button>
          ))}
        </div>
      </div>

      {error && <LiveError message={error} />}

      {/* LDF Comparison Chart */}
      <div className="rounded-xl p-6 mb-8"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Selected LDF by Development Period — {viewMode === 'tier' ? 'Vehicle Value Tier' : 'Coverage Type'}
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={devComparisonData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false}
              domain={[1.0, 'dataMax + 0.05']} tickFormatter={v => v.toFixed(3)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(key) => <span style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>{(chartLabels as unknown as Record<string, string>)[key]}</span>} />
            {chartKeys.map(key => (
              <Bar key={key} dataKey={key} fill={(chartColors as unknown as Record<string, string>)[key]}
                radius={[3, 3, 0, 0]} opacity={0.8} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Triangles side by side */}
      <div className="grid gap-6 mb-8"
        style={{ gridTemplateColumns: `repeat(${Math.min(segments.length, 2)}, 1fr)` }}>
        {segments.map(seg => {
          const triangle = trianglesById[seg.id];
          if (!triangle) return null;
          return (
            <div key={seg.id} className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${seg.color}30`, background: 'var(--color-surface-2)' }}>
              <div className="px-4 py-3 flex items-center gap-2 border-b"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-3)' }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {seg.label}
                </span>
              </div>
              <div className="p-2 overflow-auto">
                <TriangleTable triangle={triangle} compact />
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Insights */}
      <div className="rounded-xl p-6"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-accent-light)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Segmentation Insights
          </h2>
          {shown && <AiSourceBadge live={live} feature={`AI_COMPLETE (${shown.model ?? 'model'})`} ms={shown.ms} />}
          <button onClick={generateInsights} disabled={insightState.running || !mode}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: 'white' }}>
            <Sparkles className="w-3.5 h-3.5" />{shown ? 'Regenerate' : 'Generate insights'}
          </button>
        </div>
        {insightState.running && <Reasoning steps={INSIGHT_STEPS} expectedMs={insightState.expectedMs} />}
        {insightState.error && <LiveError message={insightState.error} />}
        {!insightState.running && shown && (
          <div className="space-y-3">
            {shown.items.map((insight, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                  style={{ background: 'rgba(123,14,160,0.25)', color: 'var(--color-accent-light)' }}>
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {insight}
                </p>
              </div>
            ))}
          </div>
        )}
        {!insightState.running && !shown && !insightState.error && (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Compare the {viewMode === 'tier' ? 'vehicle tiers' : 'coverages'} in three short insights.
          </p>
        )}
        <div className="mt-4 px-4 py-3 rounded-lg flex items-start gap-2"
          style={{ background: 'rgba(41,181,232,0.08)', border: '1px solid rgba(41,181,232,0.2)' }}>
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-snowflake)' }} />
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {live
              ? <>Live: the app reads selected LDFs, ultimates, prior ultimates, and <code>v_anomalies</code> flags, then calls{' '}
                  <strong style={{ color: 'var(--color-snowflake)' }}>AI_COMPLETE</strong> with bind variables and a structured response format.</>
              : <>Sample mode: a scripted answer built from the bundled numbers. In Live mode the same panel calls{' '}
                  <strong style={{ color: 'var(--color-snowflake)' }}>AI_COMPLETE</strong> on these facts in your account.</>}
            {' '}AI text is for review by a qualified actuary, not a reserving conclusion. Ask follow-ups in the{' '}
            <strong style={{ color: 'var(--color-snowflake)' }}>AI Agent</strong> screen.
          </p>
        </div>
      </div>
    </div>
  );
}
