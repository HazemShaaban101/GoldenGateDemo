import { useId } from 'react';
import { motion } from 'framer-motion';
import { Glyph } from '@/components/icons/Glyph';
import type { GlyphId } from '@/model/navigation';

interface NavOrbProps {
  glyph: GlyphId;
  label: string;
  active: boolean;
  alert?: boolean;
  onClick: () => void;
}

/**
 * The top-navigation orb (Frame 486 / Icon.svg): a brushed-metal disc inside a broken ring, grey at
 * rest and gold when its system is open. Hover lifts it and warms the ring; an alert pulses red.
 */
export function NavOrb({ glyph, label, active, alert, onClick }: NavOrbProps) {
  const gid = useId();
  return (
    <motion.button
      onClick={onClick}
      className="group relative flex w-[100px] flex-col items-center outline-none"
      whileHover="hover"
      whileTap={{ scale: 0.96 }}
      initial="rest"
      animate="rest"
      aria-current={active ? 'page' : undefined}
    >
      <div className="relative h-[72px] w-[72px]">
        {/* Broken outer ring */}
        <motion.svg
          viewBox="0 0 72 72"
          className="absolute inset-0"
          variants={{ rest: { rotate: 0 }, hover: { rotate: 45 } }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <defs>
            <linearGradient id={`${gid}-ring`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={active ? '#ffcf66' : '#9a9a9a'} />
              <stop offset="1" stopColor={active ? '#ffaa00' : '#9a9a9a'} stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <circle
            cx="36"
            cy="36"
            r="34"
            fill="none"
            stroke={`url(#${gid}-ring)`}
            strokeWidth="1.2"
            strokeDasharray="30 7.4"
            strokeLinecap="round"
            className="transition-[stroke] duration-300"
          />
        </motion.svg>

        {/* Disc */}
        <motion.div
          className="absolute inset-[8px] overflow-hidden rounded-full"
          variants={{ rest: { y: 0 }, hover: { y: -2 } }}
          style={{
            background: active
              ? 'linear-gradient(180deg, #ffc93d 0%, #f5a000 55%, #c77800 100%)'
              : 'linear-gradient(180deg, #a3a3a3 0%, #6e6e6e 55%, #3d3d3d 100%)',
            boxShadow: active
              ? '0 0 22px rgba(255,170,0,0.55), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -6px 12px rgba(120,60,0,0.45)'
              : '0 2px 10px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -6px 12px rgba(0,0,0,0.35)',
          }}
        >
          {/* Lower-half shading (Figma paint2: white 0 → #323232) */}
          <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(50,50,50,0.28) 100%)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Glyph id={glyph} size={glyph === 'location' ? 28 : 26} color={active ? '#fff7e6' : '#e6e6e6'} />
          </div>
          {!active && (
            <div className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,170,0,0.6), 0 0 18px rgba(255,170,0,0.35)' }} />
          )}
        </motion.div>

        {alert && (
          <>
            <span className="absolute right-[6px] top-[6px] h-3 w-3 rounded-full bg-alarm shadow-[0_0_10px_#ef4444]" />
            <span className="absolute right-[6px] top-[6px] h-3 w-3 rounded-full bg-alarm" style={{ animation: 'gg-pulse-ring 1.4s ease-out infinite' }} />
          </>
        )}
      </div>
      <span className={`mt-[6px] text-[16px] leading-none tracking-[0.2px] ${active ? 'text-white' : 'text-ink-2 group-hover:text-white'}`}>{label}</span>
    </motion.button>
  );
}
