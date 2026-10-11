import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from '@/utils/clsx';

export interface PanelProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Next to the title (e.g. a Mode button). */
  action?: ReactNode;
  /** "inline": right after the title block (design's Mode button); "end": far right. */
  actionPlacement?: 'inline' | 'end';
  /** Absolute placement on the 1920×1080 stage, in design pixels. */
  frame?: { x: number; y: number; w: number; h: number };
  className?: string;
  style?: CSSProperties;
  /** Entrance order (staggered fade-up). */
  index?: number;
  children?: ReactNode;
  bodyClassName?: string;
  /** Makes the whole card a link-like target (e.g. KPI → its vertical). */
  onClick?: () => void;
  /** Tooltip for clickable cards. */
  hint?: string;
}

/**
 * The card every dashboard widget sits in: 12px radius, charcoal gradient, top-lit border, icon +
 * 26px title + muted subtitle (exact metrics from the Figma frames).
 */
export function Panel({ title, subtitle, icon, action, actionPlacement = 'end', frame, className, style, index = 0, children, bodyClassName, onClick, hint }: PanelProps) {
  // Narrow cards (the 3D View overlay) use the design's smaller title size so titles never truncate.
  const narrow = (frame?.w ?? 1000) < 420;
  const placement: CSSProperties = frame ? { position: 'absolute', left: frame.x, top: frame.y, width: frame.w, height: frame.h } : {};
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className={clsx('gg-panel flex flex-col', onClick && 'cursor-pointer transition-[box-shadow,transform] duration-200 hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,170,0,0.22)]', className)}
      onClick={onClick}
      title={hint}
      role={onClick ? 'link' : undefined}
      style={{ ...placement, ...style }}
    >
      <header className="relative flex items-start px-[18px] pt-[14px]">
        <div className="min-w-0">
          <h2 className={clsx('flex items-center gap-[10px] font-normal leading-[1.25] text-white', narrow ? 'text-[22px]' : 'text-[26px]')}>
            {icon && <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center text-white">{icon}</span>}
            <span className={narrow ? 'whitespace-nowrap' : 'truncate'}>{title}</span>
          </h2>
          {subtitle && <p className={clsx('mt-[4px] pl-[32px] leading-tight text-[#8f91b5]', narrow ? 'text-[14px]' : 'text-[16px]')}>{subtitle}</p>}
        </div>
        {action && <div className={actionPlacement === 'inline' ? 'ml-[70px] pt-[2px]' : 'ml-auto pl-[16px] pt-[4px]'}>{action}</div>}
      </header>
      <div className={clsx('relative min-h-0 flex-1', bodyClassName)}>{children}</div>
    </motion.section>
  );
}
