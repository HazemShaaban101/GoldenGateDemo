import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import campus from '@/assets/renders/campus.webp';
import buildingA02 from '@/assets/renders/building-a02.webp';
import siteMapImg from '@/assets/renders/site-map.webp';
import floorplan from '@/assets/renders/floorplan.webp';
import { Panel } from '@/components/frame/Panel';
import { CameraIcon, CardIcon, DoorIcon, GateIcon, ParkingIcon } from '@/components/icons/UiIcons';
import { AnimatedNumber } from '@/components/gauges/AnimatedNumber';
import { CameraTile, type CameraSpec } from '@/components/media/CameraTile';
import { DataTable, Meter, Tag, clockTime, type TagTone } from '@/components/data/DataTable';
import { DialVerdict, KpiBody } from '@/widgets/Widgets';
import { TrendCard } from '@/widgets/TrendCard';
import { bands } from '@/widgets/verdicts';
import { row, stack } from '@/screens/layout';
import { pickFrom, useEventCountToday, useEventStream, type StreamSpec } from '@/sim/events';
import { useSignal } from '@/sim/useSignal';
import { useNow } from '@/sim/clock';
import { rand01 } from '@/sim/noise';
import { fmt } from '@/utils/format';

/* =================================================================================================
 * CCTV
 * ================================================================================================= */

const CAMERAS: CameraSpec[] = [
  { id: 'CAM-01', name: 'Main Entrance Plaza', zone: 'Entrances', src: buildingA02, focus: [55, 72], zoom: 1.7, pan: [-0.04, 0], status: 'online', motion: [[40, 55, 7, 16], [62, 60, 6, 14]] },
  { id: 'CAM-02', name: 'Boulevard East', zone: 'Perimeter', src: campus, focus: [74, 62], zoom: 2.3, pan: [0.03, 0.01], status: 'online', motion: [[30, 50, 8, 10]] },
  { id: 'CAM-03', name: 'Parking P1 Overview', zone: 'Parking', src: siteMapImg, focus: [28, 52], zoom: 2.6, pan: [0.02, -0.02], status: 'online', motion: [[50, 40, 6, 8]] },
  { id: 'CAM-04', name: 'A02 GF Corridor', zone: 'Retail', src: floorplan, focus: [45, 62], zoom: 2.4, pan: [-0.02, 0.02], status: 'online' },
  { id: 'CAM-05', name: 'Food Court Terrace', zone: 'Retail', src: buildingA02, focus: [42, 58], zoom: 2.3, pan: [0.03, 0], status: 'online', motion: [[55, 48, 7, 18]] },
  { id: 'CAM-06', name: 'Service Road', zone: 'Service', src: campus, focus: [28, 72], zoom: 2.6, pan: [0.02, 0.02], status: 'online' },
  { id: 'CAM-07', name: 'Rooftop Garden A02', zone: 'Rooftop', src: buildingA02, focus: [72, 32], zoom: 2.0, pan: [-0.03, 0.01], status: 'online' },
  { id: 'CAM-08', name: 'Gate G2 · LPR', zone: 'Parking', src: siteMapImg, focus: [82, 40], zoom: 3.0, pan: [0.01, 0.02], status: 'online', motion: [[45, 45, 10, 10]] },
  { id: 'CAM-09', name: 'Loading Bay 3', zone: 'Service', src: campus, focus: [15, 40], zoom: 2.8, pan: [0, 0], status: 'offline' },
  { id: 'CAM-10', name: 'West Pavilions', zone: 'Perimeter', src: campus, focus: [40, 40], zoom: 2.4, pan: [0.02, 0], status: 'online' },
  { id: 'CAM-11', name: 'A02 Lobby', zone: 'Entrances', src: floorplan, focus: [70, 40], zoom: 2.6, pan: [-0.02, 0], status: 'online', motion: [[35, 50, 6, 14]] },
  { id: 'CAM-12', name: 'Parking P2 Ramp', zone: 'Parking', src: siteMapImg, focus: [55, 60], zoom: 2.8, pan: [0.02, 0.01], status: 'online' },
];

const DETECTIONS: StreamSpec<{ cam: CameraSpec; kind: string }> = {
  id: 'cctv.detections',
  peakPerHour: 70,
  profile: 'occupancy',
  make: (_, rnd) => ({ cam: pickFrom(CAMERAS.filter((c) => c.status === 'online'), rnd(1)), kind: pickFrom(['Person', 'Person', 'Vehicle', 'Loitering', 'Crowd forming', 'Line crossing'], rnd(2)) }),
};

