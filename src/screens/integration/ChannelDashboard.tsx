import { useState } from 'react';
import { Panel } from '@/components/frame/Panel';
import { LinkIcon, ListCheckIcon } from '@/components/icons/UiIcons';
import { Meter, Tag } from '@/components/data/DataTable';
import { useSource } from '@/widgets/source';
import { TrendCard } from '@/widgets/TrendCard';
import { GRID, row, type Frame } from '@/screens/layout';
import { channelById, channelCode, feedById, type ChannelId } from '@/model/integration';
import { areasOf, kpisOf, useCasesOf, type UcKpi } from '@/model/useCaseKpis';
import type { Signal } from '@/sim/signals';
import { fmt } from '@/utils/format';

const SHORT_CHANNEL: Record<ChannelId, string> = {
  mobility: 'Mobility and Transport',
  facility: 'Facility and Office Support',
  lifestyle: 'Staff Lifestyle',
  business: 'Business Support',
  beacon: 'Beacon Advertising',
  data: 'Data and Analytics',
};

const SHORT_FEED: Record<string, string> = {
  lpr: 'LPR',
  access: 'Access',
  cctv: 'CCTV',
  bms: 'BMS',
  energy: 'Metering',
  fm: 'Tickets',
  beacons: 'Beacons',
  signage: 'Signage',
  av: 'Rooms & AV',
};

const RX = 507;
const RW = 1361;

/** A measure's value, with how far it is from what the day's pattern predicts. */
function UcKpiCard({ kpi, frame, index, feedNote }: { kpi: UcKpi; frame: Frame; index: number; feedNote: string }) {
  const v = useSource({ signal: kpi.signal });
  const dec = kpi.signal.def.decimals ?? 0;
  const delta = v.value !== null && v.predictive ? ((v.value - v.predictive) / Math.abs(v.predictive)) * 100 : null;
  return (
    <Panel frame={frame} index={index} icon={<LinkIcon />} title={kpi.label} subtitle={feedNote}>
      <div className="flex h-full items-center px-[18px] pb-[12px]">
        <span className="font-medium leading-none text-white" style={{ fontSize: 50 }}>
          {fmt(v.value, dec)}
        </span>
        <span className="ml-[8px] self-end pb-[6px] text-[18px] text-[#8f91b5]">{kpi.unit}</span>
        {delta !== null && Math.abs(delta) >= 0.5 && (
          <span className="ml-auto self-end pb-[6px] text-[14px] text-lavender-soft">
            {delta > 0 ? '+' : '−'}
            {Math.abs(delta).toFixed(0)}% vs expected
          </span>
        )}
      </div>
    </Panel>
  );
}

function AreaRow({ label, signal: s, top, unit }: { label: string; signal: Signal; top: number; unit: string }) {
  const v = useSource({ signal: s });
  return (
    <div className="flex items-center justify-between text-[16px]">
      <span className="w-[130px] text-white">{label}</span>
      <Meter value={top ? ((v.value ?? 0) / top) * 100 : 0} tone="info" width={180} />
      <span className="w-[110px] text-right tabular-nums text-ink-2">
        {fmt(v.value, s.def.decimals ?? 0)} <span className="text-[12px] text-ink-4">{unit}</span>
      </span>
    </div>
  );
}

