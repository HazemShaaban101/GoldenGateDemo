import { derivedSignal } from '@/sim/catalog';
import type { SignalDef } from '@/sim/signals';

/**
 * The integration layer: what the platform collects from the site systems and hands to the CRM (and
 * the systems around it) so the use cases in the catalogue can run. The use cases and their SOPs are
 * the client's; this model only records which data each one needs from the site and whether that
 * data is flowing yet.
 */

export type FeedId = 'lpr' | 'access' | 'cctv' | 'bms' | 'energy' | 'fm' | 'beacons' | 'signage' | 'av';
export type FeedStatus = 'live' | 'commissioning';

export interface Feed {
  id: FeedId;
  name: string;
  /** The site system the data comes from. */
  source: string;
  protocol: string;
  /** What is delivered, in the client's words. */
  supplies: string;
  status: FeedStatus;
  /** Existing screen that shows the same data in full (the row opens it). */
  route?: string;
  rate: Pick<SignalDef, 'low' | 'high' | 'profile'>;
  /** Typical delivery latency (ms) between the source event and the CRM acknowledging it. */
  latency: number;
}

export const FEEDS: Feed[] = [
  {
    id: 'lpr',
    name: 'Parking & LPR',
    source: 'LPR cameras · Smart parking',
    protocol: 'REST · Webhook',
    supplies: 'Plate reads, bay occupancy, dwell time, gate events',
    status: 'live',
    route: '/security/parking',
    rate: { low: 12, high: 210, profile: 'occupancy' },
    latency: 420,
  },
  {
    id: 'access',
    name: 'Access Control',
    source: 'Badge and door controllers',
    protocol: 'REST · MQTT',
    supplies: 'Badge events, door state, zone occupancy',
    status: 'live',
    route: '/security/access',
    rate: { low: 20, high: 260, profile: 'office' },
    latency: 310,
  },
  {
    id: 'cctv',
    name: 'CCTV Analytics',
    source: 'Video analytics server',
    protocol: 'REST',
    supplies: 'Anonymised people counts, heat maps, trajectories',
    status: 'live',
    route: '/security/cctv',
    rate: { low: 300, high: 900, profile: 'occupancy' },
    latency: 780,
  },
  {
    id: 'bms',
    name: 'Building Management',
    source: 'Schneider BMS',
    protocol: 'BACnet → OPC UA',
    supplies: 'Zone temperature, air quality, equipment state',
    status: 'live',
    route: '/hvac/environmental',
    rate: { low: 440, high: 520, profile: 'hvac' },
    latency: 640,
  },
  {
    id: 'energy',
    name: 'Energy & Water Metering',
    source: 'Smart meters · EV chargers',
    protocol: 'Modbus → OPC UA',
    supplies: 'kWh, m³ and BTU per tenant and per charger',
    status: 'live',
    route: '/metering/energy',
    rate: { low: 110, high: 130, profile: 'flat' },
    latency: 560,
  },
  {
    id: 'fm',
    name: 'Maintenance & Ticketing',
    source: 'Facility work-order system',
    protocol: 'REST',
    supplies: 'Work orders, asset status, SLA timers',
    status: 'live',
    route: '/maintenance/ticketing',
    rate: { low: 1, high: 14, profile: 'office' },
    latency: 350,
  },
  {
    id: 'beacons',
    name: 'Bluetooth Beacons',
    source: 'Beacon platform',
    protocol: 'MQTT',
    supplies: 'Proximity events, dwell time, verified impressions',
    status: 'live',
    route: '/community/crowd',
    rate: { low: 80, high: 1800, profile: 'occupancy' },
    latency: 260,
  },
  {
    id: 'signage',
    name: 'Digital Signage & Audio',
    source: 'Signage content system',
    protocol: 'REST',
    supplies: 'Proof-of-play, screen and audio zone status',
    status: 'live',
    route: '/community/navigation',
    rate: { low: 30, high: 120, profile: 'retail' },
    latency: 470,
  },
  {
    id: 'av',
    name: 'Meeting Rooms & AV',
    source: 'Room panels · AV control',
    protocol: 'REST · PJLink',
    supplies: 'Room state, occupancy, AV equipment status',
    status: 'commissioning',
    rate: { low: 2, high: 40, profile: 'office' },
    latency: 900,
  },
];

