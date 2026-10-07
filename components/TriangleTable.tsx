'use client';

import { cn, formatM, formatFactor, getHeatLevel, computeLinkRatios, computeCDFs, getLatestDiagonal } from '@/lib/utils';
import type { LossTriangle } from '@/lib/types';

interface TriangleTableProps {
  triangle: LossTriangle;
  highlightCells?: Array<{ ayIdx: number; devIdx: number; type: 'highlight' | 'anomaly' }>;
  compact?: boolean;
}

export default function TriangleTable({ triangle, highlightCells = [], compact = false }: TriangleTableProps) {
  const { accidentYears, developmentMonths, paidLosses, tailFactor, selectedLDFs } = triangle;
  const linkRatios = computeLinkRatios(triangle);
  const cdfs = computeCDFs(selectedLDFs, tailFactor);
  const diagonal = getLatestDiagonal(triangle);

  const highlightMap = new Map(
    highlightCells.map(c => [`${c.ayIdx}-${c.devIdx}`, c.type])
  );

  const ultimates = diagonal.map(({ ayIdx, devIdx, value }) => {
    const cdf = cdfs[devIdx] ?? 1;
    return { accidentYear: accidentYears[ayIdx], ultimate: value * cdf, reported: value, ibnr: value * cdf - value };
  });

  const totalReported = ultimates.reduce((s, u) => s + u.reported, 0);
  const totalUltimate = ultimates.reduce((s, u) => s + u.ultimate, 0);
  const totalIBNR = totalUltimate - totalReported;

  const cellClass = (ayIdx: number, devIdx: number, value: number | null) => {
    if (value === null) return '';
    const key = `${ayIdx}-${devIdx}`;
    const hl = highlightMap.get(key);
    if (hl === 'highlight') return 'triangle-cell-highlighted';
    if (hl === 'anomaly') return 'triangle-cell-anomaly';
    return `triangle-cell-heat-${getHeatLevel(ayIdx, devIdx, developmentMonths.length)}`;
  };

  const fontSize = compact ? 'text-xs' : 'text-xs';
  const cellPad = compact ? 'px-2 py-1.5' : 'px-3 py-2';

  return (
    <div className="overflow-auto">
      <table className={cn('border-collapse w-full', fontSize)}
        style={{ minWidth: compact ? 600 : 800 }}>

        {/* Header */}
        <thead>
          <tr>
            <th className={cn(cellPad, 'text-left font-semibold sticky left-0 z-10')}
              style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', minWidth: 64 }}>
              AY
            </th>
            {developmentMonths.map(m => (
              <th key={m}
                className={cn(cellPad, 'text-right font-semibold')}
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', minWidth: 70 }}>
                {m}mo
              </th>
            ))}
            {!compact && <>
              <th className={cn(cellPad, 'text-right font-semibold')}
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', borderLeft: '2px solid var(--color-border)', minWidth: 70 }}>
                Rptd
              </th>
              <th className={cn(cellPad, 'text-right font-semibold')}
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', minWidth: 60 }}>
                CDF
              </th>
              <th className={cn(cellPad, 'text-right font-semibold')}
                style={{ background: 'var(--color-surface-3)', color: '#A020C8', borderBottom: '1px solid var(--color-border)', minWidth: 80 }}>
                Ultimate
              </th>
              <th className={cn(cellPad, 'text-right font-semibold')}
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-warning)', borderBottom: '1px solid var(--color-border)', minWidth: 70 }}>
                IBNR
              </th>
            </>}
          </tr>
        </thead>

        <tbody>
          {/* Paid loss rows */}
          {accidentYears.map((ay, ayIdx) => {
            const ult = ultimates[ayIdx];
            return (
              <tr key={ay} className="group">
                <td className={cn(cellPad, 'font-semibold sticky left-0 z-10')}
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  {ay}
                </td>
                {developmentMonths.map((_, devIdx) => {
                  const value = paidLosses[ayIdx][devIdx];
                  return (
                    <td key={devIdx}
                      className={cn(cellPad, 'text-right tabular-nums transition-all duration-100', cellClass(ayIdx, devIdx, value))}
                      style={{
                        color: value !== null ? 'var(--color-text-primary)' : 'transparent',
                        borderBottom: '1px solid var(--color-border-subtle)',
                      }}>
                      {value !== null ? value.toFixed(1) : '—'}
                    </td>
                  );
                })}
                {!compact && <>
                  <td className={cn(cellPad, 'text-right tabular-nums')}
                    style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border-subtle)', borderLeft: '2px solid var(--color-border)' }}>
                    {formatM(ult?.reported ?? null, 1)}
                  </td>
                  <td className={cn(cellPad, 'text-right tabular-nums')}
                    style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    {ult ? ult.ultimate > 0 ? (ult.ultimate / ult.reported).toFixed(3) : '—' : '—'}
                  </td>
                  <td className={cn(cellPad, 'text-right tabular-nums font-semibold')}
                    style={{ color: '#C44FE8', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    {ult ? formatM(ult.ultimate, 1) : '—'}
                  </td>
                  <td className={cn(cellPad, 'text-right tabular-nums')}
                    style={{ color: 'var(--color-warning)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    {ult ? formatM(ult.ibnr, 1) : '—'}
                  </td>
                </>}
              </tr>
            );
          })}

          {/* Spacer */}
          <tr><td colSpan={100} className="py-1" style={{ background: 'var(--color-surface-0)' }} /></tr>

          {/* Link ratio rows */}
          <tr>
            <td colSpan={100} className="px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-3)' }}>
              Age-to-Age Link Ratios
            </td>
          </tr>

          {/* Individual ATA factors */}
          {accidentYears.map((ay, ayIdx) => (
            <tr key={`ata-${ay}`}>
              <td className={cn(cellPad, 'sticky left-0 z-10')}
                style={{ background: 'var(--color-surface-1)', color: 'var(--color-text-muted)', fontSize: 11 }}>
                {ay}
              </td>
              <td /* placeholder for first dev month */
                style={{ background: 'var(--color-surface-1)' }} />
              {linkRatios.map((lr, lrIdx) => {
                const f = lr.factors[ayIdx];
                const isAnom = lr.isAnomalous && lr.anomalyYear === ayIdx;
                return (
                  <td key={lrIdx}
                    className={cn(cellPad, 'text-right tabular-nums')}
                    style={{
                      color: f !== null
                        ? isAnom ? 'var(--color-negative)' : 'var(--color-text-secondary)'
                        : 'transparent',
                      background: 'var(--color-surface-1)',
                      fontSize: 11,
                    }}>
                    {f !== null ? f.toFixed(3) : ''}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Volume-weighted average */}
          {['5yr VWA', '3yr VWA', 'Sel. LDF'].map((rowLabel, rowIdx) => (
            <tr key={rowLabel}
              style={{ background: rowIdx === 2 ? 'rgba(123,14,160,0.12)' : 'var(--color-surface-2)' }}>
              <td className={cn(cellPad, 'sticky left-0 z-10 font-medium')}
                style={{
                  color: rowIdx === 2 ? 'var(--color-accent-light)' : 'var(--color-text-secondary)',
                  background: rowIdx === 2 ? 'rgba(123,14,160,0.15)' : 'var(--color-surface-2)',
                  fontSize: 11,
                }}>
                {rowLabel}
              </td>
              <td style={{ background: rowIdx === 2 ? 'rgba(123,14,160,0.12)' : 'var(--color-surface-2)' }} />
              {linkRatios.map((lr, lrIdx) => {
                const val = rowIdx === 0 ? lr.volumeWeighted5yr
                  : rowIdx === 1 ? lr.volumeWeighted3yr
                  : lr.selected;
                return (
                  <td key={lrIdx}
                    className={cn(cellPad, 'text-right tabular-nums font-medium')}
                    style={{
                      color: rowIdx === 2 ? 'var(--color-accent-light)' : 'var(--color-text-secondary)',
                      fontSize: 11,
                      borderTop: rowIdx === 2 ? '1px solid rgba(123,14,160,0.3)' : undefined,
                    }}>
                    {val.toFixed(3)}
                  </td>
                );
              })}
              {!compact && <td colSpan={4} style={{ background: rowIdx === 2 ? 'rgba(123,14,160,0.12)' : 'var(--color-surface-2)' }} />}
            </tr>
          ))}

          {/* Tail + CDF row */}
          <tr style={{ background: 'var(--color-surface-2)' }}>
            <td className={cn(cellPad, 'sticky left-0 z-10 font-medium')}
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-2)', fontSize: 11 }}>
              CDF to Ult
            </td>
            <td style={{ background: 'var(--color-surface-2)' }} />
            {cdfs.slice(0, developmentMonths.length - 1).map((cdf, i) => (
              <td key={i}
                className={cn(cellPad, 'text-right tabular-nums')}
                style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
                {cdf.toFixed(3)}
              </td>
            ))}
            {!compact && <td colSpan={4} style={{ background: 'var(--color-surface-2)' }} />}
          </tr>
        </tbody>

        {/* Totals footer */}
        {!compact && (
          <tfoot>
            <tr>
              <td className={cn(cellPad, 'font-semibold sticky left-0 z-10')}
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-primary)', borderTop: '2px solid var(--color-border)' }}>
                Total
              </td>
              {developmentMonths.map((_, i) => (
                <td key={i} style={{ background: 'var(--color-surface-3)', borderTop: '2px solid var(--color-border)' }} />
              ))}
              <td className={cn(cellPad, 'text-right font-semibold tabular-nums')}
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)', borderTop: '2px solid var(--color-border)', borderLeft: '2px solid var(--color-border)' }}>
                {formatM(totalReported, 1)}
              </td>
              <td style={{ background: 'var(--color-surface-3)', borderTop: '2px solid var(--color-border)' }} />
              <td className={cn(cellPad, 'text-right font-semibold tabular-nums')}
                style={{ background: 'var(--color-surface-3)', color: '#C44FE8', borderTop: '2px solid var(--color-border)' }}>
                {formatM(totalUltimate, 1)}
              </td>
              <td className={cn(cellPad, 'text-right font-semibold tabular-nums')}
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-warning)', borderTop: '2px solid var(--color-border)' }}>
                {formatM(totalIBNR, 1)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
