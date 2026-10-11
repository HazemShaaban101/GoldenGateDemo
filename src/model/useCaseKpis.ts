import { derivedSignal } from '@/sim/catalog';
import type { Signal, SignalDef } from '@/sim/signals';
import { hashString, rand01 } from '@/sim/noise';
import { USE_CASES, type ChannelId, type UseCase } from '@/model/integration';

/**
 * The site-side measures that feed each use case: what the site systems report that the CRM (and the
 * business systems around it) turn into the use case's service. Each use case has four, the first one
 * is the headline measure that gets the trend and the by-area breakdown.
 */

type Shape = 'o' | 'r' | 'f' | 'h' | 'l';
const PROFILE = { o: 'occupancy', r: 'retail', f: 'office', h: 'hvac', l: 'flat' } as const;

/** [label, unit, low, high, shape, decimals] */
type K = [string, string, number, number, Shape, number?];

const SPEC: Record<string, [K, K, K, K]> = {
  // ---- Mobility and Transport ----
  'mobility-01': [['Reserved Bays Occupied', '%', 48, 91, 'f'], ['Subscriber Entries', 'cars/h', 3, 62, 'f'], ['Plate Read Accuracy', '%', 97.6, 98.9, 'l', 1], ['Unauthorised Entries', 'cars/h', 0, 4, 'f']],
  'mobility-02': [['Visitor Bays Free', 'bays', 410, 60, 'o'], ['Pre-booked Arrivals', 'cars/h', 2, 48, 'o'], ['Booking No-show Rate', '%', 6, 12, 'l', 1], ['Average Dwell Time', 'min', 38, 96, 'r']],
  'mobility-03': [['Chargers In Use', '%', 10, 78, 'o'], ['Energy Dispensed', 'kW', 15, 410, 'r'], ['Average Session', 'min', 22, 48, 'r'], ['Charger Availability', '%', 92, 100, 'l']],
  'mobility-04': [['Valet Requests', 'req/h', 0, 34, 'o'], ['Vehicles In Valet Care', 'cars', 0, 120, 'o'], ['Average Handover Time', 'min', 3, 7, 'o', 1], ['Average Retrieval Wait', 'min', 4, 11, 'o', 1]],
  'mobility-05': [['Car Park Occupancy', '%', 35, 96, 'o'], ['Entries', 'cars/h', 5, 420, 'o'], ['Average Dwell Time', 'min', 52, 118, 'r'], ['Time Above 85% Full', 'min/h', 0, 38, 'o']],
  'mobility-06': [['Sessions From Retail Zones', 'cars/h', 4, 310, 'r'], ['Average Stay', 'min', 52, 110, 'r'], ['Repeat Visitors', '%', 28, 40, 'l'], ['Peak Occupancy', '%', 60, 96, 'o']],
  'mobility-07': [['Service Bookings Started', 'jobs/h', 0, 16, 'o'], ['Cars On Site For Service', 'cars', 0, 44, 'o'], ['Average Service Wait', 'min', 20, 55, 'r'], ['Service Bay Use', '%', 12, 86, 'o']],
  'mobility-08': [['Adjacent Vehicles On Site', 'cars', 0, 180, 'f'], ['Gate Entries', 'cars/h', 1, 74, 'f'], ['Average Stay', 'h', 4, 9, 'f', 1], ['Long-stay Bays Used', '%', 10, 82, 'f']],
  // ---- Facility and Office Support ----
  'facility-01': [['Zones Cleaned On Time', '%', 88, 99, 'l'], ['Crew On Site', 'people', 0, 18, 'f'], ['Average Visit Length', 'min', 18, 34, 'f'], ['Crew Access Events', 'events/h', 0, 40, 'f']],
  'facility-02': [['Open Requests', 'jobs', 4, 22, 'f'], ['Average Response Time', 'min', 18, 55, 'f'], ['Jobs Completed', 'jobs/h', 0, 9, 'f'], ['Faults Detected By BMS', 'faults/h', 0, 6, 'h']],
  'facility-03': [['Traps Checked', '%', 90, 100, 'l'], ['Activity Alerts', 'alerts', 0, 4, 'l'], ['Days Since Incident', 'days', 12, 45, 'l'], ['Zones Treated', 'zones', 0, 12, 'f']],
  'facility-04': [['Carbon Dioxide', 'ppm', 410, 780, 'o'], ['Fine Particles PM2.5', 'µg/m³', 8, 18, 'r'], ['Humidity', '%', 40, 52, 'h'], ['Zones In Comfort Band', '%', 90, 99, 'l']],
  'facility-05': [['Tenant Load', 'kW', 600, 2100, 'r'], ['HVAC Share Of Load', '%', 38, 52, 'h'], ['Saving Vs Baseline', '%', 4, 11, 'l', 1], ['Peak Demand Today', 'kW', 1900, 2300, 'l']],
  'facility-06': [['Telecom Room Temperature', '°C', 22, 27, 'h', 1], ['Telecom Room Humidity', '%', 38, 52, 'h'], ['Telecom Room Access', 'events/h', 0, 6, 'f'], ['UPS Autonomy', 'min', 38, 46, 'l']],
  'facility-07': [['Carbon Emissions', 'kg CO₂e/h', 380, 1100, 'r'], ['Energy Today', 'MWh', 12.8, 15.6, 'l', 1], ['Water Use', 'm³/h', 18, 140, 'r', 1], ['Renewable Share', '%', 12, 26, 'h']],
  // ---- Staff Lifestyle ----
  'lifestyle-01': [['Devices In Food Court', 'devices', 20, 1100, 'o'], ['Average Dwell Time', 'min', 14, 38, 'o'], ['Peak Crowd Density', '%', 8, 86, 'o'], ['Queue-zone Dwell', 'min', 2, 9, 'o', 1]],
  'lifestyle-02': [['Staff Vehicles On Site', 'cars', 40, 900, 'f'], ['Average Time On Site', 'h', 7, 9, 'f', 1], ['Wash Bays In Use', '%', 0, 80, 'f'], ['Midday Exits', 'cars/h', 0, 46, 'f']],
  'lifestyle-03': [['Gym Entries', 'people/h', 0, 60, 'o'], ['People In Gym', 'people', 2, 95, 'o'], ['Average Session', 'min', 45, 75, 'l'], ['Access Denied', 'events/h', 0, 3, 'o']],
  'lifestyle-04': [['Lounge Occupancy', '%', 8, 85, 'f'], ['Noise Level', 'dB', 38, 58, 'f'], ['Zone Temperature', '°C', 22, 24.5, 'h', 1], ['Lounge Entries', 'people/h', 0, 48, 'f']],
  // ---- Business Support ----
  'business-01': [['Rooms Booked', '%', 15, 92, 'f'], ['Rooms Occupied Now', 'rooms', 2, 24, 'f'], ['AV Systems Active', 'systems', 1, 22, 'f'], ['Average Meeting Length', 'min', 35, 62, 'l']],
  'business-02': [['People In Event Space', 'people', 0, 420, 'f'], ['Check-ins', 'people/h', 0, 160, 'f'], ['Hall Cooling Load', '%', 20, 88, 'h'], ['Average Setup Time', 'min', 40, 85, 'l']],
  'business-03': [['Day Passes Active', 'passes', 0, 70, 'f'], ['Desk Occupancy', '%', 8, 84, 'f'], ['Door Entries', 'events/h', 0, 52, 'f'], ['Average Stay', 'h', 4, 7, 'l', 1]],
  'business-04': [['Active Streams', 'streams', 0, 4, 'f'], ['AV Rooms In Use', 'rooms', 0, 9, 'f'], ['AV Equipment Uptime', '%', 98.5, 100, 'l', 1], ['Average Start Delay', 'min', 1, 6, 'l', 1]],
  'business-05': [['Sessions Running', 'sessions', 0, 8, 'f'], ['Attendees On Site', 'people', 0, 190, 'f'], ['Room Utilisation', '%', 6, 78, 'f'], ['Check-in Rate', '%', 82, 98, 'l']],
  'business-06': [['Appointments Running', 'meetings', 0, 7, 'f'], ['Meeting Rooms In Use', 'rooms', 0, 9, 'f'], ['Visitor Check-ins', 'people/h', 0, 22, 'f'], ['Average Wait', 'min', 2, 9, 'f', 1]],
  'business-07': [['Resident Teams', 'teams', 12, 12, 'l'], ['Desk Utilisation', '%', 12, 82, 'f'], ['After-hours Entries', 'events/h', 0, 9, 'o'], ['Energy Per Desk', 'kWh', 2.1, 4.4, 'f', 1]],
  // ---- Beacon Advertising and In-App Media ----
  'beacon-01': [['Proximity Events', 'events/min', 40, 1400, 'o'], ['Devices In Range', 'devices', 25, 1250, 'o'], ['Verified Impressions', 'impr/h', 300, 21000, 'o'], ['Average Dwell In Range', 'min', 3, 11, 'o', 1]],
  'beacon-02': [['Beacons Online', '%', 96, 100, 'l', 1], ['Impressions', 'impr/h', 300, 21000, 'o'], ['Zones Covered', 'zones', 34, 38, 'l'], ['Average Dwell In Range', 'min', 3, 11, 'o', 1]],
  'beacon-03': [['Footfall In Campaign Zones', 'people/h', 80, 4200, 'o'], ['Impressions', 'impr/h', 300, 18000, 'o'], ['Average Dwell Time', 'min', 4, 13, 'o', 1], ['Peak-hour Footfall', 'people/h', 3500, 4600, 'l']],
  'beacon-04': [['Sponsored Zone Footfall', 'people/h', 40, 2100, 'o'], ['Average Dwell Time', 'min', 4, 14, 'o', 1], ['Share Of Mall Traffic', '%', 11, 17, 'l'], ['Screens In Zone', 'screens', 6, 6, 'l']],
  'beacon-05': [['Screens Playing', 'screens', 20, 60, 'r'], ['Audience In View', 'people', 60, 5200, 'o'], ['Play Confirmations', 'plays/h', 300, 1900, 'r'], ['Playout Uptime', '%', 98.8, 100, 'l', 1]],
  'beacon-06': [['Impressions', 'impr/h', 200, 15000, 'o'], ['Devices Reached', 'devices', 20, 980, 'o'], ['Average Dwell Time', 'min', 3, 10, 'o', 1], ['Audience At Screens', 'people', 30, 2400, 'o']],
  'beacon-07': [['Wayfinding Sessions', 'sessions/h', 2, 260, 'o'], ['Route Requests', 'req/h', 4, 410, 'o'], ['Average Route Length', 'm', 180, 320, 'l'], ['Sponsored Route Share', '%', 14, 24, 'l']],
  'beacon-08': [['Active App Users', 'users', 40, 2600, 'o'], ['App Sessions', 'sessions/h', 30, 1800, 'o'], ['Devices In Range', 'devices', 25, 1250, 'o'], ['Average Session', 'min', 4, 9, 'l', 1]],
  // ---- Data and Analytics ----
  'data-01': [['Data Points Delivered', 'pts/min', 1000, 3900, 'o'], ['Tenants Served', 'tenants', 38, 38, 'l'], ['Refresh Latency', 's', 2, 5, 'o', 1], ['Data Completeness', '%', 98.2, 99.6, 'l', 1]],
  'data-02': [['Mall Footfall', 'people/h', 150, 14500, 'o'], ['Footfall Vs Last Week', '%', 96, 108, 'l', 1], ['Brand Zones Counted', 'zones', 52, 52, 'l'], ['Peak-hour Footfall', 'people/h', 13200, 14800, 'l']],
  'data-03': [['Panel Members Opted In', 'members', 1480, 1560, 'l'], ['Anonymised Records', 'rec/h', 400, 9200, 'o'], ['Panel Coverage', '%', 12, 15, 'l', 1], ['Privacy Checks Passed', '%', 100, 100, 'l']],
  'data-04': [['Occupancy Rate', '%', 88, 94, 'l', 1], ['Average Visit Dwell', 'min', 52, 96, 'r'], ['Parking Turnover', 'cars/bay', 1.2, 3.4, 'r', 1], ['Data Completeness', '%', 97.5, 99.8, 'l', 1]],
  'data-05': [['Visitors Counted', 'people/h', 150, 14500, 'o'], ['Average Group Size', 'people', 2.1, 2.8, 'l', 1], ['Segments Tracked', 'segments', 9, 9, 'l'], ['Anonymisation Rate', '%', 100, 100, 'l']],
  'data-06': [['Hot-zone Density', '%', 12, 90, 'o'], ['Zones Mapped', 'zones', 52, 52, 'l'], ['Trajectories Captured', 'paths/h', 80, 5400, 'o'], ['Average Path Length', 'm', 210, 360, 'l']],
  'data-07': [['Metrics Exported', 'metrics', 118, 124, 'l'], ['Benchmark Completeness', '%', 96, 99.5, 'l', 1], ['Sites Compared', 'sites', 6, 6, 'l'], ['Export Latency', 'min', 4, 12, 'l', 1]],
  'data-08': [['Verified Impressions', 'impr/h', 300, 21000, 'o'], ['Screens Audited', 'screens', 20, 60, 'r'], ['Play Match Rate', '%', 98.1, 99.8, 'l', 1], ['Average Audience Per Play', 'people', 6, 38, 'o']],
  'data-09': [['Energy Intensity', 'Wh/m²', 14, 38, 'h', 1], ['Chiller Efficiency', 'COP', 5.4, 4.6, 'h', 1], ['Water Per Visitor', 'L', 4, 9, 'o', 1], ['Carbon Intensity', 'g CO₂e/kWh', 410, 470, 'l']],
};

