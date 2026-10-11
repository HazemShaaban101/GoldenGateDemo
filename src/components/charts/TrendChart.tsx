import { useId, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSize } from '@/utils/useSize';
import { useStageScale } from '@/stage/Stage';
import { fmt } from '@/utils/format';

export interface TrendPoint {
  label: string;
  actual: number | null;
  predictive?: number | null;
}

interface TrendChartProps {
  data: TrendPoint[];
  yTitle: string;
  xTitle?: string;
  unit?: string;
  decimals?: number;
  /** Legend names; the design's defaults. */
  names?: { actual: string; predictive: string };
  showPredictive?: boolean;
  /** Fixed y range; otherwise a rounded range around the data. */
  yMax?: number;
  yMin?: number;
}

const GOLD = '#ffaa00';
const LAV = '#999bff';
const LAV_LINE = '#dcdcff';

/** A top that splits into 4 round steps (1, 1.5, 2, 2.5, 3, 4, 5, 6 or 8 × 10ⁿ), so every tick label is exact. */
function niceTop(v: number) {
  if (v <= 0) return 4;
  const raw = v / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * pow).find((st) => st >= raw) ?? 10 * pow;
  return step * 4;
}

/**
 * The designs' comparison chart: Actual (gold) over Predictive (lavender), straight segments with
 * dots and gradient-filled areas, 5 y-ticks, hourly x-labels. Draws in on load, morphs between
 * periods, and shows both values under the pointer.
 */
