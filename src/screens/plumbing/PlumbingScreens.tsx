import { Panel } from '@/components/frame/Panel';
import { CardIcon, PowerIcon } from '@/components/icons/UiIcons';
import { Glyph } from '@/components/icons/Glyph';
import { DialVerdict, PillStacked } from '@/widgets/Widgets';
import { TrendCard } from '@/widgets/TrendCard';
import { vsAverage } from '@/widgets/verdicts';
import { row } from '@/screens/layout';
import { useSignal } from '@/sim/useSignal';
import type { SignalId } from '@/sim/catalog';

/** Plumbing › Domestic Irrigation. The irrigation pump really does run at dawn and dusk only. */
export function DomesticScreen() {
  const [a, b] = row(208, 292, [587, 562, 617], { gap: 25 });
  const [t] = row(524, 425, 1);
  const irrigation = useSignal('plumbing.irrigationFlow', 5000).value;
  const domestic = useSignal('plumbing.domesticFlow', 5000).value;
  return (
    <>
      <Panel frame={a} index={0} icon={<CardIcon />} title="Domestic Pump Status" subtitle="Current Domestic Station Activity">
        <PillStacked pill={domestic > 3 ? 'active' : 'inactive'} verdict={{ text: 'Good', tone: 'warn' }} />
      </Panel>
      <Panel frame={b} index={1} icon={<CardIcon />} title="Irrigation Pump Status" subtitle="Current Irrigation Status Activity">
        <PillStacked pill={irrigation > 4 ? 'active' : 'inactive'} verdict={{ text: 'Good', tone: 'warn' }} />
      </Panel>
      <TrendCard frame={t} index={2} icon={<PowerIcon />} title="Water Flow" subtitle="Current rate Of Domestic Water Flow  Per Hour" sim="plumbing.domesticFlow" yTitle="Flow (m3/h)" />
    </>
  );
}

const PUMP_GROUPS: { title: string; sim: SignalId }[] = [
  { title: 'Booster Pumps', sim: 'pumps.booster' },
  { title: 'Cooling Pumps', sim: 'pumps.cooling' },
  { title: 'Fire Pumps', sim: 'pumps.fire' },
  { title: 'Hot Water Pumps', sim: 'pumps.hotWater' },
  { title: 'Submersible Pumps', sim: 'pumps.submersible' },
];

/** Plumbing › Pumps: share of each pump group in line (3 over 2, as in the design). */
export function PumpsScreen() {
  const frames = [...row(208, 308, 3), ...row(540, 308, 2)];
  const wrench = <Glyph id="wrench" size={20} color="#fff" />;
  return (
    <>
      {PUMP_GROUPS.map((p, i) => (
        <Panel key={p.sim} frame={frames[i]} index={i} icon={wrench} title={p.title} subtitle="Current Number Of Pumps In line">
          <DialVerdict source={{ sim: p.sim }} unit="nb" verdict={p.sim === 'pumps.fire' ? () => ({ text: 'Ready', tone: 'good' }) : vsAverage(0.05)} display={(v) => `${Math.round(v)}%`} />
        </Panel>
      ))}
    </>
  );
}
