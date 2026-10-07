'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Database, BarChart3, MessageSquare, Triangle, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { PORTFOLIO_KPIS, DEVELOPMENT_TREND_DATA, RESERVE_WATERFALL } from '@/lib/data';

function KPICard({ label, value, sub, trend, trendUp }: {
  label: string; value: string; sub?: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="rounded-xl p-5"
      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
      <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {sub}
        </div>
      )}
      {trend && (
        <div className="flex items-center gap-1.5 mt-2">
          {trendUp
            ? <TrendingUp className="w-3 h-3" style={{ color: 'var(--color-negative)' }} />
            : <TrendingDown className="w-3 h-3" style={{ color: 'var(--color-positive)' }} />}
          <span className="text-xs font-medium"
            style={{ color: trendUp ? 'var(--color-negative)' : 'var(--color-positive)' }}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}

const CHART_COLORS = {
  ay2019: '#9C27B0',
  ay2020: '#3B82F6',
  ay2021: '#10B981',
  ay2022: '#F59E0B',
  ay2023: '#EF4444',
  ay2024: '#29B5E8',
};

const AY_LABELS: Record<string, string> = {
  ay2019: 'AY 2019', ay2020: 'AY 2020 (COVID)',
  ay2021: 'AY 2021', ay2022: 'AY 2022 (Inflation)',
  ay2023: 'AY 2023', ay2024: 'AY 2024',
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 text-xs shadow-xl"
      style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)' }}>
      <div className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>{label}</div>
      {payload.filter(p => p.value != null).map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--color-text-secondary)' }}>{AY_LABELS[p.name] ?? p.name}:</span>
          <span className="font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            ${p.value.toFixed(1)}M
          </span>
        </div>
      ))}
    </div>
  );
}

const QUICK_ACTIONS = [
  { href: '/chat', icon: MessageSquare, label: 'Ask Cortex a Question', desc: 'AI-powered actuarial analysis', color: 'var(--color-accent)' },
  { href: '/triangles', icon: Triangle, label: 'Explore Triangles', desc: 'View and analyze loss triangles', color: '#3B82F6' },
  { href: '/segments', icon: BarChart3, label: 'Segment Analysis', desc: 'Compare coverage segments', color: '#10B981' },
  { href: '/consistency', icon: CheckCircle, label: 'Consistency Test', desc: 'Apply uniform selection rules', color: 'var(--color-warning)' },
];