export const feedById = (id: FeedId) => FEEDS.find((f) => f.id === id)!;

/** Live rate (records per minute) of one feed. */
export const feedRate = (f: Feed) => derivedSignal(`integration.feed.${f.id}`, { unit: 'rec/min', ...f.rate, noise: 0.07, decimals: 0, clampMin: 0 });

/** Systems that receive the data on the other side of the integration layer. */
export interface Consumer {
  id: string;
  name: string;
  role: string;
  /** Feeds delivered to it. */
  feeds: FeedId[];
}

const ALL_FEEDS = FEEDS.map((f) => f.id);

export const CONSUMERS: Consumer[] = [
  { id: 'crm', name: 'CRM Platform', role: 'Customers, contracts, services, SOP workflows', feeds: ALL_FEEDS },
  { id: 'payment', name: 'Payment Gateway', role: 'Billable events: parking, EV, bookings', feeds: ['lpr', 'energy', 'av', 'access'] },
  { id: 'app', name: 'GG Mobile App', role: 'Availability, bookings, offers, wayfinding', feeds: ['lpr', 'access', 'av', 'beacons', 'bms'] },
  { id: 'fmarm', name: 'FM Arm', role: 'Service dispatch and field work', feeds: ['fm', 'bms', 'access', 'energy'] },
  { id: 'media', name: 'Media Sales', role: 'Campaigns, impressions, proof-of-play', feeds: ['beacons', 'signage', 'cctv'] },
  { id: 'analytics', name: 'Analytics & Reporting', role: 'Dashboards, benchmarks, ESG reports', feeds: ['cctv', 'lpr', 'access', 'bms', 'energy', 'beacons', 'signage'] },
];

/* ---- Use-case catalogue ---------------------------------------------------------------------- */

export type ChannelId = 'mobility' | 'facility' | 'lifestyle' | 'business' | 'beacon' | 'data';

export interface Channel {
  id: ChannelId;
  name: string;
  /** What sits beside the CRM for this channel. */
  hostedBy: string;
}

export const CHANNELS: Channel[] = [
  { id: 'mobility', name: 'Mobility and Transport', hostedBy: 'CRM · Payment gateway · GG app' },
  { id: 'facility', name: 'Facility and Office Support', hostedBy: 'CRM · FM arm · Payment gateway' },
  { id: 'lifestyle', name: 'Staff Lifestyle', hostedBy: 'CRM · GG app · Payment gateway' },
  { id: 'business', name: 'Business Support', hostedBy: 'CRM · GG app · Payment gateway' },
  { id: 'beacon', name: 'Beacon Advertising and In-App Media', hostedBy: 'CRM · Media sales · GG app' },
  { id: 'data', name: 'Data and Analytics', hostedBy: 'CRM · Analytics & reporting' },
];

export const channelById = (id: ChannelId) => CHANNELS.find((c) => c.id === id)!;

export interface UseCase {
  channel: ChannelId;
  no: string;
  name: string;
  /** Data the site must supply for this use case to run. */
  feeds: FeedId[];
}

type Row = [ChannelId, string, string, FeedId[]];

