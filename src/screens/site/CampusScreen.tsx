import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import campus from '@/assets/renders/campus.webp';
import { Panel } from '@/components/frame/Panel';
import { CardIcon, CalendarIcon, FilterLinesIcon, LeafIcon, ParkingIcon, PowerIcon } from '@/components/icons/UiIcons';
import { ArcGauge, BarMeter, DialGauge } from '@/components/gauges/Gauges';
import { AnimatedNumber } from '@/components/gauges/AnimatedNumber';
import { PairedBarChart } from '@/components/charts/PairedBarChart';
import { KeyValues, KpiBody } from '@/widgets/Widgets';
import { BUILDINGS, type Building } from '@/model/site';
import { useSignal } from '@/sim/useSignal';
import { signal } from '@/sim/catalog';
import { useNow } from '@/sim/clock';
import { useScenario } from '@/sim/scenario';
import { fmt } from '@/utils/format';
import { useHomeUi } from '@/components/chrome/ScopeBar';

const PARKING_CAPACITY = 1850;

/**
 * 3D View — the whole site at night. The render settles in, the KPI panels slide in from the edges
 * (as in the prototype), and every building lights up gold on hover. A02 opens its building view.
 */
export default function CampusScreen() {
  const overlays = useHomeUi((st) => st.kpis);
  const [hover, setHover] = useState<Building | null>(null);
  const [zooming, setZooming] = useState<Building | null>(null);
  const navigate = useNavigate();
  const fire = useScenario((s) => s.fire.active);

  const open = (b: Building) => {
    if (!b.detailed) return;
    setZooming(b);
    void import('@/screens/site/BuildingScreen');
    setTimeout(() => navigate(`/site/${b.id}`), 480);
  };

  return (
    <>
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.08, opacity: 0 }}
        animate={zooming ? { scale: 2.6, opacity: 0, x: (960 - zooming.anchor.x) * 2.6, y: (560 - zooming.anchor.y) * 2.6 } : { scale: 1, opacity: 1, x: 0, y: 0 }}
        transition={zooming ? { duration: 0.5, ease: [0.55, 0, 0.8, 0.2] } : { duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: zooming ? `${zooming.anchor.x}px ${zooming.anchor.y}px` : '50% 55%' }}
      >
        <img
          src={campus}
          alt="Golden Gate site"
          draggable={false}
          className="absolute"
          style={{
            left: 323,
            top: 219,
            width: 1301,
            height: 732,
            maskImage: 'radial-gradient(ellipse 58% 60% at 52% 52%, #000 55%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 58% 60% at 52% 52%, #000 55%, transparent 80%)',
          }}
        />
        <svg className="absolute inset-0" width={1920} height={1080}>
          {BUILDINGS.map((b) => {
            const lit = hover?.id === b.id;
            const alarm = fire && (b.id === 'a01' || b.id === 'a02');
            return (
              <path
                key={b.id}
                d={b.outline}
                onMouseEnter={() => setHover(b)}
                onMouseLeave={() => setHover((h) => (h?.id === b.id ? null : h))}
                onClick={() => open(b)}
                // Keyboard: Tab through the buildings (focus shows the same highlight and card as hover).
                role="button"
                tabIndex={0}
                aria-label={b.detailed ? `Open building ${b.label}` : `Building ${b.label}`}
                onFocus={() => setHover(b)}
                onBlur={() => setHover((h) => (h?.id === b.id ? null : h))}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  open(b);
                }}
                fill={alarm ? '#ef4444' : '#ffaa00'}
                fillOpacity={alarm ? 0.35 : lit ? 0.3 : 0.001}
                stroke={alarm ? '#ef4444' : '#ffaa00'}
                strokeOpacity={alarm || lit ? 1 : 0}
                strokeWidth={2}
                strokeLinejoin="round"
                style={{ cursor: b.detailed ? 'pointer' : 'help', outline: 'none', transition: 'fill-opacity .25s, stroke-opacity .25s', animation: alarm ? 'gg-alarm-blink 1s infinite' : undefined }}
              />
            );
          })}
        </svg>
        <AnimatePresence>{hover && !zooming && <BuildingTip b={hover} />}</AnimatePresence>
      </motion.div>

      <AnimatePresence>{overlays && !zooming && <KpiOverlay />}</AnimatePresence>

    </>
  );
}

