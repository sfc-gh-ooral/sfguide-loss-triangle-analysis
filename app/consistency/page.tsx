'use client';

import { useState, useEffect } from 'react';
import { ALL_TRIANGLES, TRIANGLES_BY_ID } from '@/lib/data';
import { computeLinkRatios } from '@/lib/utils';
import type { LossTriangle } from '@/lib/types';
import { CheckSquare, Play, Info, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

type LDFMethod = 'vol-wtd-3yr' | 'vol-wtd-5yr' | 'simple-3yr' | 'simple-5yr';

interface RuleSet {
  early: LDFMethod;    // 12→24, 24→36
  mid: LDFMethod;      // 36→60
  late: LDFMethod;     // 60+
  tail: number;
  excludeCovid: boolean;
}

const DEFAULT_RULES: RuleSet = {
  early: 'vol-wtd-3yr',
  mid: 'vol-wtd-5yr',
  late: 'simple-5yr',
  tail: 1.018,
  excludeCovid: true,
};

const METHOD_LABELS: Record<LDFMethod, string> = {
  'vol-wtd-3yr': '3-yr Volume-Weighted Avg',
  'vol-wtd-5yr': '5-yr Volume-Weighted Avg',
  'simple-3yr': '3-yr Simple Average',
  'simple-5yr': '5-yr Simple Average',
};

const DEFAULT_PRIOR_ULTIMATES: Record<string, number> = {
  'collision-overall': 2037.5,
  'collision-tier1': 1201.1,
  'collision-tier2': 841.2,
  'comprehensive-overall': 847.0,
  'liability-overall': 706.8,
};

function getFactorForPeriod(lr: ReturnType<typeof computeLinkRatios>[number], method: LDFMethod): number {
  switch (method) {
    case 'vol-wtd-3yr': return lr.volumeWeighted3yr;
    case 'vol-wtd-5yr': return lr.volumeWeighted5yr;
    case 'simple-3yr': return lr.simple3yr;
    case 'simple-5yr': return lr.simple5yr;
  }
}

function computeUltimateForTriangle(triangleId: string, rules: RuleSet, lookup: Record<string, LossTriangle>): number {
  const triangle = lookup[triangleId];
  if (!triangle) return 0;

  const ratios = computeLinkRatios(triangle);
  const { paidLosses, accidentYears, developmentMonths } = triangle;

  // Build selected LDFs per development period based on rules
  const selectedLDFs: number[] = [];
  for (let i = 0; i < ratios.length; i++) {
    const lr = ratios[i];
    const isEarly = i < 2;          // 12→24, 24→36
    const isMid = i >= 2 && i < 4;  // 36→48, 48→60
    const method = isEarly ? rules.early : isMid ? rules.mid : rules.late;

    if (rules.excludeCovid && i === 0) {
      // Recompute 12→24 averages excluding AY 2020 (index 3)
      const covidIdx = 3;
      const filteredFactors = lr.factors.filter((f, idx) => f !== null && idx !== covidIdx) as number[];
      const n = filteredFactors.length;
      if (method === 'vol-wtd-3yr' || method === 'vol-wtd-5yr') {
        const years = method === 'vol-wtd-3yr' ? 3 : 5;
        let num = 0, den = 0, count = 0;
        for (let a = paidLosses.length - 1; a >= 0 && count < years; a--) {
          if (a === covidIdx) continue;
          const from = paidLosses[a][0];
          const to = paidLosses[a][1];
          if (from !== null && to !== null && from > 0) { num += to; den += from; count++; }
        }
        selectedLDFs.push(den > 0 ? num / den : getFactorForPeriod(lr, method));
      } else {
        const yrs = method === 'simple-3yr' ? 3 : 5;
        const slice = n >= yrs ? filteredFactors.slice(-yrs) : filteredFactors;
        selectedLDFs.push(slice.length > 0 ? slice.reduce((s, v) => s + v, 0) / slice.length : 1);
      }
    } else {
      selectedLDFs.push(getFactorForPeriod(lr, method));
    }
  }

  // Compute CDFs — chain-ladder: CDF[i] = product of LDFs from i to end × tail
  const cdfs: number[] = [];
  let cdf = rules.tail;
  for (let i = selectedLDFs.length - 1; i >= 0; i--) {
    cdf *= selectedLDFs[i];
    cdfs.unshift(cdf);
  }

  // For each AY: ultimate = latest diagonal value × CDF at that development age
  let totalUltimate = 0;
  for (let a = 0; a < accidentYears.length; a++) {
    let latestDevIdx = -1;
    let latestVal = 0;
    for (let d = 0; d < developmentMonths.length; d++) {
      if (paidLosses[a][d] !== null) { latestDevIdx = d; latestVal = paidLosses[a][d] as number; }
    }
    if (latestDevIdx >= 0) {
      const ayCdf = latestDevIdx < cdfs.length ? cdfs[latestDevIdx] : rules.tail;
      totalUltimate += latestVal * ayCdf;
    }
  }

  return totalUltimate;
}

interface ResultRow {
  id: string;
  name: string;
  prior: number;
  current: number;
  change: number;
  changePct: number;
}

export default function ConsistencyPage() {
  const [rules, setRules] = useState<RuleSet>(DEFAULT_RULES);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [triangles, setTriangles] = useState<LossTriangle[]>(ALL_TRIANGLES);
  const [trianglesById, setTrianglesById] = useState<Record<string, LossTriangle>>(TRIANGLES_BY_ID);
  const [priorUltimates, setPriorUltimates] = useState<Record<string, number>>(DEFAULT_PRIOR_ULTIMATES);

  useEffect(() => {
    fetch('/api/triangles').then(r => r.json()).then(data => {
      if (data.triangles?.length) {
        setTriangles(data.triangles);
        const byId: Record<string, LossTriangle> = {};
        for (const t of data.triangles) byId[t.id] = t;
        setTrianglesById(byId);
      }
    }).catch(() => {});
    fetch('/api/prior-ultimates').then(r => r.json()).then(data => {
      if (data.priorUltimates) setPriorUltimates(data.priorUltimates);
    }).catch(() => {});
  }, []);

  const runTest = async () => {
    setIsRunning(true);
    await new Promise(r => setTimeout(r, 1400));

    const rows: ResultRow[] = triangles.map(t => {
      const prior = priorUltimates[t.id] ?? 0;
      const current = computeUltimateForTriangle(t.id, rules, trianglesById);
      return {
        id: t.id,
        name: t.name,
        prior,
        current,
        change: current - prior,
        changePct: ((current - prior) / prior) * 100,
      };
    });

    setResults(rows);
    setIsRunning(false);
  };

  const resetRules = () => { setRules(DEFAULT_RULES); setResults(null); };

  const totalPrior = results?.reduce((s, r) => s + r.prior, 0) ?? 0;
  const totalCurrent = results?.reduce((s, r) => s + r.current, 0) ?? 0;
  const totalChange = totalCurrent - totalPrior;

  const chartData = results?.map(r => ({
    name: r.name.replace(' — ', '\n'),
    prior: r.prior,
    current: r.current,
    change: r.change,
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <CheckSquare className="w-5 h-5" style={{ color: 'var(--color-positive)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Consistency Testing
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Apply a uniform set of selection rules across all segments and see the reserve impact
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Rule Builder */}
        <div className="col-span-1">
          <div className="rounded-xl p-5 sticky top-6"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Selection Rules
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Early periods (12→24, 24→36)
                </label>
                <select value={rules.early}
                  onChange={e => setRules(r => ({ ...r, early: e.target.value as LDFMethod }))}
                  className="w-full text-xs rounded-lg px-3 py-2.5 outline-none"
                  style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
                  {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Mid periods (36→60)
                </label>
                <select value={rules.mid}
                  onChange={e => setRules(r => ({ ...r, mid: e.target.value as LDFMethod }))}
                  className="w-full text-xs rounded-lg px-3 py-2.5 outline-none"
                  style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
                  {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Late periods (60+)
                </label>
                <select value={rules.late}
                  onChange={e => setRules(r => ({ ...r, late: e.target.value as LDFMethod }))}
                  className="w-full text-xs rounded-lg px-3 py-2.5 outline-none"
                  style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
                  {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Tail Factor
                </label>
                <input type="number" step="0.001" min="1.000" max="1.100"
                  value={rules.tail}
                  onChange={e => setRules(r => ({ ...r, tail: parseFloat(e.target.value) || 1.018 }))}
                  className="w-full text-xs rounded-lg px-3 py-2.5 outline-none tabular-nums"
                  style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  onClick={() => setRules(r => ({ ...r, excludeCovid: !r.excludeCovid }))}
                  className="w-10 h-5 rounded-full relative cursor-pointer transition-all"
                  style={{ background: rules.excludeCovid ? 'var(--color-accent)' : 'var(--color-surface-4)' }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                    style={{
                      background: 'white',
                      left: rules.excludeCovid ? 'calc(100% - 18px)' : '2px',
                    }} />
                </div>
                <label className="text-xs cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}
                  onClick={() => setRules(r => ({ ...r, excludeCovid: !r.excludeCovid }))}>
                  Exclude 2020 AY from 12→24 avg
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={runTest} disabled={isRunning}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: 'var(--color-accent)', color: 'white' }}>
                {isRunning
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Running...</>
                  : <><Play className="w-4 h-4" />Run Test</>}
              </button>
              <button onClick={resetRules}
                className="px-3 py-2.5 rounded-lg transition-all"
                style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(41,181,232,0.08)', border: '1px solid rgba(41,181,232,0.2)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Info className="w-3 h-3 inline mr-1" style={{ color: 'var(--color-snowflake)' }} />
                Per actuarial policy, this tool is for consistency testing only. Results require actuary review before use in reserve setting.
              </p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="col-span-2 space-y-6">
          {!results && !isRunning && (
            <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
              style={{ background: 'var(--color-surface-2)', border: '2px dashed var(--color-border)' }}>
              <CheckSquare className="w-10 h-10 mb-4" style={{ color: 'var(--color-text-muted)' }} />
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Configure rules and run the consistency test
              </div>
              <p className="text-xs max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
                The test will apply your selection rules uniformly across all 5 triangles and compute the impact vs. prior carried reserves.
              </p>
            </div>
          )}

          {isRunning && (
            <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <div className="w-10 h-10 border-2 border-t-purple-500 rounded-full animate-spin mb-4"
                style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Cortex is applying selection rules...
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Computing ultimates across 5 triangles · 8 accident years each
              </p>
            </div>
          )}

          {results && (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Prior Total Ultimate', value: `$${totalPrior.toFixed(1)}M`, sub: 'Carried reserve' },
                  {
                    label: 'Current Total Ultimate',
                    value: `$${totalCurrent.toFixed(1)}M`,
                    sub: 'With new selections',
                    color: 'var(--color-accent-light)',
                  },
                  {
                    label: 'Net Change',
                    value: `${totalChange >= 0 ? '+' : ''}$${totalChange.toFixed(1)}M`,
                    sub: `${totalChange >= 0 ? '+' : ''}${((totalChange / totalPrior) * 100).toFixed(1)}% vs prior`,
                    color: totalChange >= 0 ? 'var(--color-negative)' : 'var(--color-positive)',
                  },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="rounded-xl p-4"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                    <div className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: color ?? 'var(--color-text-primary)' }}>
                      {value}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div className="rounded-xl p-5"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Prior vs. Current Ultimate by Triangle
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                      tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                      tickLine={false} axisLine={false} tickFormatter={v => `$${v}M`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: 'var(--color-text-primary)' }}
                      formatter={(v) => [`$${Number(v).toFixed(1)}M`]}
                    />
                    <Bar dataKey="prior" fill="#4A0870" radius={[3, 3, 0, 0]} name="Prior" />
                    <Bar dataKey="current" fill="#9C27B0" radius={[3, 3, 0, 0]} name="Current" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detail table */}
              <div className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--color-border)' }}>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      {['Triangle', 'Prior Ultimate', 'Current Ultimate', 'Change', 'Δ%', 'Direction'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold"
                          style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, i) => {
                      const isInc = row.change >= 0;
                      const changeColor = isInc ? 'var(--color-negative)' : 'var(--color-positive)';
                      return (
                        <tr key={i}
                          style={{ borderBottom: '1px solid var(--color-border-subtle)', background: i % 2 === 0 ? 'var(--color-surface-2)' : 'var(--color-surface-1)' }}>
                          <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--color-text-primary)' }}>{row.name}</td>
                          <td className="px-4 py-2.5 tabular-nums text-right" style={{ color: 'var(--color-text-muted)' }}>
                            ${row.prior.toFixed(1)}M
                          </td>
                          <td className="px-4 py-2.5 tabular-nums text-right font-semibold"
                            style={{ color: 'var(--color-accent-light)' }}>
                            ${row.current.toFixed(1)}M
                          </td>
                          <td className="px-4 py-2.5 tabular-nums text-right font-semibold" style={{ color: changeColor }}>
                            {isInc ? '+' : ''}${row.change.toFixed(1)}M
                          </td>
                          <td className="px-4 py-2.5 tabular-nums text-right font-semibold" style={{ color: changeColor }}>
                            {isInc ? '+' : ''}{row.changePct.toFixed(1)}%
                          </td>
                          <td className="px-4 py-2.5">
                            {isInc
                              ? <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-negative)' }} />
                              : <TrendingDown className="w-4 h-4" style={{ color: 'var(--color-positive)' }} />}
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: 'rgba(123,14,160,0.12)', borderTop: '2px solid var(--color-border)' }}>
                      <td className="px-4 py-2.5 font-bold" style={{ color: 'var(--color-text-primary)' }}>Total Portfolio</td>
                      <td className="px-4 py-2.5 tabular-nums text-right font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        ${totalPrior.toFixed(1)}M
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-right font-bold" style={{ color: 'var(--color-accent-light)' }}>
                        ${totalCurrent.toFixed(1)}M
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-right font-bold"
                        style={{ color: totalChange >= 0 ? 'var(--color-negative)' : 'var(--color-positive)' }}>
                        {totalChange >= 0 ? '+' : ''}${totalChange.toFixed(1)}M
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-right font-bold"
                        style={{ color: totalChange >= 0 ? 'var(--color-negative)' : 'var(--color-positive)' }}>
                        {totalChange >= 0 ? '+' : ''}{((totalChange / totalPrior) * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5">
                        {totalChange >= 0
                          ? <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-negative)' }} />
                          : <TrendingDown className="w-4 h-4" style={{ color: 'var(--color-positive)' }} />}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