const ROWS: Row[] = [
  ['mobility', '01', 'Premium reserved parking subscriptions', ['lpr', 'access', 'cctv']],
  ['mobility', '02', 'Dynamic visitor parking with pre-booking', ['lpr', 'cctv']],
  ['mobility', '03', 'EV charging as a metered service', ['lpr', 'energy']],
  ['mobility', '04', 'Valet service marketplace', ['lpr', 'access']],
  ['mobility', '05', 'Dynamic surge pricing for peak hours', ['lpr', 'cctv']],
  ['mobility', '06', 'Parking analytics for retail tenants', ['lpr', 'cctv']],
  ['mobility', '07', 'In-app car wash, fuel, and maintenance bookings', ['lpr', 'access']],
  ['mobility', '08', 'Long-stay parking for adjacent developments', ['lpr', 'access']],
  ['facility', '01', 'Tiered cleaning subscriptions', ['fm', 'access', 'bms']],
  ['facility', '02', 'On-demand maintenance marketplace', ['fm', 'bms']],
  ['facility', '03', 'Managed pest control', ['fm']],
  ['facility', '04', 'Indoor air quality monitoring service', ['bms']],
  ['facility', '05', 'Energy optimization service for tenants', ['energy', 'bms']],
  ['facility', '06', 'IT and connectivity services', ['bms', 'access']],
  ['facility', '07', 'Sustainability and ESG reporting service', ['energy', 'bms']],
  ['lifestyle', '01', 'Food and beverage ordering hub', ['beacons', 'signage']],
  ['lifestyle', '02', 'Car wash and detailing during the workday', ['lpr', 'access']],
  ['lifestyle', '03', 'On-site fitness and wellness memberships', ['access', 'beacons']],
  ['lifestyle', '04', 'Premium lounges and quiet zones', ['access', 'bms']],
  ['business', '01', 'On-demand meeting room rentals', ['av', 'access', 'signage']],
  ['business', '02', 'Event and conference space rental', ['av', 'access', 'signage']],
  ['business', '03', 'Day-pass coworking access', ['access', 'av']],
  ['business', '04', 'Audio-visual and live-streaming production', ['av', 'signage']],
  ['business', '05', 'Training and certification venue partnerships', ['access']],
  ['business', '06', 'Notary, legal, and translation services', ['access']],
  ['business', '07', 'Mini-incubator or accelerator hosting', ['av', 'access']],
  ['beacon', '01', 'Pay-per-push notifications', ['beacons', 'signage']],
  ['beacon', '02', 'Tiered Bluetooth advertising subscriptions', ['beacons', 'signage']],
  ['beacon', '03', 'Seasonal campaign packs', ['beacons', 'signage']],
  ['beacon', '04', 'Zone sponsorship', ['beacons', 'cctv']],
  ['beacon', '05', 'Programmatic Digital Out-of-Home advertising', ['signage', 'beacons', 'cctv']],
  ['beacon', '06', 'Sponsored content and offers', ['beacons', 'signage']],
  ['beacon', '07', 'Wayfinding sponsorship', ['beacons', 'signage']],
  ['beacon', '08', 'App home-screen takeovers', ['beacons']],
  ['data', '01', 'Tenant-facing operational dashboards', ['cctv', 'lpr', 'access', 'bms', 'beacons']],
  ['data', '02', 'Aggregated footfall data for brands', ['cctv', 'access', 'beacons']],
  ['data', '03', 'Market research panel access', ['cctv', 'beacons', 'lpr']],
  ['data', '04', 'Real estate intelligence reports', ['cctv', 'lpr', 'access', 'bms', 'beacons']],
  ['data', '05', 'Demographic analytics for retailers', ['cctv', 'beacons']],
  ['data', '06', 'Heatmaps and trajectory analysis', ['cctv', 'beacons']],
  ['data', '07', 'Cross-property benchmarks (the licensing prize)', ['cctv', 'lpr', 'access', 'bms', 'energy', 'beacons']],
  ['data', '08', 'Verified impression data for advertisers', ['signage', 'beacons', 'cctv']],
  ['data', '09', 'Energy and sustainability benchmarking', ['energy', 'bms']],
];

export const USE_CASES: UseCase[] = ROWS.map(([channel, no, name, feeds]) => ({ channel, no, name, feeds }));

/** A use case's data is live once every feed it needs is live. */
export const useCaseLive = (u: UseCase) => u.feeds.every((id) => feedById(id).status === 'live');

export const channelProgress = (id: ChannelId) => {
  const list = USE_CASES.filter((u) => u.channel === id);
  const live = list.filter(useCaseLive).length;
  return { total: list.length, live, pct: (live / list.length) * 100 };
};

/** How many use cases rely on each feed. */
export const feedUseCount = (id: FeedId) => USE_CASES.filter((u) => u.feeds.includes(id)).length;

export const channelCode = (c: ChannelId) => ({ mobility: 'MT', facility: 'FO', lifestyle: 'SL', business: 'BS', beacon: 'BA', data: 'DA' })[c];

/** Records delivered since midnight: the throughput signal summed over 5-minute buckets. */
export function recordsToday(now: number, perMin: (t: number) => number): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  let total = 0;
  for (let t = start.getTime(); t < now; t += 300_000) total += perMin(t + 150_000) * Math.min(5, (now - t) / 60_000);
  return Math.round(total);
}
