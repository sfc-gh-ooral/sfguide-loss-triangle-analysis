'use client';

import { useState, useEffect } from 'react';
import { ALL_TRIANGLES } from '@/lib/data';
import TriangleTable from '@/components/TriangleTable';
import type { LossTriangle } from '@/lib/types';
import { Triangle, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const COVERAGE_COLORS: Record<string, string> = {
  collision: 'var(--color-accent-light)',
  comprehensive: 'var(--color-snowflake)',
  liability: 'var(--color-warning)',
};

const COVERAGE_BG: Record<string, string> = {
  collision: 'rgba(196,79,232,0.12)',
  comprehensive: 'rgba(41,181,232,0.12)',
  liability: 'rgba(245,158,11,0.12)',
};

export default function TrianglesPage() {
  const [triangles, setTriangles] = useState<LossTriangle[]>(ALL_TRIANGLES);
  const [selected, setSelected] = useState<LossTriangle>(ALL_TRIANGLES[0]);

  useEffect(() => {
    fetch('/api/triangles').then(r => r.json()).then(data => {
      if (data.triangles?.length) {
        setTriangles(data.triangles);
        setSelected(data.triangles[0]);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar list */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r"
        style={{ background: 'var(--color-surface-1)', borderColor: 'var(--color-border)' }}>
        <div className="px-4 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Triangle Explorer
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {triangles.length} triangles available
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {triangles.map(t => {
            const color = COVERAGE_COLORS[t.coverage];
            const bg = COVERAGE_BG[t.coverage];
            const isActive = selected.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left transition-all"
                style={{
                  background: isActive ? bg : 'transparent',
                  border: isActive ? `1px solid ${color}40` : '1px solid transparent',
                }}>
                <Triangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate"
                    style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                    {t.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {t.accidentYears.length} AYs · {t.developmentMonths.length} dev periods
                  </div>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color }} />}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>Cell shading</div>
          <div className="flex gap-1 mb-1">
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`triangle-cell-heat-${i} flex-1 h-3 rounded-sm`} />
            ))}
          </div>
          <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span>Early</span>
            <span>Mature</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
              style={{
                background: COVERAGE_BG[selected.coverage],
                color: COVERAGE_COLORS[selected.coverage],
              }}>
              {selected.coverage}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
              style={{ background: 'var(--color-surface-4)', color: 'var(--color-text-muted)' }}>
              {selected.segment === 'overall' ? 'All Segments' : selected.segment === 'tier1' ? 'Tier 1 — High-Value' : 'Tier 2 — Economy'}
            </span>
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {selected.name}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Cumulative Paid Losses ($M) · Evaluation Date: {selected.evalDate}
          </p>
        </div>

        {/* Info bar */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-6"
          style={{ background: 'rgba(41,181,232,0.08)', border: '1px solid rgba(41,181,232,0.2)' }}>
          <Info className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-snowflake)' }} />
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <strong style={{ color: 'var(--color-snowflake)' }}>Snowflake Cortex</strong> generated this triangle from the claims data warehouse.
            Highlighted cells indicate anomalous development. Selected LDFs (purple row) are volume-weighted averages, modifiable by actuarial review.
          </p>
        </div>

        {/* Triangle */}
        <div className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
          <TriangleTable triangle={selected} />
        </div>

        {/* Selection notes */}
        <div className="mt-6 rounded-xl p-5"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Selection Notes
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>LDF Method</div>
              <div style={{ color: 'var(--color-text-muted)' }}>
                12→24, 24→36: 3-year volume-weighted average (excluding AY 2020 from 12→24)<br />
                36→60: 5-year volume-weighted average<br />
                60+: 5-year simple average
              </div>
            </div>
            <div>
              <div className="font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Tail Factor</div>
              <div style={{ color: 'var(--color-text-muted)' }}>
                {selected.tailFactor.toFixed(3)} — based on curve-fitting to observed 96mo+ development
                from 2015-2017 accident years. Represents expected development beyond 96 months.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