function BuildingTip({ b }: { b: Building }) {
  const occ = useSignal('community.visitors', 5000).value;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute z-20 w-[250px] -translate-x-1/2 -translate-y-full rounded-[10px] bg-white px-[14px] py-[10px] font-[family-name:var(--font-plain)] text-night-900 shadow-2xl"
      style={{ left: b.anchor.x, top: b.anchor.y - 16 }}
    >
      <p className="flex items-center justify-between text-[16px] font-semibold">
        {b.label}
        <span className="rounded-full bg-[#eceeff] px-[8px] py-[1px] text-[11px] font-medium text-[#6b6fd6]">{b.floors.length} floors</span>
      </p>
      <p className="text-[12px] text-[#6b6e8a]">{b.use}</p>
      <p className="mt-[6px] text-[12px] text-[#3a3d5c]">~{fmt(occ * (b.detailed ? 0.18 : 0.1))} people on site</p>
      <p className="mt-[4px] text-[12px] font-medium" style={{ color: b.detailed ? '#d98c00' : '#9a9cc0' }}>
        {b.detailed ? 'Click to open building ›' : 'Detailed model available for A02'}
      </p>
    </motion.div>
  );
}

/* ---- KPI overlay (Frame 488) ------------------------------------------------------------------ */

function KpiOverlay() {
  const navigate = useNavigate();
  const go = (to: string) => () => navigate(to);
  return (
    <motion.div className="pointer-events-none absolute inset-0 [&>section]:pointer-events-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.4 }}>
      <Panel frame={{ x: 52, y: 201, w: 302, h: 245 }} index={4} icon={<CardIcon />} onClick={go('/site/a02/gf?system=elevators')} hint="Open elevators on the floor plan" title="Elevator Performance" subtitle="Comparative Analysis of Car Occupancy">
        <Elevators />
      </Panel>
      <Panel frame={{ x: 52, y: 471, w: 302, h: 395 }} index={5} icon={<FilterLinesIcon />} onClick={go('/hvac/environmental')} hint="Open HVAC › Environmental" title="Air Quality Index" subtitle="Environmental Health & Filtration System">
        <AirQuality />
      </Panel>
      <Panel frame={{ x: 1566, y: 196, w: 302, h: 256 }} index={6} icon={<CalendarIcon />} onClick={go('/metering/water')} hint="Open Metering › Water" title="Weekly Consumption" subtitle="Comparative Analysis">
        <WeeklyConsumption />
      </Panel>
      <Panel frame={{ x: 1566, y: 477, w: 302, h: 390 }} index={7} icon={<CardIcon />} onClick={go('/electric/transformers')} hint="Open Electric › Transformers" title="Power Infrastructure" subtitle="Main High-Voltage Transformer Load">
        <PowerInfra />
      </Panel>
      <Panel frame={{ x: 52, y: 891, w: 339, h: 155 }} index={8} icon={<PowerIcon />} onClick={go('/metering/energy')} hint="Open Metering › Energy" title="Total Site Power" subtitle="Measures the live electrical load">
        <KpiBody
          source={{ sim: 'site.power' }}
          decimals={1}
          unit="mw"
          note={(v, p) => {
            const d = v !== null && p ? Math.round(((v - p) / p) * 100) : 0;
            return `${d >= 0 ? '+' : ''}${d}% from avg`;
          }}
        />
      </Panel>
      <Panel frame={{ x: 424, y: 891, w: 370, h: 155 }} index={9} icon={<CardIcon />} onClick={go('/hvac/chilled-water')} hint="Open HVAC › Chilled Water" title="HVAC Efficiency" subtitle="Monitors the Coefficient of Performance (COP)">
        <KpiBody source={{ sim: 'site.hvacCop' }} decimals={1} unit="COP" note={(v) => ((v ?? 0) >= 4.5 ? 'Optimal Range' : 'Below Optimal')} />
      </Panel>
      <Panel frame={{ x: 827, y: 891, w: 338, h: 155 }} index={10} icon={<ParkingIcon />} onClick={go('/security/parking')} hint="Open Security › Parking" title="Parking Spots" subtitle="Real-time tracking of vacant spots">
        <KpiBody source={{ sim: 'site.parkingFree' }} decimals={0} unit="Free" note={(v) => `${Math.round((1 - (v ?? 0) / PARKING_CAPACITY) * 100)}% Occupancy`} />
      </Panel>
      <Panel frame={{ x: 1198, y: 891, w: 670, h: 155 }} index={11} icon={<LeafIcon />} onClick={go('/metering/analytics')} hint="Open Metering › Energy Analytics" title="Sustainability Index">
        <Sustainability />
      </Panel>
    </motion.div>
  );
}

