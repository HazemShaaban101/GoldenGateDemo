import { useState } from 'react';
import { Panel } from '@/components/frame/Panel';
import { Glyph } from '@/components/icons/Glyph';
import { CardIcon, LeafIcon, PowerIcon, TimerIcon } from '@/components/icons/UiIcons';
import { Capsule, Hairline, ModeButton, StatusPill, Verdict } from '@/components/controls/Controls';
import { ArcVerdict, DialVerdict } from '@/widgets/Widgets';
import { TrendCard } from '@/widgets/TrendCard';
import { bands, vsAverage } from '@/widgets/verdicts';
import { row } from '@/screens/layout';
import { useSignal } from '@/sim/useSignal';
import { TrendChart } from '@/components/charts/TrendChart';
import { ahuById } from '@/model/galaxyBindings';
import { useGalaxyObject } from '@/gateway/galaxy';
import { clamp } from '@/utils/format';

const fan = <Glyph id="fan" size={20} color="#fff" />;
const wrench = <Glyph id="wrench" size={20} color="#fff" />;

/** HVAC › Chilled Water (design "Chilled Water"). */
export function ChilledWaterScreen() {
  const [l1, r1] = row(208, 358, [1202, 589]);
  const [l2, r2] = row(589, 358, [1202, 589]);
  return (
    <>
      <TrendCard
        frame={l1}
        index={0}
        icon={<CardIcon />}
        title="Supply Vs Return Water Temps"
        subtitle="Temperature Of Water Entering And Exiting Per Hour"
        sim="hvac.chwReturn"
        compare="hvac.chwSupply"
        names={{ actual: 'Return Temp', predictive: 'Supply Temp' }}
        yTitle="Temperature (°C)"
        dayHours={15}
      />
      <Panel frame={r1} index={1} icon={wrench} title="Pump Flow Rate" subtitle="Flow Rate Of Chilled Water Pump">
        <DialVerdict source={{ sim: 'hvac.pumpFlow' }} max={600} unit="m3/hr" verdict={vsAverage(0.03)} />
      </Panel>
      <TrendCard frame={l2} index={2} icon={fan} title="Cooling Load" subtitle="Current Load On Cooling" sim="hvac.coolingLoad" yTitle="Load (TR)" dayHours={15} decimals={0} />
      <Panel frame={r2} index={3} icon={<CardIcon />} title="Difference In Water Temps" subtitle="Difference Between Supply and Return Water Temps Currently">
        <DeltaT />
      </Panel>
    </>
  );
}

function DeltaT() {
  const s = useSignal('hvac.chwSupply').value;
  const r = useSignal('hvac.chwReturn').value;
  const dt = Math.round((r - s) * 10) / 10;
  return (
    <DialVerdict
      source={{ fixed: dt, unit: '°C ΔT' }}
      max={10}
      decimals={1}
      verdict={bands([
        { max: 4, text: 'Low ΔT', tone: 'bad' },
        { max: 5.2, text: 'Good', tone: 'good' },
        { max: 99, text: 'Above Average', tone: 'warn' },
      ])}
    />
  );
}

/** HVAC › Ventillation (design "Ventillation"). */
export function VentilationScreen() {
  const [a, b, c] = row(208, 282, [590, 588, 588]);
  const [t, d] = row(522, 360, [1202, 589]);
  return (
    <>
      <Panel frame={a} index={0} icon={wrench} title="Booster Pumps" subtitle="Connection Status Of Fan">
        <BoosterStatus />
      </Panel>
      <Panel frame={b} index={1} icon={<TimerIcon />} title="Running Time" subtitle="Sector A">
        <ArcVerdict source={{ sim: 'hvac.runtimeA' }} label="Hrs" verdict={bands([{ max: 2400, text: 'Good', tone: 'good' }, { max: 1e9, text: 'Needs Restart', tone: 'warn' }])} />
      </Panel>
      <Panel frame={c} index={2} icon={<TimerIcon />} title="Running Time" subtitle="Sector B">
        <ArcVerdict source={{ sim: 'hvac.runtimeB' }} label="Hrs" verdict={bands([{ max: 2400, text: 'Good', tone: 'good' }, { max: 1e9, text: 'Needs Restart', tone: 'warn' }])} />
      </Panel>
      <TrendCard frame={t} index={3} icon={fan} title="CO2 Levels Per HOUR" subtitle="" sim="hvac.co2" yTitle="Environmental CO2 Levels (ppm)" dayHours={15} decimals={0} />
      <Panel frame={d} index={4} icon={<CardIcon />} title="Airflow Rate" subtitle="Rate Of Air Flowing Through Ventilation System">
        <DialVerdict source={{ sim: 'hvac.airflow' }} unit="%" verdict={bands([{ max: 40, text: 'Low', tone: 'bad' }, { max: 100, text: 'Good', tone: 'good' }])} />
      </Panel>
    </>
  );
}

/** Booster pumps cycle through connecting → online, like a real field device handshake. */
function BoosterStatus() {
  const { value } = useSignal('hvac.airflow', 4000);
  const connecting = Math.floor(value) % 3 === 0;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[20px] pb-[18px]">
      <StatusPill state={connecting ? 'connecting' : 'active'} label={connecting ? 'Connecting' : 'Online'} size={38} />
      <span className="h-px w-[268px] bg-white/15" />
      <Verdict text={connecting ? 'Pending' : 'Running'} tone={connecting ? 'warn' : 'good'} size={36} />
    </div>
  );
}

