import { useLocation, useNavigate } from 'react-router-dom';
import { NavOrb } from '@/components/chrome/NavOrb';
import { Wordmark } from '@/components/chrome/Wordmark';
import { BrandLogos } from '@/components/chrome/BrandLogos';
import { NotificationBell } from '@/components/chrome/NotificationBell';
import { ClockIcon, CloudSunIcon } from '@/components/icons/UiIcons';
import { SYSTEMS, systemPath } from '@/model/navigation';
import { useNow } from '@/sim/clock';
import { useSignal } from '@/sim/useSignal';
import { useScenario } from '@/sim/scenario';

/** Header shared by every screen: wordmark, the nine system orbs, alerts, clock and weather. */
export function TopBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeSystem = pathname === '/' || pathname.startsWith('/site') ? 'site' : pathname.split('/')[1];
  const fireActive = useScenario((s) => s.fire.active);

  return (
    <header className="absolute inset-x-0 top-0 z-30 h-[150px]">
      <div className="absolute left-[72px] top-[22px] flex flex-col items-center gap-[20px]">
        <BrandLogos height={30} withAcs />
        <Wordmark />
      </div>

      <nav className="absolute left-1/2 top-[28px] flex -translate-x-1/2" aria-label="Systems">
        {SYSTEMS.map((s) => (
          <NavOrb
            key={s.id}
            glyph={s.glyph}
            label={s.label}
            active={activeSystem === s.id}
            alert={s.id === 'fire' && fireActive}
            onClick={() => navigate(systemPath(s))}
          />
        ))}
      </nav>

      <div className="absolute right-[52px] top-[50px] flex items-center">
        <NotificationBell />
        <Clock />
        <span className="mx-[20px] h-[56px] w-px bg-gold" aria-hidden />
        <Weather />
      </div>
    </header>
  );
}

function Clock() {
  const now = new Date(useNow(1000));
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const [wd, ...rest] = date.split(', ');
  return (
    <div className="ml-[36px] flex flex-col items-end">
      <div className="flex items-center gap-[12px] text-[17px] tabular-nums text-white">
        <ClockIcon size={22} className="text-white" />
        <span className="min-w-[106px] text-right">{time}</span>
      </div>
      <span className="mt-[8px] text-[16px] tracking-[0.3px] text-ink-3">{`${wd.toUpperCase()}, ${rest.join(', ')}`}</span>
    </div>
  );
}

function Weather() {
  const { value } = useSignal('weather.temp', 60_000, { global: true });
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-[10px] text-[17px] text-white">
        <CloudSunIcon size={26} />
        <span>{value}°C</span>
      </div>
      <span className="mt-[8px] text-[16px] text-ink-3">Cairo, Egypt</span>
    </div>
  );
}