export function TrendChart({ data, yTitle, xTitle = 'Time (hrs)', unit = '', decimals = 1, names = { actual: 'Actual Value', predictive: 'Predictive Value' }, showPredictive = true, yMax, yMin = 0 }: TrendChartProps) {
  const id = useId().replace(/:/g, '');
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const scale = useStageScale();
  const [hover, setHover] = useState<number | null>(null);

  const PAD_L = 34;
  const PAD_R = 90;
  const PAD_T = 44;
  const PAD_B = 34;
  const plotW = Math.max(10, width - PAD_L - PAD_R);
  const plotH = Math.max(10, height - PAD_T - PAD_B);

  const values = data.flatMap((d) => [d.actual, showPredictive ? d.predictive : null]).filter((v): v is number => v !== null && v !== undefined);
  const top = yMax ?? niceTop(Math.max(...values, 0) * 1.08);
  const bottom = yMin;
  const x = (i: number) => PAD_L + (data.length <= 1 ? 0 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => PAD_T + plotH - ((v - bottom) / (top - bottom || 1)) * plotH;

  const line = (key: 'actual' | 'predictive') =>
    data
      .map((d, i) => {
        const v = d[key];
        return v === null || v === undefined ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      })
      .filter(Boolean)
      .map((p, i) => `${i ? 'L' : 'M'}${p}`)
      .join(' ');
  const area = (key: 'actual' | 'predictive') => {
    const pts = data.map((d, i) => ({ i, v: d[key] })).filter((p): p is { i: number; v: number } => p.v !== null && p.v !== undefined);
    if (pts.length < 2) return '';
    return `M${x(pts[0].i)},${PAD_T + plotH} ${pts.map((p) => `L${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')} L${x(pts[pts.length - 1].i)},${PAD_T + plotH} Z`;
  };

  const ticks = useMemo(() => Array.from({ length: 5 }, (_, i) => bottom + ((top - bottom) * i) / 4), [top, bottom]);
  const tickStep = (top - bottom) / 4;
  const tickDecimals = Number.isInteger(Math.round(tickStep * 1e6) / 1e6) ? 0 : Number.isInteger(Math.round(tickStep * 10 * 1e6) / 1e6) ? 1 : 2;
  const every = Math.ceil(data.length / 24);
  const ready = width > 0 && data.length > 1;

  return (
    <div ref={ref} className="relative h-full w-full">
      <span className="absolute left-0 top-[10px] text-[17px] text-white">{yTitle}</span>
      <div className="absolute right-[4px] top-[10px] flex items-center gap-[30px] text-[16px] text-[#b9bad8]">
        {showPredictive && (
          <span className="flex items-center gap-[8px]">
            {names.predictive}: <span className="h-[11px] w-[11px] rounded-full bg-[#e8e8ff]" />
          </span>
        )}
        <span className="flex items-center gap-[8px]">
          {names.actual}: <span className="h-[11px] w-[11px] rounded-full bg-gold" />
        </span>
      </div>

      {ready && (
        <svg
          width={width}
          height={height}
          className="absolute inset-0 overflow-visible"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const px = (e.clientX - rect.left) / scale;
            const i = Math.round(((px - PAD_L) / plotW) * (data.length - 1));
            setHover(i >= 0 && i < data.length ? i : null);
          }}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={LAV} stopOpacity={0.3} />
              <stop offset="1" stopColor={LAV} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`${id}-a`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={GOLD} stopOpacity={0.22} />
              <stop offset="1" stopColor={GOLD} stopOpacity={0} />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <text key={t} x={PAD_L - 12} y={y(t)} fill="#c3c4dc" fontSize={14} textAnchor="end" dominantBaseline="middle">
              {fmt(t, Number.isInteger(Math.round(t * 1e6) / 1e6) ? 0 : tickDecimals)}
            </text>
          ))}
          <line x1={PAD_L} x2={PAD_L} y1={PAD_T - 8} y2={PAD_T + plotH} stroke="rgba(255,255,255,0.25)" />
          <line x1={PAD_L} x2={PAD_L + plotW + 44} y1={PAD_T + plotH + 8} y2={PAD_T + plotH + 8} stroke="rgba(255,255,255,0.25)" />

          {showPredictive && <motion.path d={area('predictive')} fill={`url(#${id}-p)`} initial={{ opacity: 0 }} animate={{ opacity: 1, d: area('predictive') }} transition={{ duration: 0.8 }} />}
          <motion.path d={area('actual')} fill={`url(#${id}-a)`} initial={{ opacity: 0 }} animate={{ opacity: 1, d: area('actual') }} transition={{ duration: 0.8 }} />

          {showPredictive && (
            <motion.path
              d={line('predictive')}
              fill="none"
              stroke={LAV_LINE}
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, d: line('predictive') }}
              transition={{ pathLength: { duration: 1.4, ease: 'easeInOut' }, d: { duration: 0.6 } }}
            />
          )}
          <motion.path
            d={line('actual')}
            fill="none"
            stroke={GOLD}
            strokeWidth={2.2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, d: line('actual') }}
            transition={{ pathLength: { duration: 1.4, ease: 'easeInOut', delay: 0.15 }, d: { duration: 0.6 } }}
            style={{ filter: 'drop-shadow(0 0 4px rgba(255,170,0,0.45))' }}
          />

          {data.map((d, i) => (
            <g key={i}>
              {showPredictive && d.predictive !== null && d.predictive !== undefined && (
                <motion.circle r={0} cx={x(i)} cy={y(d.predictive)} initial={{ r: 0 }} animate={{ r: hover === i ? 5.5 : 3.8, cx: x(i), cy: y(d.predictive) }} transition={{ delay: 0.4 + i * 0.02 }} fill="#b9baff" stroke="#fff" strokeWidth={1.2} />
              )}
              {d.actual !== null && (
                <motion.circle r={0} cx={x(i)} cy={y(d.actual)} initial={{ r: 0 }} animate={{ r: hover === i ? 5.5 : 3.8, cx: x(i), cy: y(d.actual) }} transition={{ delay: 0.5 + i * 0.02 }} fill={GOLD} stroke="#ffe0a0" strokeWidth={1} />
              )}
            </g>
          ))}

          {data.map((d, i) =>
            i % every === 0 ? (
              <text key={d.label + i} x={x(i)} y={PAD_T + plotH + 30} fill="#c3c4dc" fontSize={14} textAnchor="middle">
                {d.label}
              </text>
            ) : null,
          )}
          <text x={width} y={PAD_T + plotH + 31} fill="#fff" fontSize={17} textAnchor="end">
            {xTitle}
          </text>

          {hover !== null && data[hover] && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD_T} y2={PAD_T + plotH} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 4" />
              <g transform={`translate(${Math.min(x(hover) + 12, width - 200)}, ${PAD_T + 6})`}>
                <rect width={188} height={showPredictive ? 74 : 52} rx={8} fill="rgba(10,12,40,0.92)" stroke="rgba(255,255,255,0.18)" />
                <text x={12} y={20} fill="#fff" fontSize={13}>
                  {data[hover].label}
                </text>
                <text x={12} y={42} fill={GOLD} fontSize={14}>
                  Actual: {fmt(data[hover].actual, decimals)} {unit}
                </text>
                {showPredictive && (
                  <text x={12} y={62} fill={LAV_LINE} fontSize={14}>
                    Predictive: {fmt(data[hover].predictive, decimals)} {unit}
                  </text>
                )}
              </g>
            </g>
          )}
        </svg>
      )}
    </div>
  );
}
