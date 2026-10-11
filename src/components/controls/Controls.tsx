import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from '@/components/icons/UiIcons';
import { Glyph } from '@/components/icons/Glyph';
import { clsx } from '@/utils/clsx';

/* ---------------------------------------------------------------------------------------------
 * Small controls from the design system. Each mirrors one of the exported components.
 * ------------------------------------------------------------------------------------------- */

/** "Mode ›" — cycles a chart between day / week / month (gold-outlined pill). */
export function ModeButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex h-[40px] items-center gap-[14px] rounded-[10px] border border-gold/90 bg-night-900/40 px-[16px] text-[20px] text-white transition-all hover:bg-gold/10 hover:shadow-[0_0_14px_rgba(255,170,0,0.35)]"
      title="Change period"
    >
      <span>Mode</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-[13px] text-gold-soft">
          {label}
        </motion.span>
      </AnimatePresence>
      <ChevronRight size={18} className="transition-transform group-hover:translate-x-[2px]" />
    </button>
  );
}

export type Tone = 'good' | 'warn' | 'bad' | 'neutral' | 'lavender';

export const TONE_COLOR: Record<Tone, string> = {
  good: '#2ecf6e',
  warn: '#ffaa00',
  bad: '#ef4444',
  neutral: '#ffffff',
  lavender: '#999bff',
};

/** The big colored assessment text ("Good", "Above Average", "Needs Restart"). */
export function Verdict({ text, tone, size = 32 }: { text: string; tone: Tone; size?: number }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={text}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25 }}
        className="block text-center leading-none tracking-[0.5px]"
        style={{ fontSize: size, color: TONE_COLOR[tone], textShadow: tone === 'neutral' ? undefined : `0 0 18px ${TONE_COLOR[tone]}40` }}
      >
        {text}
      </motion.span>
    </AnimatePresence>
  );
}

/** Rounded capsule with a value inside ("Alarms", "156 People", "Yesterday At 16:32"). */
export function Capsule({ children, tone, size = 30, glow }: { children: ReactNode; tone?: 'alarm'; size?: number; glow?: boolean }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center whitespace-nowrap rounded-full px-[34px] leading-none text-white',
        tone === 'alarm' ? 'border-2 border-alarm' : 'border border-white/15',
      )}
      style={{
        fontSize: size,
        height: size * 1.8,
        background: tone === 'alarm' ? 'rgba(80,20,40,0.45)' : 'linear-gradient(180deg, rgba(60,62,110,0.55), rgba(30,32,70,0.55))',
        boxShadow: tone === 'alarm' || glow ? '0 0 16px rgba(239,68,68,0.55), inset 0 0 10px rgba(239,68,68,0.3)' : 'inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {children}
    </span>
  );
}

export type PillState = 'active' | 'inactive' | 'connecting' | 'alarm' | 'normal';

/** Status pill (Status.svg): Active / Inactive / Connecting, plus alarm and normal variants. */
export function StatusPill({ state, label, size = 30 }: { state: PillState; label?: string; size?: number }) {
  const text = label ?? { active: 'Active', inactive: 'Inactive', connecting: 'Connecting', alarm: 'Alarm', normal: 'Normal' }[state];
  const color = { active: '#2ecf6e', inactive: '#d9dbff', connecting: '#ffffff', alarm: '#ef4444', normal: '#2ecf6e' }[state];
  return (
    <span
      className="inline-flex items-center gap-[18px] rounded-full px-[30px] leading-none"
      style={{
        height: size * 1.75,
        fontSize: size,
        color,
        background:
          state === 'active' || state === 'normal'
            ? 'rgba(46,207,110,0.12)'
            : state === 'alarm'
              ? 'rgba(239,68,68,0.14)'
              : 'linear-gradient(180deg, rgba(60,62,110,0.55), rgba(30,32,70,0.55))',
        border: `1px solid ${state === 'active' || state === 'normal' ? 'rgba(46,207,110,0.35)' : state === 'alarm' ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.14)'}`,
      }}
    >
      {state === 'connecting' ? (
        <span className="flex items-center gap-[5px]">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block rounded-full bg-lavender-soft"
              style={{ width: i === 2 ? 11 : 9, height: i === 2 ? 14 : 9 }}
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </span>
      ) : (
        <span className="relative flex h-[14px] w-[14px] items-center justify-center">
          <span className="h-[14px] w-[14px] rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
          {(state === 'active' || state === 'alarm') && (
            <span className="absolute h-[14px] w-[14px] rounded-full" style={{ background: color, animation: 'gg-pulse-ring 1.8s ease-out infinite' }} />
          )}
        </span>
      )}
      {text}
    </span>
  );
}

/** The fire-drill button (SimulateFireAlarmButton.svg): idle → "Alarm Triggered". */
export function AlarmButton({ triggered, onTrigger, onReset }: { triggered: boolean; onTrigger: () => void; onReset: () => void }) {
  return (
    <div className="flex items-center gap-[14px]">
      <motion.button
        onClick={triggered ? undefined : onTrigger}
        whileTap={{ scale: 0.97 }}
        className="flex h-[70px] items-center gap-[14px] rounded-[10px] border px-[24px] text-[24px]"
        style={
          triggered
            ? {
                background: 'linear-gradient(90deg, #d9744f, #a44a3c)',
                borderColor: '#ff6b6b',
                color: '#fff',
                boxShadow: '0 0 24px rgba(239,68,68,0.55)',
                cursor: 'default',
              }
            : { background: 'linear-gradient(180deg, #5b3534, #3d2527)', borderColor: '#ef4444', color: '#ff6b6b', boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }
        }
      >
        <Glyph id="flame" size={22} color={triggered ? '#fff' : '#ff6b6b'} />
        {triggered ? 'Alarm Triggered' : 'Simulate Fire Alarm'}
        {triggered && <span className="ml-[6px] h-[14px] w-[14px] rounded-full bg-[#ff3b30]" style={{ animation: 'gg-alarm-blink 0.9s ease-in-out infinite', boxShadow: '0 0 10px #ff3b30' }} />}
      </motion.button>
      <AnimatePresence>
        {triggered && (
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            onClick={onReset}
            className="h-[70px] rounded-[10px] border border-white/20 bg-white/5 px-[22px] text-[20px] text-ink-2 hover:border-ok hover:text-ok"
          >
            Reset Alarm
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Small switch used on device tags (MVD toggles). */
export function Toggle({ on, onChange, label }: { on: boolean; onChange?: (on: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.(!on);
      }}
      className="relative h-[16px] w-[28px] shrink-0 rounded-full transition-colors"
      style={{ background: on ? '#2ecf6e' : '#2b2d3a', border: on ? 'none' : '1.5px solid #555' }}
    >
      <motion.span className="absolute top-[2px] h-[12px] w-[12px] rounded-full bg-white" animate={{ left: on ? 14 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 32 }} />
    </button>
  );
}

/** Vertical gold hairline separating a gauge from its verdict (Frame 506). */
export function Hairline({ height = 190, color = 'rgba(255,255,255,0.12)' }: { height?: number; color?: string }) {
  return <span aria-hidden className="block w-px" style={{ height, background: color }} />;
}
