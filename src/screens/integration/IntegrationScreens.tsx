import { useNavigate } from 'react-router-dom';
import { Panel } from '@/components/frame/Panel';
import { LinkIcon } from '@/components/icons/UiIcons';
import { clockTime, DataTable, Meter, Tag } from '@/components/data/DataTable';
import { KeyValues, KpiBody } from '@/widgets/Widgets';
import { useSource } from '@/widgets/source';
import { TrendCard } from '@/widgets/TrendCard';
import { row, stack } from '@/screens/layout';
export { MobilityScreen, FacilityScreen, LifestyleScreen, BusinessScreen, AdvertisingScreen, AnalyticsScreen } from '@/screens/integration/ChannelDashboard';
import { signal } from '@/sim/catalog';
import { useNow } from '@/sim/clock';
import { pickFrom, useEventCountToday, useEventStream, type StreamSpec } from '@/sim/events';
import {
  CONSUMERS,
  FEEDS,
  USE_CASES,
  feedRate,
  feedUseCount,
  recordsToday,
  useCaseLive,
  type Feed,
  type FeedId,
} from '@/model/integration';
import { fmt } from '@/utils/format';

const SHORT_FEED: Record<FeedId, string> = {
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

const liveFeeds = FEEDS.filter((f) => f.status === 'live').length;

/** A number that follows a simulated signal. */
function Live({ id, decimals = 0, unit }: { id: Parameters<typeof signal>[0]; decimals?: number; unit?: string }) {
  const v = useSource({ sim: id });
  return (
    <>
      {fmt(v.value, decimals)}
      {unit ? <span className="ml-[4px] text-[0.8em] text-ink-3">{unit}</span> : null}
    </>
  );
}

function FeedRate({ feed }: { feed: Feed }) {
  const v = useSource({ signal: feedRate(feed) });
  return <span className="tabular-nums text-white">{fmt(v.value, 0)}</span>;
}

const feedTag = (f: Feed) => <Tag tone={f.status === 'live' ? 'good' : 'warn'}>{f.status === 'live' ? 'Live' : 'Commissioning'}</Tag>;

/* =================================================================================================
 * Overview
 * ================================================================================================= */

export function OverviewScreen() {
  const now = useNow(30_000);
  const today = recordsToday(now, (t) => signal('integration.records').actual(t));
  const kpis = row(208, 150, 4);
  const [flow, side] = row(383, 595, [1180, 611]);
  const [trend, health] = stack(side.x, side.w, 383, [285, 285]);
  const icon = <LinkIcon />;
  const commissioning = FEEDS.length - liveFeeds;
  const liveCases = USE_CASES.filter(useCaseLive).length;

  return (
    <>
      <Panel frame={kpis[0]} index={0} icon={icon} title="Feeds Connected" subtitle="Site systems delivering data">
        <KpiBody source={{ fixed: liveFeeds }} decimals={0} unit={`of ${FEEDS.length}`} note={commissioning ? `${commissioning} in commissioning` : 'All in service'} />
      </Panel>
      <Panel frame={kpis[1]} index={1} icon={icon} title="Records Delivered Today" subtitle="Acknowledged by the CRM">
        <KpiBody source={{ fixed: today / 1_000_000 }} decimals={2} unit="M" note={<Live id="integration.records" unit="rec/min now" />} />
      </Panel>
      <Panel frame={kpis[2]} index={2} icon={icon} title="Delivery Success" subtitle="First attempt or recovered">
        <KpiBody source={{ sim: 'integration.success' }} decimals={2} note={<span>Retries last hour · <Live id="integration.retries" /></span>} />
      </Panel>
      <Panel frame={kpis[3]} index={3} icon={icon} title="Delivery Latency" subtitle="Site event to CRM acknowledgement">
        <KpiBody source={{ sim: 'integration.latency' }} decimals={0} note={`${liveCases} of ${USE_CASES.length} use cases supplied`} />
      </Panel>

      <Panel frame={flow} index={4} icon={icon} title="Data Flow" subtitle="From the site systems, through the integration layer, to the CRM and what depends on it">
        <FlowDiagram />
      </Panel>
      <TrendCard frame={trend} index={5} icon={icon} title="Records Delivered" subtitle="Records per minute" sim="integration.records" compare="integration.retries" names={{ actual: 'Delivered', predictive: 'Retried' }} yTitle="Records / min" decimals={0} dayHours={12} />
      <Panel frame={health} index={6} icon={icon} title="Integration Health" subtitle="Delivery path">
        <div className="mt-[6px]">
          <KeyValues
            dense
            rows={[
              { label: 'Queue depth', source: { sim: 'integration.queue' }, decimals: 0 },
              { label: 'Retries in the last hour', source: { sim: 'integration.retries' }, decimals: 0 },
              { label: 'Endpoint availability', text: '99.98 %' },
              { label: 'Last full reconciliation', text: 'Today, 03:00' },
              { label: 'Access tokens', text: 'Valid · renew in 21 days' },
            ]}
          />
        </div>
      </Panel>
    </>
  );
}

const W = 1164;
const H = 505;

function FlowDiagram() {
  const sourceY = (i: number) => i * 52 + 21;
  const centerLeftY = (i: number) => 70 + i * 40;
  const consumerY = (j: number) => j * 76 + 29;
  const centerRightY = (j: number) => 84 + j * 60;
  const curve = (x1: number, y1: number, x2: number, y2: number) => `M${x1} ${y1} C${x1 + 80} ${y1}, ${x2 - 80} ${y2}, ${x2} ${y2}`;

  return (
    <div className="absolute inset-x-[8px] bottom-[8px]" style={{ height: H, width: W }}>
      <p className="absolute left-0 top-0 text-[12px] uppercase tracking-[2px] text-ink-4">Site systems</p>
      <p className="absolute left-[450px] top-0 w-[270px] text-center text-[12px] uppercase tracking-[2px] text-ink-4">Integration layer</p>
      <p className="absolute left-[860px] top-0 text-[12px] uppercase tracking-[2px] text-ink-4">Receiving systems</p>
      <div className="absolute inset-x-0 bottom-0 top-[30px]">
      <svg width={W} height={H} className="absolute inset-0" aria-hidden>
        {FEEDS.map((f, i) => (
          <path key={f.id} d={curve(300, sourceY(i), 450, centerLeftY(i))} fill="none" stroke={f.status === 'live' ? '#999bff' : '#ffaa00'} strokeOpacity={0.6} strokeWidth={1.6} strokeDasharray="4 10">
            <animate attributeName="stroke-dashoffset" from="28" to="0" dur="1.6s" repeatCount="indefinite" />
          </path>
        ))}
        {CONSUMERS.map((c, j) => (
          <path key={c.id} d={curve(720, centerRightY(j), 860, consumerY(j))} fill="none" stroke="#999bff" strokeOpacity={0.6} strokeWidth={1.6} strokeDasharray="4 10">
            <animate attributeName="stroke-dashoffset" from="28" to="0" dur="1.6s" repeatCount="indefinite" />
          </path>
        ))}
      </svg>

      {FEEDS.map((f, i) => (
        <div key={f.id} className="absolute flex h-[42px] w-[300px] items-center gap-[10px] rounded-[10px] border border-white/12 bg-white/[0.04] px-[12px]" style={{ top: i * 52 }}>
          <span className="h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: f.status === 'live' ? '#2ecf6e' : '#ffaa00', boxShadow: `0 0 8px ${f.status === 'live' ? '#2ecf6e' : '#ffaa00'}` }} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] leading-tight text-white">{f.name}</span>
            <span className="block truncate text-[11px] leading-tight text-ink-3">{f.source}</span>
          </span>
          <span className="text-right text-[14px] leading-tight">
            <FeedRate feed={f} />
            <span className="block text-[10px] text-ink-4">rec/min</span>
          </span>
        </div>
      ))}

      <div className="absolute left-[450px] top-[30px] flex h-[410px] w-[270px] flex-col items-center rounded-[14px] border border-gold/60 px-[20px] pt-[26px]" style={{ background: 'linear-gradient(180deg, rgba(255,170,0,0.1), rgba(255,170,0,0.02))', boxShadow: '0 0 40px rgba(255,170,0,0.12)' }}>
        <p className="text-[12px] uppercase tracking-[3px] text-gold-soft">AVEVA</p>
        <p className="mt-[8px] text-center text-[24px] leading-tight text-white">Integration Layer</p>
        <p className="mt-[8px] text-center text-[13px] text-ink-3">Normalise · Validate · Buffer · Deliver</p>
        <span className="my-[18px] h-px w-full bg-white/15" />
        <Metric label="Throughput" id="integration.records" unit="rec/min" />
        <Metric label="Queue depth" id="integration.queue" unit="msgs" />
        <Metric label="Latency" id="integration.latency" unit="ms" />
        <Metric label="Success" id="integration.success" unit="%" decimals={2} />
      </div>

      {CONSUMERS.map((c, j) => (
        <div key={c.id} className="absolute flex h-[58px] w-[304px] items-center gap-[10px] rounded-[10px] border border-white/12 bg-white/[0.04] px-[14px]" style={{ top: j * 76, left: 860 }}>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[16px] leading-tight text-white">{c.name}</span>
            <span className="block truncate text-[12px] leading-tight text-ink-3">{c.role}</span>
          </span>
          <span className="shrink-0 text-right text-[12px] leading-tight text-lavender-soft">
            {c.feeds.length}
            <span className="block text-[10px] text-ink-4">feeds</span>
          </span>
        </div>
      ))}
      </div>
    </div>
  );
}

function Metric({ label, id, unit, decimals = 0 }: { label: string; id: Parameters<typeof signal>[0]; unit: string; decimals?: number }) {
  return (
    <div className="mb-[14px] flex w-full items-baseline justify-between">
      <span className="text-[14px] text-ink-3">{label}</span>
      <span className="text-[24px] tabular-nums text-white">
        <Live id={id} decimals={decimals} unit={unit} />
      </span>
    </div>
  );
}

/* =================================================================================================
 * Data feeds
 * ================================================================================================= */

export function FeedsScreen() {
  const navigate = useNavigate();
  const [table, ...bottom] = [{ x: 52, y: 208, w: 1816, h: 470 }, ...row(703, 282, 2)];
  const icon = <LinkIcon />;
  return (
    <>
      <Panel frame={table} index={0} icon={icon} title="Data Feeds" subtitle="What the site supplies to the CRM · select a feed to open its source screen">
        <div className="absolute inset-x-[4px] bottom-[8px] top-[6px]">
          <DataTable
            dense
            rows={FEEDS}
            rowKey={(f) => f.id}
            onRowClick={(f) => f.route && navigate(f.route)}
            highlight={(f) => (f.status === 'commissioning' ? 'warn' : null)}
            columns={[
              { key: 'name', header: 'Feed', width: 230, render: (f) => <span className="text-white">{f.name}</span> },
              { key: 'source', header: 'Source System', width: 250, render: (f) => f.source },
              { key: 'proto', header: 'Protocol', width: 170, render: (f) => f.protocol },
              { key: 'supplies', header: 'Data Supplied', render: (f) => f.supplies },
              { key: 'uses', header: 'Use Cases', width: 100, align: 'right', render: (f) => feedUseCount(f.id) },
              { key: 'rate', header: 'Records / min', width: 130, align: 'right', render: (f) => <FeedRate feed={f} /> },
              { key: 'lat', header: 'Latency', width: 100, align: 'right', render: (f) => <span className="text-ink-2">{f.latency} ms</span> },
              { key: 'st', header: 'Status', width: 150, render: (f) => feedTag(f) },
            ]}
          />
        </div>
      </Panel>
      <TrendCard frame={bottom[0]} index={1} icon={icon} title="Throughput" subtitle="All feeds, records per minute" sim="integration.records" names={{ actual: 'Actual', predictive: 'Expected' }} yTitle="Records / min" decimals={0} dayHours={12} />
      <TrendCard frame={bottom[1]} index={2} icon={icon} title="Delivery Latency" subtitle="Site event to CRM acknowledgement" sim="integration.latency" names={{ actual: 'Actual', predictive: 'Expected' }} yTitle="Latency (ms)" decimals={0} dayHours={12} />
    </>
  );
}

/* =================================================================================================
 * Sync log
 * ================================================================================================= */

type Delivery = { feed: Feed; endpoint: string; records: number; latency: number; result: 'delivered' | 'retried' | 'failed'; detail: string };

const SENDING = FEEDS.filter((f) => f.status === 'live');
const FAILURES = ['CRM returned 503', 'Timed out after 10 s', 'Schema rejected: unknown tenant id'] as const;

const SYNC: StreamSpec<Delivery> = {
  id: 'integration.sync',
  peakPerHour: 420,
  profile: 'occupancy',
  make: (_k, rnd) => {
    const feed = pickFrom(SENDING, rnd(1));
    const r = rnd(5);
    const result = r < 0.0015 ? 'failed' : r < 0.045 ? 'retried' : 'delivered';
    return {
      feed,
      endpoint: pickFrom(feed.endpoints, rnd(2)),
      records: Math.max(1, Math.round(3 + rnd(3) * (feed.rate.high / 6))),
      latency: Math.round(feed.latency * (0.6 + rnd(4) * 0.9) * (result === 'delivered' ? 1 : 2.6)),
      result,
      detail: result === 'failed' ? pickFrom(FAILURES, rnd(6)) : result === 'retried' ? `Acknowledged on attempt ${2 + Math.floor(rnd(7) * 2)}` : 'Acknowledged',
    };
  },
};

const RESULT_TONE = { delivered: 'good', retried: 'warn', failed: 'bad' } as const;

export function SyncLogScreen() {
  const events = useEventStream(SYNC, 40, 3 * 3_600_000);
  const total = useEventCountToday(SYNC);
  const retried = useEventCountToday(SYNC, (d) => d.result === 'retried');
  const failed = useEventCountToday(SYNC, (d) => d.result === 'failed');
  const kpis = row(208, 150, 4);
  const [table, side] = row(383, 595, [1180, 611]);
  const [trend, byFeed] = stack(side.x, side.w, 383, [285, 285]);
  const icon = <LinkIcon />;
  const counts = SENDING.map((f) => ({ f, n: events.filter((e) => e.data.feed.id === f.id).length })).sort((a, b) => b.n - a.n);
  const top = Math.max(1, ...counts.map((c) => c.n));

  return (
    <>
      <Panel frame={kpis[0]} index={0} icon={icon} title="Batches Today" subtitle="Sent to the CRM">
        <KpiBody source={{ fixed: total }} decimals={0} unit="" note="Each batch carries many records" />
      </Panel>
      <Panel frame={kpis[1]} index={1} icon={icon} title="Acknowledged" subtitle="Accepted by the CRM">
        <KpiBody source={{ fixed: total ? ((total - failed) / total) * 100 : 100 }} decimals={2} unit="%" note={`${total - failed - retried} first time`} />
      </Panel>
      <Panel frame={kpis[2]} index={2} icon={icon} title="Retried" subtitle="Recovered automatically">
        <KpiBody source={{ fixed: retried }} decimals={0} unit="" note="Buffered, then redelivered" />
      </Panel>
      <Panel frame={kpis[3]} index={3} icon={icon} title="Failed" subtitle="Held for replay">
        <KpiBody source={{ fixed: failed }} decimals={0} unit="" note={failed ? <Tag tone="bad">Needs attention</Tag> : 'None'} />
      </Panel>

      <Panel frame={table} index={4} icon={icon} title="Delivery Log" subtitle="Every batch handed to the CRM, newest first">
        <div className="absolute inset-x-[4px] bottom-[10px] top-[8px]">
          <DataTable
            dense
            rows={events}
            rowKey={(e) => e.key}
            highlight={(e) => (e.data.result === 'failed' ? 'alarm' : null)}
            columns={[
              { key: 't', header: 'Time', width: 100, render: (e) => <span className="tabular-nums text-ink-2">{clockTime(e.t)}</span> },
              { key: 'feed', header: 'Feed', width: 190, render: (e) => <span className="text-white">{e.data.feed.name}</span> },
              { key: 'ep', header: 'Endpoint', width: 200, render: (e) => <span className="font-mono text-[13px] text-ink-2">{e.data.endpoint}</span> },
              { key: 'rec', header: 'Records', width: 90, align: 'right', render: (e) => e.data.records },
              { key: 'lat', header: 'Latency', width: 90, align: 'right', render: (e) => `${e.data.latency} ms` },
              { key: 'res', header: 'Result', width: 120, render: (e) => <Tag tone={RESULT_TONE[e.data.result]}>{e.data.result[0].toUpperCase() + e.data.result.slice(1)}</Tag> },
              { key: 'd', header: 'Detail', render: (e) => <span className="text-ink-3">{e.data.detail}</span> },
            ]}
          />
        </div>
      </Panel>
      <TrendCard frame={trend} index={5} icon={icon} title="Queue Depth" subtitle="Messages waiting to be delivered" sim="integration.queue" names={{ actual: 'Actual', predictive: 'Expected' }} yTitle="Messages" decimals={0} dayHours={12} />
      <Panel frame={byFeed} index={6} icon={icon} title="Recent Batches By Feed" subtitle="Last 40 batches">
        <div className="absolute inset-x-[20px] top-[6px] flex flex-col gap-[7px]">
          {counts.slice(0, 7).map(({ f, n }) => (
            <div key={f.id} className="flex items-center justify-between text-[14px]">
              <span className="w-[170px] text-white">{SHORT_FEED[f.id]}</span>
              <Meter value={(n / top) * 100} tone="info" width={250} />
              <span className="w-[56px] text-right tabular-nums text-ink-3">{n}</span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
