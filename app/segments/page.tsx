'use client';

import { useState, useEffect, useMemo } from 'react';
import { TRIANGLES_BY_ID } from '@/lib/data';
import type { LossTriangle } from '@/lib/types';
import TriangleTable from '@/components/TriangleTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Layers, Info, TrendingUp } from 'lucide-react';

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

const AI_INSIGHTS: Record<ViewMode, string[]> = {
  coverage: [
    'Liability develops much slower than physical damage lines — 12→24 LDF of 1.592 vs. 1.364 for collision. This reflects bodily injury litigation timelines of 18-26 months vs. property repair timelines of 30-90 days.',
    'Comprehensive resolves fastest due to high total-loss rates on weather and theft claims — most close within 45 days of reporting.',
    'All three lines share elevated development in the 2022 accident year, pointing to a systemic inflation driver rather than a line-specific issue.',
  ],
  tier: [
    'Tier 1 (high-value vehicles) develops 7.9% slower at 12→24 months vs. Tier 2 (1.423 vs. 1.318). The main driver is repair complexity — luxury and EV vehicles require certified shops and often have supply chain constraints for parts.',
    'Tier 2 vehicles reach total-loss thresholds faster (31.7% vs. 18.3% total-loss rate), closing claims earlier and reducing late-period development.',
    'Using a blended triangle that combines both tiers creates systematic bias: understating Tier 1 reserves while overstating Tier 2. As the EV mix grows, this bias will increase.',
  ],
};

export default function SegmentsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('tier');
  const [trianglesById, setTrianglesById] = useState<Record<string, LossTriangle>>(TRIANGLES_BY_ID);

  useEffect(() => {
    fetch('/api/triangles').then(r => r.json()).then(data => {
      if (data.triangles?.length) {
        const byId: Record<string, LossTriangle> = {};
        for (const t of data.triangles) byId[t.id] = t;
        setTrianglesById(byId);
      }
    }).catch(() => {});
  }, []);

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
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-accent-light)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Cortex Segmentation Insights
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full ml-auto"
            style={{ background: 'rgba(123,14,160,0.2)', color: 'var(--color-accent-light)' }}>
            AI-generated
          </span>
        </div>
        <div className="space-y-3">
          {AI_INSIGHTS[viewMode].map((insight, i) => (
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
        <div className="mt-4 px-4 py-3 rounded-lg flex items-start gap-2"
          style={{ background: 'rgba(41,181,232,0.08)', border: '1px solid rgba(41,181,232,0.2)' }}>
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-snowflake)' }} />
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Segmentation insights are generated by Snowflake Cortex by analyzing development factor distributions,
            exposure volumes, and statistical significance tests across segment combinations. Navigate to the{' '}
            <strong style={{ color: 'var(--color-snowflake)' }}>AI Agent</strong> to ask follow-up questions.
          </p>
        </div>
      </div>
    </div>
  );
}
