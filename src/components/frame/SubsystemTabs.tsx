import { NavLink } from 'react-router-dom';
import type { SystemDef } from '@/model/navigation';

const TAB_W = 266;
const MAX_W = 1840; // the bar never reaches the screen edge, however many tabs there are
const SIDE = 47; // horizontal reach of each slanted side (Component 12: 58.8 over 64px, rounded)
const H = 73;

/**
 * The glowing trapezoid tab bar at the bottom of every system screen (Component 12.svg). Its width
 * follows the number of subsystems, exactly like the design's 2-, 4- and 5-tab variants.
 */
export function SubsystemTabs({ system }: { system: SystemDef }) {
  const n = system.subsystems.length;
  // Many tabs (Integration has nine) share the width instead of overflowing it.
  const tabW = Math.min(TAB_W, Math.floor((MAX_W - SIDE * 2 - 12) / n));
  const width = n * tabW + SIDE * 2 + 12;
  const left = (1920 - width) / 2;
  const path = `M0 ${H} L${SIDE + 12} ${9} C${SIDE + 17} ${3} ${SIDE + 25} 0 ${SIDE + 33} 0 H${width - SIDE - 33} C${width - SIDE - 25} 0 ${width - SIDE - 17} ${3} ${width - SIDE - 12} ${9} L${width} ${H}`;

  return (
    <nav className="absolute bottom-0" style={{ left, width, height: H }} aria-label={`${system.label} subsystems`}>
      <svg className="absolute inset-0 overflow-visible" width={width} height={H} aria-hidden>
        <defs>
          <linearGradient id="gg-tab-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b1a3a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#05061a" stopOpacity="0.9" />
          </linearGradient>
          <filter id="gg-tab-glow" x="-10%" y="-60%" width="120%" height="220%">
            <feGaussianBlur stdDeviation="4.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={`${path} Z`} fill="url(#gg-tab-fill)" />
        <path d={path} fill="none" stroke="#ffaa00" strokeWidth="1.4" filter="url(#gg-tab-glow)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pt-[10px]" style={{ paddingLeft: SIDE, paddingRight: SIDE }}>
        {system.subsystems.map((sub) => (
          <NavLink key={sub.id} to={`/${system.id}/${sub.id}`} className="relative flex h-full items-center justify-center outline-none" style={{ width: tabW }}>
            {({ isActive }) => (
                <span
                  className={`${tabW < 230 ? 'text-[21px]' : 'text-[24px]'} tracking-[0.3px] transition-colors duration-300 ${isActive ? 'text-gold' : 'text-white hover:text-gold-soft'}`}
                  style={isActive ? { textShadow: '0 0 14px rgba(255,170,0,0.75), 0 0 2px rgba(255,170,0,0.9)' } : undefined}
                >
                  {sub.label}
                </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