export default function DashboardPage() {
  const [kpi, setKpi] = useState(PORTFOLIO_KPIS);
  const [waterfall, setWaterfall] = useState(RESERVE_WATERFALL);
  const [dataSource, setDataSource] = useState<'mock' | 'snowflake'>('mock');

  useEffect(() => {
    fetch('/api/kpis').then(r => r.json()).then(data => {
      if (data.kpis) { setKpi(data.kpis); setDataSource(data.source ?? 'mock'); }
    }).catch(() => {});
    fetch('/api/waterfall').then(r => r.json()).then(data => {
      if (data.waterfall) setWaterfall(data.waterfall);
    }).catch(() => {});
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(123,14,160,0.2)', color: 'var(--color-accent-light)', border: '1px solid rgba(123,14,160,0.3)' }}>
            Eval Date: {kpi.evalDate}
          </div>
          <div className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(41,181,232,0.15)', color: 'var(--color-snowflake)', border: '1px solid rgba(41,181,232,0.25)' }}>
            {dataSource === 'snowflake' ? 'Live Data · Snowflake' : 'Demo Mode · Mock Data'}
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Loss Reserve Portfolio
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Paid Loss Development Summary
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Total Reported Loss"
          value={`$${kpi.totalReportedLoss.toFixed(1)}M`}
          sub="Cumulative paid as of eval date"
        />
        <KPICard
          label="IBNR Estimate"
          value={`$${kpi.ibnrEstimate.toFixed(1)}M`}
          sub="Incurred but not reported"
          trend="+3.9% vs prior"
          trendUp
        />
        <KPICard
          label="Ultimate Estimate"
          value={`$${kpi.ultimateEstimate.toFixed(1)}M`}
          sub="Across all coverages & AYs"
          trend={`+$${kpi.changeFromPrior.toFixed(1)}M vs prior`}
          trendUp
        />
        <KPICard
          label="Active Triangles"
          value={`${kpi.activeTriangles}`}
          sub="Collision, Comp, Liability × Segment"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">

        {/* Development Chart */}
        <div className="col-span-2 rounded-xl p-5"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Collision Paid Loss Development
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Cumulative paid losses ($M) by accident year
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={DEVELOPMENT_TREND_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {Object.entries(CHART_COLORS).map(([key, color]) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false}
                tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={key => <span style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>{AY_LABELS[key]}</span>} />
              {Object.entries(CHART_COLORS).map(([key, color]) => (
                <Area key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2}
                  fill={`url(#grad-${key})`} dot={false} connectNulls={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl p-5 flex flex-col"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Quick Actions
          </h2>
          <div className="space-y-2.5 flex-1">
            {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group"
                style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}22` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{label}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{desc}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Reserve Waterfall + Anomaly Alerts */}
      <div className="grid grid-cols-2 gap-6">

        {/* Waterfall */}
        <div className="rounded-xl p-5"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Reserve Movement — Prior to Current
          </h2>
          <div className="space-y-2">
            {waterfall.map((item, i) => {
              const isBase = item.type === 'base';
              const isTotal = item.type === 'total';
              const isIncrease = item.type === 'increase';
              const color = isBase || isTotal ? 'var(--color-accent-light)'
                : isIncrease ? 'var(--color-negative)' : 'var(--color-positive)';
              const barWidth = isBase || isTotal ? 100
                : Math.abs(item.value) / 70 * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="text-xs w-32 flex-shrink-0 text-right" style={{ color: 'var(--color-text-muted)' }}>
                    {item.name}
                  </div>
                  <div className="flex-1 h-6 rounded-sm overflow-hidden relative"
                    style={{ background: 'var(--color-surface-3)' }}>
                    <div className="h-full rounded-sm transition-all"
                      style={{
                        width: `${Math.min(100, barWidth)}%`,
                        background: color,
                        opacity: isBase || isTotal ? 0.8 : 0.6,
                      }} />
                  </div>
                  <div className="text-xs tabular-nums w-20 flex-shrink-0 font-semibold" style={{ color }}>
                    {isBase || isTotal ? `$${item.value.toFixed(1)}M` : `${item.value > 0 ? '+' : ''}$${item.value.toFixed(1)}M`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Anomaly Alerts */}
        <div className="rounded-xl p-5"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Cortex Anomaly Alerts
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-negative)' }}>
              4 flagged
            </span>
          </div>
          <div className="space-y-2.5">
            {[
              { severity: 'high', ay: '2022 AY', period: '24→36 months', desc: '2.1σ above mean — inflation effect', ratio: '1.152 vs. 1.086 avg' },
              { severity: 'high', ay: '2020 AY', period: '12→24 months', desc: 'COVID catch-up — exclude from avg', ratio: '1.555 vs. 1.364 avg' },
              { severity: 'medium', ay: '2024 AY', period: '12 months paid', desc: '$13.8M above trend expectation', ratio: '$162.4M vs. $148.6M trend' },
              { severity: 'low', ay: '2021 AY', period: '48→60 months', desc: 'Slightly elevated but within bounds', ratio: '1.024 vs. 1.016 expected' },
            ].map((alert, i) => {
              const color = alert.severity === 'high' ? 'var(--color-negative)'
                : alert.severity === 'medium' ? 'var(--color-warning)' : 'var(--color-positive)';
              const bg = alert.severity === 'high' ? 'rgba(239,68,68,0.08)'
                : alert.severity === 'medium' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)';
              return (
                <div key={i} className="rounded-lg px-3 py-2.5 flex items-start gap-2.5"
                  style={{ background: bg, borderLeft: `3px solid ${color}` }}>
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {alert.ay} · {alert.period}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{alert.desc}</div>
                    <div className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{alert.ratio}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/chat?prompt=flag_anomalies"
            className="mt-4 flex items-center gap-2 text-xs font-medium transition-colors"
            style={{ color: 'var(--color-accent-light)' }}>
            <MessageSquare className="w-3.5 h-3.5" />
            Ask Cortex to explain these anomalies
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