export function CctvScreen() {
  const [selected, setSelected] = useState(CAMERAS[0].id);
  const main = CAMERAS.find((c) => c.id === selected)!;
  const others = CAMERAS.filter((c) => c.id !== selected && c.status === 'online').slice(0, 5);
  const detections = useEventStream(DETECTIONS, 8);
  const online = CAMERAS.filter((c) => c.status === 'online').length;
  const zones = [...new Set(CAMERAS.map((c) => c.zone))];

  const big = { x: 487, y: 208, w: 900, h: 506 };
  const side = stack(1412, 456, 208, [240, 241]);
  const bottom = row(739, 239, 3, { x: 487, width: 1381 });

  return (
    <>
      <Panel frame={{ x: 52, y: 208, w: 410, h: 770 }} index={0} icon={<CameraIcon />} title="Cameras" subtitle={`${online} of ${CAMERAS.length} online · recording`}>
        <div className="gg-scroll absolute inset-x-[10px] bottom-[250px] top-[4px]">
          {zones.map((z) => (
            <div key={z} className="mb-[10px]">
              <p className="px-[8px] pb-[4px] text-[12px] tracking-[1px] text-lavender">{z.toUpperCase()}</p>
              {CAMERAS.filter((c) => c.zone === z).map((c) => (
                <button
                  key={c.id}
                  onClick={() => c.status === 'online' && setSelected(c.id)}
                  className={`flex w-full items-center gap-[10px] rounded-[8px] px-[8px] py-[6px] text-left text-[15px] transition-colors ${c.id === selected ? 'bg-gold/15 text-gold' : 'text-ink-2 hover:bg-white/5'}`}
                >
                  <span className="h-[8px] w-[8px] rounded-full" style={{ background: c.status === 'online' ? '#2ecf6e' : '#ef4444', boxShadow: `0 0 6px ${c.status === 'online' ? '#2ecf6e' : '#ef4444'}` }} />
                  <span className="w-[62px] font-mono text-[12px] text-ink-4">{c.id}</span>
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="absolute inset-x-[16px] bottom-[12px] h-[228px] border-t border-white/10 pt-[10px]">
          <p className="mb-[6px] text-[13px] tracking-[0.5px] text-lavender">Recent detections</p>
          {detections.slice(0, 7).map((e) => (
            <motion.button key={e.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} onClick={() => setSelected(e.data.cam.id)} className="flex w-full items-center justify-between py-[3px] text-left text-[13px] hover:text-white">
              <span className="text-ink-2">
                <span className={e.data.kind.includes('Crowd') || e.data.kind.includes('Loiter') ? 'text-gold' : 'text-white'}>{e.data.kind}</span> · {e.data.cam.id}
              </span>
              <span className="font-mono text-[11px] text-ink-4">{clockTime(e.t)}</span>
            </motion.button>
          ))}
        </div>
      </Panel>

      <motion.div key={main.id} className="absolute" style={{ left: big.x, top: big.y, width: big.w, height: big.h }} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
        <CameraTile cam={main} large selected />
      </motion.div>
      {[...side, ...bottom].map((f, i) =>
        others[i] ? (
          <motion.div key={others[i].id} className="absolute" style={{ left: f.x, top: f.y, width: f.w, height: f.h }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.06 }}>
            <CameraTile cam={others[i]} onClick={() => setSelected(others[i].id)} />
          </motion.div>
        ) : null,
      )}
    </>
  );
}

/* =================================================================================================
 * Access control
 * ================================================================================================= */

const DOORS = ['A02 Staff Entrance', 'A02 Server Room', 'A02 Office Lobby L2', 'B01 Loading Dock', 'B01 Cinema Backstage', 'C01 Cold Storage', 'Admin Block Main', 'Security Control Room', 'Car Park Lift Lobby', 'Roof Access A02'];
const PEOPLE = ['Ahmed Samir', 'Mona Farouk', 'Omar Khaled', 'Nour Hassan', 'Youssef Adel', 'Salma Tarek', 'Karim Mostafa', 'Laila Ibrahim', 'Hassan Nabil', 'Rania Magdy', 'Tamer Fathy', 'Dina Ashraf', 'Contractor #2231', 'Visitor Pass V-118'];

type AccessResult = 'Granted' | 'Denied' | 'Forced' | 'Held Open';
const ACCESS: StreamSpec<{ door: string; who: string; cred: string; result: AccessResult }> = {
  id: 'access.events',
  peakPerHour: 220,
  profile: 'office',
  make: (_, rnd) => {
    const r = rnd(3);
    const result: AccessResult = r < 0.9 ? 'Granted' : r < 0.975 ? 'Denied' : r < 0.99 ? 'Held Open' : 'Forced';
    return { door: pickFrom(DOORS, rnd(1)), who: pickFrom(PEOPLE, rnd(2)), cred: pickFrom(['Card', 'Card', 'Mobile', 'PIN', 'Face'], rnd(4)), result };
  },
};

const RESULT_TONE: Record<AccessResult, TagTone> = { Granted: 'good', Denied: 'warn', 'Held Open': 'warn', Forced: 'bad' };

export function AccessScreen() {
  const log = useEventStream(ACCESS, 30);
  const granted = useEventCountToday(ACCESS, (e) => e.result === 'Granted');
  const denied = useEventCountToday(ACCESS, (e) => e.result === 'Denied');
  const alarms = useEventCountToday(ACCESS, (e) => e.result === 'Forced' || e.result === 'Held Open');
  const kpis = row(208, 150, 4);
  const [left, right] = row(383, 595, [1180, 611]);
  const [trend, doors] = stack(right.x, right.w, 383, [285, 285]);
  const door = <DoorIcon />;

  return (
    <>
      <Panel frame={kpis[0]} index={0} icon={door} title="Doors Online" subtitle="Controllers reporting">
        <KpiBody source={{ fixed: 212 }} decimals={0} unit="/ 214" note={<Tag tone="warn">2 offline</Tag>} />
      </Panel>
      <Panel frame={kpis[1]} index={1} icon={<CardIcon />} title="Access Granted" subtitle="Today">
        <KpiBody source={{ fixed: granted }} decimals={0} unit="swipes" note="Across all doors" />
      </Panel>
      <Panel frame={kpis[2]} index={2} icon={<CardIcon />} title="Access Denied" subtitle="Today">
        <KpiBody source={{ fixed: denied }} decimals={0} unit="attempts" note={<Tag tone={denied > 40 ? 'warn' : 'good'}>{denied > 40 ? 'Above normal' : 'Normal'}</Tag>} />
      </Panel>
      <Panel frame={kpis[3]} index={3} icon={door} title="Door Alarms" subtitle="Forced / held open today">
        <KpiBody source={{ fixed: alarms }} decimals={0} unit="events" note={<Tag tone={alarms ? 'bad' : 'good'}>{alarms ? 'Review' : 'Clear'}</Tag>} />
      </Panel>

      <Panel frame={left} index={4} icon={door} title="Live Access Log" subtitle="Every badge, PIN and face event as it happens">
        <div className="absolute inset-x-[4px] bottom-[10px] top-[8px]">
          <DataTable
            rows={log}
            rowKey={(e) => e.key}
            highlight={(e) => (e.data.result === 'Forced' ? 'alarm' : e.data.result !== 'Granted' ? 'warn' : null)}
            columns={[
              { key: 't', header: 'Time', width: 110, render: (e) => <span className="font-mono text-[13px] text-ink-3">{clockTime(e.t)}</span> },
              { key: 'door', header: 'Door', render: (e) => e.data.door },
              { key: 'who', header: 'Cardholder', render: (e) => <span className="text-white">{e.data.who}</span> },
              { key: 'cred', header: 'Credential', width: 110, render: (e) => e.data.cred },
              { key: 'res', header: 'Result', width: 130, render: (e) => <Tag tone={RESULT_TONE[e.data.result]}>{e.data.result}</Tag> },
            ]}
          />
        </div>
      </Panel>
      <TrendCard frame={trend} index={5} icon={<CardIcon />} title="Entries Per Hour" sim="security.entries" yTitle="Entries" decimals={0} dayHours={12} />
      <Panel frame={doors} index={6} icon={door} title="Door Status" subtitle="Critical doors">
        <DoorStatus />
      </Panel>
    </>
  );
}

function DoorStatus() {
  const now = useNow(10_000);
  const states = DOORS.slice(0, 6).map((d, i) => {
    const r = rand01(Math.floor(now / 60_000) * 10 + i, 77);
    const s: [string, TagTone] = i === 1 ? ['Locked', 'good'] : r < 0.08 ? ['Held Open', 'warn'] : r < 0.4 ? ['Unlocked', 'info'] : ['Locked', 'good'];
    return { d, s };
  });
  return (
    <div className="gg-scroll absolute inset-x-[16px] bottom-[10px] top-[6px]">
      {states.map(({ d, s }) => (
        <div key={d} className="flex items-center justify-between border-b border-white/[0.06] py-[8px] text-[15px] text-ink-2">
          {d}
          <Tag tone={s[1]}>{s[0]}</Tag>
        </div>
      ))}
    </div>
  );
}

/* =================================================================================================
 * Parking & LPR
 * ================================================================================================= */

const AR_LETTERS = ['أ', 'ب', 'ج', 'د', 'ر', 'س', 'ص', 'ط', 'ع', 'ف', 'ق', 'ل', 'م', 'ن', 'هـ', 'و', 'ى'];
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const CAPACITY = 1850;
const LEVELS = [
  { id: 'B2', label: 'Basement B2', cap: 520, bias: 1.05 },
  { id: 'B1', label: 'Basement B1', cap: 540, bias: 1.0 },
  { id: 'SA', label: 'Surface A', cap: 460, bias: 0.9 },
  { id: 'SB', label: 'Surface B', cap: 330, bias: 0.75 },
];

type Lpr = { plate: string; gate: string; dir: 'IN' | 'OUT'; kind: 'Registered' | 'Visitor' | 'Blacklisted' | 'Permit' };
const LPR: StreamSpec<Lpr> = {
  id: 'lpr.reads',
  peakPerHour: 380,
  profile: 'occupancy',
  make: (_, rnd) => {
    const letters = [0, 1, 2].map((i) => pickFrom(AR_LETTERS, rnd(10 + i))).join(' ');
    const digits = Array.from({ length: 3 + Math.floor(rnd(20) * 2) }, (_, i) => AR_DIGITS[Math.floor(rnd(30 + i) * 10)]).join('');
    const r = rnd(5);
    return {
      plate: `${letters}  ${digits}`,
      gate: pickFrom(['G1 North', 'G2 East', 'G3 South', 'P1 Ramp', 'P2 Ramp'], rnd(1)),
      dir: rnd(2) < 0.55 ? 'IN' : 'OUT',
      kind: r < 0.004 ? 'Blacklisted' : r < 0.25 ? 'Registered' : r < 0.32 ? 'Permit' : 'Visitor',
    };
  },
};

const KIND_TONE: Record<Lpr['kind'], TagTone> = { Registered: 'good', Permit: 'info', Visitor: 'idle', Blacklisted: 'bad' };

/** Egyptian plate: white body under a blue band reading "مصر  EGYPT". */
function Plate({ text }: { text: string }) {
  return (
    <span className="inline-flex flex-col overflow-hidden rounded-[4px] border border-[#1b3a8a] bg-white text-center leading-none" style={{ width: 150 }}>
      <span className="flex justify-between bg-[#2458d3] px-[6px] py-[1px] text-[8px] font-semibold text-white">
        <span>EGYPT</span>
        <span>مصر</span>
      </span>
      <span className="py-[3px] text-[16px] font-semibold text-night-950" dir="rtl">
        {text}
      </span>
    </span>
  );
}

export function ParkingScreen() {
  const free = useSignal('site.parkingFree', 5000).value;
  const occ = Math.max(0, Math.min(100, (1 - free / CAPACITY) * 100));
  const reads = useEventStream(LPR, 24);
  const entries = useEventCountToday(LPR, (e) => e.dir === 'IN');
  const hits = useEventCountToday(LPR, (e) => e.kind === 'Blacklisted');
  const [dial, levels, kpi] = row(208, 330, [440, 740, 586]);
  const [feed, trend] = row(563, 415, [1030, 761]);

  return (
    <>
      <Panel frame={dial} index={0} icon={<ParkingIcon />} title="Occupancy" subtitle="All car parks">
        <DialVerdict
          source={{ fixed: occ, unit: '%' }}
          verdict={bands([
            { max: 70, text: 'Available', tone: 'good' },
            { max: 90, text: 'Busy', tone: 'warn' },
            { max: 100, text: 'Nearly Full', tone: 'bad' },
          ])}
        />
      </Panel>
      <Panel frame={levels} index={1} icon={<ParkingIcon />} title="Levels" subtitle="Live occupancy per car park">
        <div className="absolute inset-x-[24px] top-[16px] flex flex-col gap-[20px]">
          {LEVELS.map((l) => {
            const pct = Math.max(3, Math.min(99, occ * l.bias));
            const used = Math.round((pct / 100) * l.cap);
            return (
              <div key={l.id} className="flex items-center gap-[16px] text-[16px]">
                <span className="w-[150px] text-white">{l.label}</span>
                <Meter value={pct} tone={pct > 90 ? 'bad' : pct > 75 ? 'warn' : 'good'} width={330} />
                <span className="ml-auto text-[14px] tabular-nums text-ink-3">
                  {fmt(l.cap - used)} free / {fmt(l.cap)}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel frame={kpi} index={2} icon={<ParkingIcon />} title="Today" subtitle="Live parking statistics">
        <div className="absolute inset-x-[24px] top-[6px] flex flex-col">
          <StatRow label="Free spaces" note={`of ${fmt(CAPACITY)} · guidance signs live`} value={free} unit="free" />
          <StatRow label="Entries" note="LPR reads · inbound, 5 gates" value={entries} unit="cars" />
          <StatRow label="Watchlist hits" note={hits ? <Tag tone="bad">Security notified</Tag> : 'None today'} value={hits} unit="plates" tone={hits ? '#f87171' : undefined} />
        </div>
      </Panel>

      <Panel frame={feed} index={5} icon={<CameraIcon />} title="License Plate Recognition" subtitle="Live reads from entry and exit cameras">
        <div className="absolute inset-x-[4px] bottom-[10px] top-[8px]">
          <DataTable
            dense
            rows={reads}
            rowKey={(e) => e.key}
            highlight={(e) => (e.data.kind === 'Blacklisted' ? 'alarm' : null)}
            columns={[
              { key: 't', header: 'Time', width: 100, render: (e) => <span className="font-mono text-[13px] text-ink-3">{clockTime(e.t)}</span> },
              { key: 'p', header: 'Plate', width: 170, render: (e) => <Plate text={e.data.plate} /> },
              { key: 'g', header: 'Gate', render: (e) => e.data.gate },
              { key: 'd', header: 'Dir', width: 70, render: (e) => <span className={e.data.dir === 'IN' ? 'text-ok' : 'text-gold'}>{e.data.dir === 'IN' ? '▲ IN' : '▼ OUT'}</span> },
              { key: 'k', header: 'Status', width: 140, render: (e) => <Tag tone={KIND_TONE[e.data.kind]}>{e.data.kind}</Tag> },
            ]}
          />
        </div>
      </Panel>
      <TrendCard frame={trend} index={6} icon={<ParkingIcon />} title="Traffic In / Out" subtitle="Vehicles per hour" sim="security.parkingIn" compare="security.parkingOut" names={{ actual: 'In', predictive: 'Out' }} yTitle="Vehicles" decimals={0} dayHours={14} />
    </>
  );
}

/** One stat line of a summary panel: label and note on the left, the animated value on the right. */
function StatRow({ label, note, value, unit, tone }: { label: string; note: ReactNode; value: number | null; unit: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.07] py-[12px] last:border-b-0">
      <div className="flex flex-col gap-[4px]">
        <span className="text-[17px] text-white">{label}</span>
        <span className="text-[14px] text-lavender">{note}</span>
      </div>
      <span className="flex items-baseline gap-[6px]">
        <span className="text-[38px] font-medium leading-none tabular-nums" style={{ color: tone ?? '#fff' }}>
          {value === null ? '—' : <AnimatedNumber value={value} />}
        </span>
        <span className="text-[16px] text-[#8f91b5]">{unit}</span>
      </span>
    </div>
  );
}

/* =================================================================================================
 * Gates
 * ================================================================================================= */

const GATES = [
  { id: 'G1', name: 'G1 · North Entrance', lanes: 3 },
  { id: 'G2', name: 'G2 · East Entrance', lanes: 2 },
  { id: 'G3', name: 'G3 · South Exit', lanes: 2 },
  { id: 'G4', name: 'G4 · Service Gate', lanes: 1 },
  { id: 'G5', name: 'G5 · Taxi & Drop-off', lanes: 2 },
  { id: 'G6', name: 'G6 · Emergency Access', lanes: 1 },
];

const GATE_EVENTS: StreamSpec<{ gate: (typeof GATES)[number]; ev: string; tone: TagTone }> = {
  id: 'gates.events',
  peakPerHour: 300,
  profile: 'occupancy',
  make: (_, rnd) => {
    const r = rnd(2);
    const [ev, tone]: [string, TagTone] = r < 0.9 ? ['Vehicle passed', 'good'] : r < 0.97 ? ['Barrier opened manually', 'info'] : r < 0.995 ? ['Tailgating detected', 'warn'] : ['Barrier fault', 'bad'];
    return { gate: pickFrom(GATES.slice(0, 5), rnd(1)), ev, tone };
  },
};

export function GatesScreen() {
  const events = useEventStream(GATE_EVENTS, 26);
  const [grid, feed] = row(208, 770, [1180, 611]);
  const cards = [...row(208, 240, 3, { x: grid.x, width: grid.w }), ...row(473, 240, 3, { x: grid.x, width: grid.w })];
  const trend = { x: grid.x, y: 738, w: grid.w, h: 240 };
  return (
    <>
      {GATES.map((g, i) => (
        <Panel key={g.id} frame={cards[i]} index={i} icon={<GateIcon />} title={g.name} subtitle={`${g.lanes} lane${g.lanes > 1 ? 's' : ''}`}>
          <GateCard gate={g} index={i} lastEvent={events.find((e) => e.data.gate.id === g.id)?.t} />
        </Panel>
      ))}
      <TrendCard frame={trend} index={6} icon={<GateIcon />} title="Gate Traffic" subtitle="Vehicles per hour, all gates" sim="security.gateTraffic" yTitle="Vehicles" decimals={0} />
      <Panel frame={feed} index={7} icon={<GateIcon />} title="Gate Events" subtitle="Live">
        <div className="absolute inset-x-[4px] bottom-[10px] top-[8px]">
          <DataTable
            dense
            rows={events}
            rowKey={(e) => e.key}
            highlight={(e) => (e.data.tone === 'bad' ? 'alarm' : e.data.tone === 'warn' ? 'warn' : null)}
            columns={[
              { key: 't', header: 'Time', width: 92, render: (e) => <span className="font-mono text-[13px] text-ink-3">{clockTime(e.t)}</span> },
              { key: 'g', header: 'Gate', width: 50, render: (e) => <span className="text-white">{e.data.gate.id}</span> },
              { key: 'e', header: 'Event', render: (e) => <Tag tone={e.data.tone}>{e.data.ev}</Tag> },
            ]}
          />
        </div>
      </Panel>
    </>
  );
}

function GateCard({ gate, index, lastEvent }: { gate: (typeof GATES)[number]; index: number; lastEvent?: number }) {
  const now = useNow(1000);
  // A barrier lifts for a few seconds after each pass.
  const open = gate.id === 'G6' ? false : lastEvent !== undefined && now - lastEvent < 6000;
  const count = useMemo(() => Math.round((index === 5 ? 0 : 1) * (1800 - index * 220) * (new Date(now).getHours() / 24)), [index, now]);
  const emergency = gate.id === 'G6';
  return (
    <div className="flex h-full items-center gap-[20px] px-[18px] pb-[10px]">
      <svg viewBox="0 0 160 90" width={160} height={90}>
        <rect x={8} y={40} width={16} height={46} rx={3} fill="#3a3f5c" stroke="#8f92e6" />
        <circle cx={16} cy={46} r={4} fill={open ? '#2ecf6e' : emergency ? '#9a9cc0' : '#ef4444'} style={{ filter: `drop-shadow(0 0 4px ${open ? '#2ecf6e' : '#ef4444'})` }} />
        <motion.g style={{ originX: '16px', originY: '52px' }} animate={{ rotate: open ? -80 : 0 }} transition={{ type: 'spring', stiffness: 90, damping: 14 }}>
          <rect x={16} y={49} width={138} height={7} rx={3.5} fill="#f5f6f8" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={30 + i * 26} y={49} width={13} height={7} fill="#ef4444" />
          ))}
        </motion.g>
        <line x1={0} x2={160} y1={87} y2={87} stroke="rgba(255,255,255,0.2)" />
      </svg>
      <div className="flex flex-col gap-[8px]">
        <Tag tone={emergency ? 'idle' : open ? 'good' : 'info'}>{emergency ? 'Standby' : open ? 'Open' : 'Closed'}</Tag>
        <span className="text-[30px] leading-none text-white">{fmt(count)}</span>
        <span className="text-[13px] text-ink-3">vehicles today{lastEvent ? ` · last ${clockTime(lastEvent)}` : ''}</span>
      </div>
    </div>
  );
}
