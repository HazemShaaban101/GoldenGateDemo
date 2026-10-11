import { useId, useState } from 'react';
import { motion } from 'framer-motion';
import { useSize } from '@/utils/useSize';
import { fmt } from '@/utils/format';

export interface BarGroup {
  label: string;
  a: number;
  b: number;
}

interface PairedBarChartProps {
  data: BarGroup[];
  names: { a: string; b: string };
  yTitle?: string;
  xTitle?: string;
  unit?: string;
  compact?: boolean;
  /** Leave room on the right like the design (bars don't span the full width). */
  fillWidth?: number;
}

const A = '#aeb0ff';
const B = '#ffaa00';

/**
 * Two thin bars per group (lavender vs gold) with bright caps fading to the axis, as in "Energy Usage
 * Per Building" and "Weekly Consumption". Hovering a group shows both values.
 */
export function PairedBarChart({ data, names, yTitle, xTitle, unit = '', compact, fillWidth = 1 }: PairedBarChartProps) {
  const id = useId().replace(/:/g, '');
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const PAD_L = compact ? 22 : 34;
  const PAD_T = yTitle ? 46 : 30;
  const PAD_B = compact ? 22 : 30;
  const plotW = Math.max(10, (width - PAD_L - (xTitle ? 90 : 10)) * fillWidth);
  const plotH = Math.max(10, height - PAD_T - PAD_B);
  const max = Math.max(1, ...data.flatMap((d) => [d.a, d.b])) * 1.1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const top = Math.ceil(max / pow) * pow;
  const slot = plotW / Math.max(1, data.length);
  const barW = compact ? 7 : 13;
  const y = (v: number) => PAD_T + plotH - (v / top) * plotH;

  return (
    <div ref={ref} className="relative h-full w-full">
      {yTitle && <span className="absolute left-0 top-[10px] text-[17px] text-white">{yTitle}</span>}
      <div className={`absolute right-[4px] flex items-center gap-[26px] text-[#b9bad8] ${compact ? 'top-0 text-[12px]' : 'top-[10px] text-[16px]'}`}>
        <span className="flex items-center gap-[7px]">
          <span className="h-[10px] w-[10px] rounded-full" style={{ background: compact ? A : '#e8e8ff' }} />
          {names.a}
        </span>
        <span className="flex items-center gap-[7px]">
          <span className="h-[10px] w-[10px] rounded-full bg-gold" />
          {names.b}
        </span>
      </div>

      {width > 0 && (
        <svg width={width} height={height} className="absolute inset-0 overflow-visible">
          <defs>
            <linearGradient id={`${id}-a`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={A} />
              <stop offset="1" stopColor={A} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={B} />
              <stop offset="1" stopColor={B} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          {Array.from({ length: 5 }, (_, i) => (top * i) / 4).map((t) => (
            <text key={t} x={PAD_L - 10} y={y(t)} fill="#c3c4dc" fontSize={compact ? 9 : 14} textAnchor="end" dominantBaseline="middle">
              {fmt(t)}
            </text>
          ))}
          <line x1={PAD_L} x2={PAD_L} y1={PAD_T - 6} y2={PAD_T + plotH} stroke="rgba(255,255,255,0.25)" />
          <line x1={PAD_L} x2={width - 4} y1={PAD_T + plotH + 4} y2={PAD_T + plotH + 4} stroke="rgba(255,255,255,0.25)" />

          {data.map((d, i) => {
            const cx = PAD_L + slot * i + slot / 2;
            return (
              <g key={d.label + i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <rect x={cx - slot / 2} y={PAD_T} width={slot} height={plotH} fill="transparent" />
                {([
                  ['a', d.a, -barW - 3],
                  ['b', d.b, 3],
                ] as const).map(([k, v, dx]) => (
                  <g key={k}>
                    <motion.rect
                      x={cx + dx}
                      width={barW}
                      rx={barW / 2}
                      fill={`url(#${id}-${k})`}
                      initial={{ y: PAD_T + plotH, height: 0 }}
                      animate={{ y: y(v), height: PAD_T + plotH - y(v) }}
                      transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      opacity={hover === null || hover === i ? 1 : 0.45}
                    />
                    <motion.rect
                      x={cx + dx + 1.5}
                      width={barW - 3}
                      height={2}
                      rx={1}
                      fill="#fff"
                      initial={{ y: PAD_T + plotH }}
                      animate={{ y: y(v) + 2 }}
                      transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      style={{ filter: `drop-shadow(0 0 4px ${k === 'a' ? A : B})` }}
                    />
                  </g>
                ))}
                <text x={cx} y={PAD_T + plotH + (compact ? 16 : 24)} fill="#c3c4dc" fontSize={compact ? 9 : 13} textAnchor="middle">
                  {d.label}
                </text>
                {hover === i && (
                  <g transform={`translate(${Math.min(cx + 16, width - 170)}, ${Math.max(PAD_T, y(Math.max(d.a, d.b)) - 10)})`} pointerEvents="none">
                    <rect width={160} height={56} rx={8} fill="rgba(10,12,40,0.92)" stroke="rgba(255,255,255,0.18)" />
                    <text x={10} y={22} fill={A} fontSize={13}>
                      {names.a}: {fmt(d.a)} {unit}
                    </text>
                    <text x={10} y={42} fill={B} fontSize={13}>
                      {names.b}: {fmt(d.b)} {unit}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {xTitle && (
            <text x={width} y={PAD_T + plotH + 36} fill="#fff" fontSize={17} textAnchor="end">
              {xTitle}
            </text>
          )}
        </svg>
      )}
    </div>
  );
}
