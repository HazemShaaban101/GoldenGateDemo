import aveva from '@/assets/logos/aveva.svg';
import schneider from '@/assets/logos/schneider-electric.webp';
import acsHorizontal from '@/assets/logos/acs-horizontal.webp';
import acsStacked from '@/assets/logos/acs-stacked.webp';

const glow = 'drop-shadow(0 0 10px rgba(153,155,255,0.18))';

function Divider({ height }: { height: number }) {
  return <span aria-hidden className="block w-px bg-gradient-to-b from-transparent via-white/30 to-transparent" style={{ height }} />;
}

/** AVEVA | Schneider Electric, optionally followed by | Advanced Control Systems. */
export function BrandLogos({ height = 30, withAcs = false }: { height?: number; withAcs?: boolean }) {
  const gap = Math.round(height * 0.5);
  return (
    <div className="flex items-center" style={{ gap }}>
      <img src={aveva} alt="AVEVA" draggable={false} style={{ height: height * 0.74, filter: glow }} />
      <Divider height={height * 1.15} />
      <img src={schneider} alt="Schneider Electric" draggable={false} style={{ height, filter: glow }} />
      {withAcs && (
        <>
          <Divider height={height * 1.15} />
          <img src={acsHorizontal} alt="Advanced Control Systems" draggable={false} style={{ height: height * 1.02, filter: glow }} />
        </>
      )}
    </div>
  );
}

/** "Delivered by" credit with the stacked Advanced Control Systems mark. */
export function DeliveredBy() {
  return (
    <div className="flex flex-col items-start">
      <span className="mb-[14px] text-[12px] font-semibold tracking-[2.4px] text-ink-3">DELIVERED BY</span>
      <img
        src={acsStacked}
        alt="Advanced Control Systems"
        draggable={false}
        className="h-[150px]"
        style={{ filter: 'drop-shadow(0 0 22px rgba(232,72,85,0.22))' }}
      />
    </div>
  );
}
