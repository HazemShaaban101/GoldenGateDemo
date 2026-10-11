import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from '@/utils/clsx';

export interface Column<T> {
  key: string;
  header: string;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
}

/**
 * The platform's table: transparent rows on the glass card, hairline separators, a lavender header,
 * and new rows sliding in from the top (live logs). Rows are keyed so only new ones animate.
 */
export function DataTable<T>({ columns, rows, rowKey, highlight, onRowClick, dense }: { columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; highlight?: (r: T) => 'alarm' | 'warn' | null; onRowClick?: (r: T) => void; dense?: boolean }) {
  const template = columns.map((c) => (typeof c.width === 'number' ? `${c.width}px` : (c.width ?? '1fr'))).join(' ');
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid shrink-0 gap-[12px] border-b border-white/10 px-[16px] pb-[10px] text-[13px] tracking-[0.4px] text-lavender" style={{ gridTemplateColumns: template }}>
        {columns.map((c) => (
          <span key={c.key} style={{ textAlign: c.align ?? 'left' }}>
            {c.header}
          </span>
        ))}
      </div>
      <div className="gg-scroll min-h-0 flex-1">
        <AnimatePresence initial={false}>
          {rows.map((r) => {
            const hl = highlight?.(r);
            return (
              <motion.div
                key={rowKey(r)}
                layout="position"
                initial={{ opacity: 0, y: -12, backgroundColor: 'rgba(255,170,0,0.18)' }}
                animate={{ opacity: 1, y: 0, backgroundColor: hl === 'alarm' ? 'rgba(239,68,68,0.10)' : hl === 'warn' ? 'rgba(255,170,0,0.07)' : 'rgba(0,0,0,0)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={clsx('grid items-center gap-[12px] border-b border-white/[0.06] px-[16px] text-[15px] text-ink-2', dense ? 'py-[7px]' : 'py-[10px]', onRowClick && 'cursor-pointer hover:bg-white/[0.04]')}
                style={{ gridTemplateColumns: template }}
              >
                {columns.map((c) => (
                  <span key={c.key} className="min-w-0 truncate" style={{ textAlign: c.align ?? 'left' }}>
                    {c.render(r)}
                  </span>
                ))}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export type TagTone = 'good' | 'bad' | 'warn' | 'info' | 'idle';

const TAG: Record<TagTone, { bg: string; fg: string; border: string }> = {
  good: { bg: 'rgba(46,207,110,0.12)', fg: '#2ecf6e', border: 'rgba(46,207,110,0.35)' },
  bad: { bg: 'rgba(239,68,68,0.14)', fg: '#ff6b6b', border: 'rgba(239,68,68,0.5)' },
  warn: { bg: 'rgba(255,170,0,0.12)', fg: '#ffb42a', border: 'rgba(255,170,0,0.45)' },
  info: { bg: 'rgba(153,155,255,0.14)', fg: '#b9baff', border: 'rgba(153,155,255,0.45)' },
  idle: { bg: 'rgba(255,255,255,0.05)', fg: '#9a9cc0', border: 'rgba(255,255,255,0.14)' },
};

/** Small status tag for tables and lists (the Status.svg pills, shrunk). */
export function Tag({ tone, children, dot = true }: { tone: TagTone; children: ReactNode; dot?: boolean }) {
  const t = TAG[tone];
  return (
    <span className="inline-flex items-center gap-[6px] rounded-full border px-[10px] py-[2px] text-[12px] leading-[18px]" style={{ background: t.bg, color: t.fg, borderColor: t.border }}>
      {dot && <span className="h-[6px] w-[6px] rounded-full" style={{ background: t.fg, boxShadow: `0 0 6px ${t.fg}` }} />}
      {children}
    </span>
  );
}

/** Thin horizontal meter (health, occupancy, progress). */
export function Meter({ value, tone = 'info', width = 120 }: { value: number; tone?: TagTone; width?: number }) {
  const color = TAG[tone].fg;
  return (
    <span className="inline-flex items-center gap-[8px]">
      <span className="relative inline-block h-[6px] overflow-hidden rounded-full bg-white/10" style={{ width }}>
        <motion.span className="absolute inset-y-0 left-0 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 0.8 }} />
      </span>
      <span className="w-[38px] text-right text-[13px] tabular-nums text-ink-2">{Math.round(value)}%</span>
    </span>
  );
}

export const clockTime = (t: number) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