export interface UcKpi {
  label: string;
  unit: string;
  signal: Signal;
}

export const useCaseKey = (u: UseCase) => `${u.channel}-${u.no}`;

/** The four measures of a use case, as simulated signals. */
export function kpisOf(u: UseCase): UcKpi[] {
  const key = useCaseKey(u);
  return SPEC[key].map(([label, unit, low, high, shape, decimals = 0], i) => {
    const def: SignalDef = { unit, low, high, profile: PROFILE[shape], noise: low === high ? 0 : 0.07, dayVariance: shape === 'l' ? 0.01 : undefined, decimals, clampMin: 0 };
    return { label, unit, signal: derivedSignal(`uc.${key}.${i}`, def) };
  });
}

const AREAS: Record<ChannelId, string[]> = {
  mobility: ['Level P1', 'Level P2', 'Level P3', 'Level P4'],
  facility: ['Block A', 'Block B', 'Block C', 'Block D'],
  lifestyle: ['Atrium', 'Food court', 'Fitness', 'Lounges'],
  business: ['Floor 1', 'Floor 2', 'Floor 3', 'Floor 4'],
  beacon: ['North plaza', 'Atrium', 'Food court', 'South gate'],
  data: ['Zone A', 'Zone B', 'Zone C', 'Zone D'],
};

/** The headline measure split across four areas (each a share of the whole, stable per use case). */
export function areasOf(u: UseCase): { label: string; signal: Signal }[] {
  const head = kpisOf(u)[0];
  const key = useCaseKey(u);
  return AREAS[u.channel].map((label, i) => {
    const k = 0.62 + rand01(hashString(`${key}.${i}`), 7) * 0.8;
    const d = head.signal.def;
    const pct = d.unit === '%' ? Math.min(1.08, k) : k;
    return {
      label,
      signal: derivedSignal(`uc.${key}.area.${i}`, { ...d, low: d.low * pct, high: d.high * pct, clampMax: d.unit === '%' ? 100 : undefined }),
    };
  });
}

export const useCasesOf = (channel: ChannelId) => USE_CASES.filter((u) => u.channel === channel);
