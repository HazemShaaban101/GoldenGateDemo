import type { CSSProperties, SVGProps } from 'react';
import location from '@/assets/icons/location.svg';
import fire from '@/assets/icons/fire.svg';
import community from '@/assets/icons/community.svg';
import plumbing from '@/assets/icons/plumbing.svg';
import maintenance from '@/assets/icons/maintenance.svg';
import safety from '@/assets/icons/safety.svg';
import building from '@/assets/icons/building.svg';
import flameSmall from '@/assets/icons/flame-small.svg';
import type { GlyphId } from '@/model/navigation';

/**
 * Glyphs from the design's own SVG exports, drawn as CSS masks so they take any color (white on a
 * grey orb, dark on a gold one) without duplicating files. Glyphs the export didn't include are drawn
 * inline in the same visual weight.
 */
const MASKED: Partial<Record<GlyphId | 'building' | 'flame', string>> = {
  location,
  fire,
  community,
  wrench: plumbing,
  gear: maintenance,
  shield: safety,
  building,
  flame: flameSmall,
};

type AnyGlyph = GlyphId | 'building' | 'flame';

export function Glyph({ id, size = 28, color = 'currentColor', style }: { id: AnyGlyph; size?: number; color?: string; style?: CSSProperties }) {
  const src = MASKED[id];
  if (src) {
    return (
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          backgroundColor: color,
          // Quoted: small SVGs are inlined by Vite as data URIs, which contain spaces and quotes.
          WebkitMaskImage: `url("${src}")`,
          maskImage: `url("${src}")`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          ...style,
        }}
      />
    );
  }
  const Inline = INLINE[id as keyof typeof INLINE];
  return Inline ? <Inline width={size} height={size} fill={color} style={style} aria-hidden /> : null;
}

const INLINE = {
  bolt: (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" {...p}>
      <path d="M18.6 2.4 7.4 17.2c-.5.7 0 1.7.9 1.7h6.3l-2.2 10.2c-.2 1 1.1 1.6 1.7.8l11.3-15.1c.5-.7 0-1.7-.9-1.7h-6.2l2.2-9.9c.2-1-1.1-1.6-1.9-.8Z" />
    </svg>
  ),
  meter: (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" {...p}>
      <path d="M16 5C8.8 5 3 10.8 3 18c0 2.9.9 5.5 2.5 7.7.4.5 1 .8 1.6.8h17.8c.6 0 1.2-.3 1.6-.8C28.1 23.5 29 20.9 29 18 29 10.8 23.2 5 16 5Zm-8.5 14.2a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8Zm2.4-6.2a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8ZM16 10.5a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8Zm2.3 10.4a2.9 2.9 0 1 1-3.4-4.3l6.3-5.6c.5-.4 1.2.2.8.8l-3.7 7.4c.2.6.2 1.2 0 1.7Zm6.2-1.7a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8Z" />
    </svg>
  ),
  fan: (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" {...p}>
      <path d="M16 13.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm1.3-1.4c.7-3.6 3-7.8 6.9-7.8 3.2 0 4.4 3.2 3 5.6-1.3 2.3-4.6 3.4-8.4 3.5a4 4 0 0 0-1.5-1.3Zm2.9 4.2c3.5.7 7.8 3 7.8 6.9 0 3.2-3.2 4.4-5.6 3-2.3-1.3-3.4-4.6-3.5-8.4.6-.4 1-.9 1.3-1.5Zm-4.2 2.9c-.7 3.6-3 7.8-6.9 7.8-3.2 0-4.4-3.2-3-5.6 1.3-2.3 4.6-3.4 8.4-3.5.4.6.9 1 1.5 1.3Zm-2.9-4.2C9.5 14 5.3 11.7 5.3 7.8c0-3.2 3.2-4.4 5.6-3 2.3 1.3 3.4 4.6 3.5 8.4a4 4 0 0 0-1.3 1.5Z" />
    </svg>
  ),
  link: (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" {...p}>
      <path d="M13.2 18.8a1.6 1.6 0 0 1 0-2.3l4.2-4.2a1.6 1.6 0 1 1 2.3 2.3l-4.2 4.2a1.6 1.6 0 0 1-2.3 0Zm-2.9-7.9 2.4-2.4a6 6 0 0 1 8.5 8.5l-1.7 1.7a1.6 1.6 0 1 1-2.3-2.3l1.7-1.7a2.8 2.8 0 0 0-4-4l-2.4 2.4a1.6 1.6 0 1 1-2.2-2.2Zm11.4 10.2-2.4 2.4a6 6 0 0 1-8.5-8.5l1.7-1.7a1.6 1.6 0 0 1 2.3 2.3l-1.7 1.7a2.8 2.8 0 0 0 4 4l2.4-2.4a1.6 1.6 0 1 1 2.2 2.2Z" />
    </svg>
  ),
} satisfies Partial<Record<GlyphId, (p: SVGProps<SVGSVGElement>) => React.JSX.Element>>;