/** One channel: its use cases down the left, and the selected one's KPIs, trends and data sources. */
export function ChannelDashboard({ channel }: { channel: ChannelId }) {
  const cases = useCasesOf(channel);
  const [sel, setSel] = useState(0);
  const uc = cases[sel] ?? cases[0];
  const kpis = kpisOf(uc);
  const areas = areasOf(uc);
  const top = Math.max(...areas.map((a) => a.signal.def.high));
  const list = { x: GRID.left, y: GRID.top, w: 430, h: 777 };
  const cards = row(208, 150, 4, { x: RX, width: RW });
  const [trendF, areaF] = row(383, 360, [880, 456], { x: RX, width: RW });
  const [trend2F, srcF] = row(768, 217, [880, 456], { x: RX, width: RW });
  const feedNote = uc.feeds.map((f) => SHORT_FEED[f]).join(' · ');
  const ch = channelById(channel);
  const stamp = `${uc.channel}${uc.no}`;

  return (
    <>
      <Panel frame={list} index={0} icon={<ListCheckIcon />} title={SHORT_CHANNEL[channel]} subtitle={`${cases.length} use cases · select one`}>
        <div className="gg-scroll absolute inset-x-[10px] bottom-[10px] top-[8px] flex flex-col gap-[6px] overflow-y-auto pr-[4px]">
          {cases.map((u, i) => {
            const active = i === sel;
            return (
              <button
                key={u.no}
                onClick={() => setSel(i)}
                className={`flex items-center gap-[12px] rounded-[10px] border px-[12px] py-[10px] text-left transition-colors ${active ? 'border-gold/80 bg-gold/10' : 'border-white/10 bg-white/[0.03] hover:border-white/30'}`}
              >
                <span className={`font-mono text-[13px] ${active ? 'text-gold-soft' : 'text-ink-3'}`}>
                  {channelCode(u.channel)}-{u.no}
                </span>
                <span className={`flex-1 text-[16px] leading-tight ${active ? 'text-white' : 'text-ink-2'}`}>{u.name}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      {kpis.map((k, i) => (
        <UcKpiCard key={`${stamp}-${i}`} kpi={k} frame={cards[i]} index={i + 1} feedNote={feedNote} />
      ))}

      <TrendCard
        key={`t1-${stamp}`}
        frame={trendF}
        index={5}
        icon={<LinkIcon />}
        title={kpis[0].label}
        subtitle={uc.name}
        sim={kpis[0].signal}
        names={{ actual: 'Actual', predictive: 'Expected' }}
        yTitle={`${kpis[0].label} (${kpis[0].unit})`}
        decimals={kpis[0].signal.def.decimals ?? 0}
        dayHours={12}
      />
      <Panel frame={areaF} index={6} icon={<LinkIcon />} title="By Area" subtitle={`${kpis[0].label} across the site`}>
        <div className="absolute inset-x-[20px] top-[10px] flex flex-col gap-[22px]">
          {areas.map((a) => (
            <AreaRow key={`${stamp}-${a.label}`} label={a.label} signal={a.signal} top={top} unit={kpis[0].unit} />
          ))}
        </div>
      </Panel>
      <TrendCard
        key={`t2-${stamp}`}
        frame={trend2F}
        index={7}
        icon={<LinkIcon />}
        title={kpis[1].label}
        subtitle="Second measure"
        sim={kpis[1].signal}
        names={{ actual: 'Actual', predictive: 'Expected' }}
        yTitle={kpis[1].unit}
        decimals={kpis[1].signal.def.decimals ?? 0}
        dayHours={12}
      />
      <Panel frame={srcF} index={8} icon={<LinkIcon />} title="Where The Data Comes From" subtitle={`Delivered to ${ch.hostedBy}`}>
        <div className="absolute inset-x-[20px] top-[8px] flex flex-col gap-[10px]">
          {uc.feeds.slice(0, 4).map((id) => {
            const f = feedById(id);
            return (
              <div key={id} className="flex items-center justify-between text-[15px]">
                <span className="text-white">{f.name}</span>
                <Tag tone={f.status === 'live' ? 'good' : 'warn'}>{f.status === 'live' ? 'Live' : 'Commissioning'}</Tag>
              </div>
            );
          })}
        </div>
      </Panel>
    </>
  );
}

export const MobilityScreen = () => <ChannelDashboard channel="mobility" />;
export const FacilityScreen = () => <ChannelDashboard channel="facility" />;
export const LifestyleScreen = () => <ChannelDashboard channel="lifestyle" />;
export const BusinessScreen = () => <ChannelDashboard channel="business" />;
export const AdvertisingScreen = () => <ChannelDashboard channel="beacon" />;
export const AnalyticsScreen = () => <ChannelDashboard channel="data" />;