function Elevators() {
  const avg = useSignal('elevator.avg', 4000).value;
  const peak = useSignal('elevator.peak', 4000).value;
  return (
    <div className="px-[16px]">
      <BarMeter width={196} rows={[{ label: 'AVG', value: avg, color: '#8f92ff' }, { label: 'Peak', value: peak, color: '#ffaa00' }]} />
    </div>
  );
}

function AirQuality() {
  const co2 = useSignal('env.co2', 4000).value;
  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-center">
        <DialGauge value={co2} min={0} max={800} unit="PPM" size={172} />
      </div>
      <span className="mx-[16px] mb-[10px] h-px bg-white/15" />
      <KeyValues
        dense
        rows={[
          { label: 'Relative Humidity', source: { sim: 'env.humidity' }, unit: '%' },
          { label: 'Oxygen Level', source: { sim: 'env.oxygen' }, decimals: 1, unit: '%' },
          { label: 'PM Index', source: { sim: 'env.pm25' }, unit: 'µg/m³' },
          { label: 'Filter Status', text: 'Clean' },
        ]}
      />
    </div>
  );
}

function WeeklyConsumption() {
  const now = useNow(60_000);
  const days = Array.from({ length: 7 }, (_, i) => {
    const t = now - (6 - i) * 86_400_000;
    return {
      label: new Date(t).toLocaleDateString('en-US', { weekday: 'short' }),
      a: signal('water.irrigation.daily').actual(t),
      b: signal('water.consumption.daily').actual(t),
    };
  });
  return (
    <div className="absolute inset-x-[14px] bottom-[8px] top-[4px]">
      <PairedBarChart data={days} names={{ a: 'Irrigation', b: 'Water' }} unit="m³" compact />
    </div>
  );
}

function PowerInfra() {
  const kpi = useSignal('power.transformerKpi', 4000).value;
  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-center">
        <ArcGauge value={kpi} size={210} />
      </div>
      <span className="mx-[16px] mb-[10px] h-px bg-white/15" />
      <KeyValues
        dense
        rows={[
          { label: 'Active Power', source: { sim: 'power.active' }, unit: 'kw' },
          { label: 'Reactive Power', source: { sim: 'power.reactive' }, unit: 'kVAR' },
          { label: 'Peak Today', text: `${Math.round(Math.max(kpi, 88))}%` },
          { label: 'Status', text: kpi < 90 ? 'Optimal' : 'High Load' },
        ]}
      />
    </div>
  );
}

function Sustainability() {
  const energy = useSignal('site.energyToday', 10_000);
  const water = useSignal('site.waterToday', 10_000);
  return (
    <div className="flex h-full items-center px-[18px]">
      <SustainPart label="Energy Consumption" value={energy.value} unit="MWh" decimals={1} pct={88} color="#ffaa00" />
      <span className="mx-[28px] h-[70px] w-px bg-white/15" />
      <SustainPart label="Water Consumption" value={water.value} unit="m³" decimals={0} pct={24} color="#999bff" />
    </div>
  );
}

function SustainPart({ label, value, unit, decimals, pct, color }: { label: string; value: number; unit: string; decimals: number; pct: number; color: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-1 items-center">
      <div>
        <p className="text-[15px] text-[#8f91b5]">{label}</p>
        <p className="mt-[4px] leading-none text-white">
          <span className="text-[50px] font-medium">
            <AnimatedNumber value={value} decimals={decimals} />
          </span>
          <span className="ml-[6px] text-[20px] text-[#8f91b5]">{unit}</span>
        </p>
      </div>
      <svg width={80} height={80} viewBox="0 0 80 80" className="ml-auto">
        <circle cx={40} cy={40} r={36} fill="#2a2a38" />
        <circle cx={40} cy={40} r={r} fill="none" stroke="#3b3b4d" strokeWidth={5} />
        <motion.circle
          cx={40}
          cy={40}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 1.2, delay: 0.8 }}
          style={{ filter: `drop-shadow(0 0 5px ${color})` }}
        />
        <text x={40} y={38} fill="#fff" fontSize={16} textAnchor="middle">
          {pct}%
        </text>
        <text x={40} y={52} fill="#9a9a9a" fontSize={9} textAnchor="middle">
          Total
        </text>
      </svg>
    </div>
  );
}