/** HVAC › Environmental (design "Environmental"). */
export function EnvironmentalScreen() {
  const [a, b] = row(208, 157, [613, 613, 540]);
  const [t] = row(388, 400, 1);
  return (
    <>
      <Panel frame={a} index={0} icon={<LeafIcon />} title="Occupancy" subtitle="Sector A">
        <Occupancy sim="hvac.occupancyA" dense={450} />
      </Panel>
      <Panel frame={b} index={1} icon={<LeafIcon />} title="Occupancy" subtitle="Sector B">
        <Occupancy sim="hvac.occupancyB" dense={300} />
      </Panel>
      <TrendCard frame={t} index={2} icon={<PowerIcon />} title="Total Power Demand" subtitle="Environmental Power Consumption Comparison Graph" sim="hvac.power" yTitle="Demand (MW)" decimals={2} />
    </>
  );
}

function Occupancy({ sim, dense }: { sim: 'hvac.occupancyA' | 'hvac.occupancyB'; dense: number }) {
  const { value } = useSignal(sim, 5000);
  const isDense = value >= dense;
  return (
    <div className="flex h-full items-center justify-center gap-[36px] pb-[6px]">
      <Capsule size={32}>{Math.round(value)} People</Capsule>
      <Hairline height={54} />
      <span className="min-w-[150px]">
        <Verdict text={isDense ? 'Dense' : 'Free'} tone="warn" size={34} />
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------
 * HVAC › AHU — live from the Galaxy (FAHU_001), in the design's "AHU" layout.
 * ------------------------------------------------------------------------------------------- */

export function AhuScreen() {
  const unit = ahuById('FAHU-01')!;
  const obj = useGalaxyObject(unit.galaxy);
  const [a, b] = row(208, 290, 2);
  const [t] = row(523, 355, 1);

  const dpt = obj ? Number(obj.points[unit.attrs.pressure]?.value ?? NaN) : NaN;
  const health = Number.isFinite(dpt) ? clamp(100 - (dpt / unit.filterDirtyPa) * 100, 0, 100) : null;

  return (
    <>
      <Panel frame={a} index={0} icon={fan} title="Average Fan Speed" subtitle={`${unit.id} Supply Fan · VSD feedback × ${unit.ratedFanRpm.toLocaleString()} rpm rated`}>
        <DialVerdict
          source={{ galaxy: unit.id, role: 'vsdFb', map: (v) => (v / 100) * unit.ratedFanRpm, unit: 'rpm' }}
          max={unit.ratedFanRpm}
          verdict={bands([
            { max: 0, text: 'Stopped', tone: 'lavender' },
            { max: unit.ratedFanRpm * 0.9, text: 'Good', tone: 'warn' },
            { max: 1e9, text: 'Full Speed', tone: 'warn' },
          ])}
        />
      </Panel>
      <Panel frame={b} index={1} icon={fan} title="Average Filter Health" subtitle={`${unit.id} Filter · from ΔP (dirty at ${unit.filterDirtyPa} Pa)`}>
        <DialVerdict
          source={{ fixed: health ?? 0, unit: 'avg' }}
          display={() => (health === null ? '—' : `${Math.round(health)}%`)}
          verdict={(v) =>
            health === null
              ? { text: 'No Data', tone: 'lavender' }
              : (v ?? 0) > 60
                ? { text: 'Above Average', tone: 'warn' }
                : (v ?? 0) > 25
                  ? { text: 'Plan Replacement', tone: 'warn' }
                  : { text: 'Replace Filter', tone: 'bad' }
          }
        />
      </Panel>
      <AhuTempTrend frame={t} />
    </>
  );
}

/** Live supply vs outside air temperature, sampled from the Galaxy stream while this app is open. */
function AhuTempTrend({ frame }: { frame: { x: number; y: number; w: number; h: number } }) {
  const unit = ahuById('FAHU-01')!;
  const obj = useGalaxyObject(unit.galaxy);
  const [window, setWindow] = useState<15 | 60>(15);
  const supply = obj?.history[unit.attrs.supplyTemp] ?? [];
  const outside = obj?.history[unit.attrs.outsideTemp] ?? [];
  const since = Date.now() - window * 60_000;
  const s = supply.filter((p) => p.t >= since);
  const byT = new Map(outside.map((p) => [p.t, p.v]));
  const step = Math.max(1, Math.ceil(s.length / 40));
  const data = s
    .filter((_, i) => i % step === 0 || i === s.length - 1)
    .map((p) => ({ label: new Date(p.t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), actual: p.v, predictive: byT.get(p.t) ?? null }));

  return (
    <Panel
      frame={frame}
      index={2}
      icon={fan}
      title="Supply Vs Outside Air Temps"
      subtitle={`${unit.id} · live`}
      actionPlacement="inline"
      action={<ModeButton label={window === 15 ? 'Last 15 min' : 'Last hour'} onClick={() => setWindow(window === 15 ? 60 : 15)} />}
    >
      <div className="absolute inset-x-[18px] bottom-[10px] top-[4px]">
        {data.length > 1 ? (
          <TrendChart data={data} yTitle="Temperature (°C)" xTitle="Time" unit="°C" names={{ actual: 'Supply Air', predictive: 'Outside Air' }} />
        ) : (
          <div className="flex h-full items-center justify-center text-[18px] text-ink-3">
            {obj?.status === 'not_found' ? `${unit.id} is not available.` : 'Collecting live readings… the trend fills in every 5 seconds.'}
          </div>
        )}
      </div>
    </Panel>
  );
}

