import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import background from '@/assets/renders/background.webp';

export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

const ScaleContext = createContext(1);

/** Current stage scale (screen pixels per design pixel) — needed to convert pointer positions. */
export function useStageScale() {
  return useContext(ScaleContext);
}

/**
 * The platform is laid out on the design's fixed 1920×1080 canvas and scaled to fit any screen,
 * letterboxed, so every screen matches the Figma frames exactly on a video wall, a kiosk or a laptop.
 * The background glow extends to the edges of the real viewport so letterboxing never shows bars.
 */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  const root = useRef<HTMLDivElement>(null);

  // Measure the real viewport box, not just window resize events: moving the window to another
  // monitor, DPI changes and browser zoom can change the space without a resize event.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      setScale(Math.min(w / STAGE_WIDTH, h / STAGE_HEIGHT));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);

  return (
    <div ref={root} className="fixed inset-0 overflow-hidden bg-night-950">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${background})` }}
        aria-hidden
      />
      {/* Living light: the horizon glow of the background breathes very slowly. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[40vh] -translate-y-1/2"
        style={{
          background: 'radial-gradient(ellipse 45% 50% at 50% 50%, rgba(56, 96, 230, 0.22), transparent 70%)',
          animation: 'gg-glow-drift 9s ease-in-out infinite',
        }}
      />
      <ScaleContext.Provider value={scale}>
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {children}
        </div>
      </ScaleContext.Provider>
    </div>
  );
}
