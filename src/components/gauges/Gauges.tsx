import { useId } from 'react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from '@/components/gauges/AnimatedNumber';
import { clamp } from '@/utils/format';

const GOLD = '#ffaa00';

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

const arcPath = (cx: number, cy: number, r: number, from: number, to: number) => {
  const s = polar(cx, cy, r, from);
  const e = polar(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
};

/** The metallic knob shared by every round gauge (Figma paint21–25: radial #0C0C0C→#262626, ring, inner). */
function Knob({ cx, cy, scale = 1, id }: { cx: number; cy: number; scale?: number; id: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-outer`} cx="50%" cy="50%" r="50%">
          <stop offset="0.64" stopColor="#0c0c0c" />
          <stop offset="1" stopColor="#262626" />
        </radialGradient>
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#606060" />
          <stop offset="1" stopColor="#2b2b2b" />
        </linearGradient>
        <linearGradient id={`${id}-ringStroke`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c4c4c4" />
          <stop offset="1" stopColor="#d7d7d7" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-inner`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#323232" />
          <stop offset="0.23" stopColor="#393939" />
          <stop offset="1" stopColor="#6a6a6a" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={76 * scale} fill={`url(#${id}-outer)`} />
      <circle cx={cx} cy={cy} r={65.7 * scale} fill={`url(#${id}-ring)`} stroke={`url(#${id}-ringStroke)`} strokeWidth={0.6} />
      <circle cx={cx} cy={cy} r={56 * scale} fill={`url(#${id}-inner)`} />
    </g>
  );
}

export interface DialGaugeProps {
  value: number | null;
  min?: number;
  max?: number;
  unit?: string;
  decimals?: number;
  size?: number;
  /** Override the big number (e.g. "115"), defaults to the formatted value. */
  display?: string;
}

/**
 * The tick-ring dial used across the designs: 270° sweep, minor ticks every 2%, labelled majors
 * every 20%, a gold arc sweeping up to the value around the metallic knob.
 */
export function DialGauge({ value, min = 0, max = 100, unit = '', decimals = 0, size = 250, display }: DialGaugeProps) {
  const id = useId().replace(/:/g, '');
  const cx = 130;
  const cy = 130;
  const START = -135;
  const SWEEP = 270;
  // Tick labels on a tidy scale: the range is widened to the next 'nice' step so labels read 0, 300, 600…
  const rawStep = (max - min) / 5;
  const pow = 10 ** Math.floor(Math.log10(Math.max(rawStep, 1e-9)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rawStep) ?? rawStep;
  const top = min + step * 5;
  const labels = Array.from({ length: 6 }, (_, i) => min + step * i);
  const fmtLabel = (v: number) => (Math.abs(v) >= 10_000 ? `${Math.round(v / 1000)}k` : String(Math.round(v * 10) / 10));
  const frac = value === null ? 0 : clamp((value - min) / (top - min), 0, 1);

  return (
    // Shrinks (never grows) to fit a shorter card: max-height resolves against the card body.
    <svg viewBox="0 0 260 260" width={size} height={size} style={{ maxHeight: '100%', width: 'auto', height: 'auto' }} role="img" aria-label={`${value ?? '—'} ${unit}`}>
      <defs>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ticks */}
      {Array.from({ length: 51 }, (_, i) => {
        const deg = START + (SWEEP * i) / 50;
        const major = i % 5 === 0;
        const a = polar(cx, cy, 86, deg);
        const b = polar(cx, cy, major ? 96 : 91, deg);
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff" strokeWidth={major ? 1.2 : 0.8} strokeLinecap="round" opacity={major ? 1 : 0.85} />;
      })}
      {labels.map((v, i) => {
        const deg = START + (SWEEP * i) / 5;
        const p = polar(cx, cy, 110, deg);
        return (
          <text key={i} x={p.x} y={p.y} fill="#fff" fontSize={13} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${deg} ${p.x} ${p.y})`}>
            {fmtLabel(v)}
          </text>
        );
      })}

      <Knob cx={cx} cy={cy} id={id} />

      {/* track + value arc */}
      <path d={arcPath(cx, cy, 79, START, START + SWEEP)} fill="none" stroke={GOLD} strokeOpacity={0.18} strokeWidth={2.4} strokeLinecap="round" />
      <motion.path
        d={arcPath(cx, cy, 79, START, START + SWEEP)}
        fill="none"
        stroke={GOLD}
        strokeWidth={2.6}
        strokeLinecap="round"
        filter={`url(#${id}-glow)`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: Math.max(0.001, frac) }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* needle tip */}
      <motion.circle
        r={4}
        cx={polar(cx, cy, 79, START + SWEEP * frac).x}
        cy={polar(cx, cy, 79, START + SWEEP * frac).y}
        fill={GOLD}
        filter={`url(#${id}-glow)`}
        initial={{ cx: polar(cx, cy, 79, START).x, cy: polar(cx, cy, 79, START).y }}
        animate={{ cx: polar(cx, cy, 79, START + SWEEP * frac).x, cy: polar(cx, cy, 79, START + SWEEP * frac).y }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />

      <text x={cx} y={cy - 4} fill="#fff" fontSize={36} textAnchor="middle" dominantBaseline="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {display ?? (value === null ? '—' : <AnimatedNumber value={value} decimals={decimals} />)}
      </text>
      <text x={cx} y={cy + 26} fill="#9a9a9a" fontSize={14} textAnchor="middle">
        {unit}
      </text>
    </svg>
  );
}

/** "Main Kpi" arc (Frame 488 / Electric): a thick gold horseshoe with a darker remainder. */
export function ArcGauge({ value, label = 'Main Kpi', decimals = 1, size = 300, suffix = '%' }: { value: number | null; label?: string; decimals?: number; size?: number; suffix?: string }) {
  const id = useId().replace(/:/g, '');
  const cx = 150;
  const cy = 150;
  const frac = value === null ? 0 : clamp(value / 100, 0, 1);
  const START = -100;
  const SWEEP = 200;
  return (
    <svg viewBox="0 0 300 210" width={size} height={(size * 210) / 300} role="img" aria-label={`${label} ${value ?? '—'}${suffix}`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b97700" />
          <stop offset="0.5" stopColor="#f0a400" />
          <stop offset="1" stopColor="#ffb62e" />
        </linearGradient>
      </defs>
      <path d={arcPath(cx, cy, 118, START, START + SWEEP)} fill="none" stroke="#4a3434" strokeWidth={30} strokeLinecap="butt" opacity={0.85} />
      <path d={arcPath(cx, cy, 118, START, START + SWEEP)} fill="none" stroke="#7d5a3a" strokeOpacity={0.35} strokeWidth={31} />
      <motion.path
        d={arcPath(cx, cy, 118, START, START + SWEEP)}
        fill="none"
        stroke={`url(#${id}-g)`}
        strokeWidth={30}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: Math.max(0.001, frac) }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ filter: 'drop-shadow(0 0 10px rgba(255,170,0,0.35))' }}
      />
      <text x={cx} y={cy + 8} fill="#c9caff" fontSize={52} textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value === null ? '—' : <AnimatedNumber value={value} decimals={decimals} />}
        {suffix}
      </text>
      <text x={cx} y={cy + 44} fill="#8f91b5" fontSize={17} textAnchor="middle">
        {label}
      </text>
    </svg>
  );
}

/** Knob with a multi-colored ring (Energy Usage Per System). */
export function RingGauge({ segments, value, unit, size = 200 }: { segments: { value: number; color: string }[]; value: string; unit: string; size?: number }) {
  const id = useId().replace(/:/g, '');
  const cx = 110;
  const cy = 110;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  const GAP = 2.5;
  return (
    <svg viewBox="0 0 220 220" width={size} height={size}>
      <g transform="translate(-20 -20)">
        <Knob cx={130} cy={130} id={id} scale={1.02} />
      </g>
      {segments.map((s, i) => {
        const from = (acc / total) * 360;
        acc += s.value;
        const to = (acc / total) * 360 - GAP;
        return (
          <motion.path
            key={i}
            d={arcPath(cx, cy, 86, from, Math.max(from + 0.5, to))}
            fill="none"
            stroke={s.color}
            strokeWidth={6}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1 + i * 0.12 }}
            style={{ filter: `drop-shadow(0 0 4px ${s.color})` }}
          />
        );
      })}
      <text x={cx} y={cy - 2} fill="#fff" fontSize={34} textAnchor="middle" dominantBaseline="middle">
        {value}
      </text>
      <text x={cx} y={cy + 24} fill="#9a9a9a" fontSize={13} textAnchor="middle">
        {unit}
      </text>
    </svg>
  );
}

/** Knob inside a thick glowing ring holding a count (Ongoing Alarm Count). */
export function CountRing({ value, alarm, size = 150 }: { value: number; alarm?: boolean; size?: number }) {
  const id = useId().replace(/:/g, '');
  const color = alarm ? '#ef4444' : GOLD;
  return (
    <svg viewBox="0 0 160 160" width={size} height={size}>
      <g transform="translate(-50 -50)">
        <Knob cx={130} cy={130} id={id} scale={0.9} />
      </g>
      <circle cx={80} cy={80} r={70} fill="none" stroke={color} strokeWidth={7} style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
        {alarm && <animate attributeName="stroke-opacity" values="1;0.35;1" dur="1s" repeatCount="indefinite" />}
      </circle>
      <text x={80} y={82} fill="#fff" fontSize={40} textAnchor="middle" dominantBaseline="middle">
        {value}
      </text>
    </svg>
  );
}

/** Horizontal AVG/Peak bars with a percent grid (Elevator Performance). */
export function BarMeter({ rows, width = 260 }: { rows: { label: string; value: number; color: string }[]; width?: number }) {
  return (
    <div className="relative" style={{ width: width + 62 }}>
      <div className="absolute bottom-[26px] left-[62px] top-0" style={{ width }}>
        {[20, 40, 60, 80, 100].map((p) => (
          <span key={p} className="absolute top-0 h-full border-l border-dashed border-white/25" style={{ left: `${p}%` }} />
        ))}
        <span className="absolute left-0 top-0 h-full border-l border-white/40" />
      </div>
      <div className="relative flex flex-col gap-[14px] pt-[34px]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center">
            <span className="w-[62px] text-[16px] text-white">{r.label}</span>
            <div className="relative h-[10px] rounded-full bg-[#3a3a48]" style={{ width }}>
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: r.color, boxShadow: `0 0 10px ${r.color}88` }}
                initial={{ width: 0 }}
                animate={{ width: `${clamp(r.value, 0, 100)}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="relative mt-[34px] flex text-[12px] text-ink-3" style={{ marginLeft: 62, width }}>
        {[20, 40, 60, 80, 100].map((p) => (
          <span key={p} className="absolute -translate-x-1/2" style={{ left: `${p}%` }}>
            {p}%
          </span>
        ))}
      </div>
    </div>
  );
}
