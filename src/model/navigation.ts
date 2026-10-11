/**
 * The platform's information architecture, straight from the sitemap: ten systems across the top,
 * each with its subsystems along the bottom. Everything that renders navigation (top orbs, bottom
 * tabs, breadcrumbs, routes) reads this one table.
 */

export type SystemId =
  | 'site'
  | 'fire'
  | 'electric'
  | 'community'
  | 'metering'
  | 'security'
  | 'plumbing'
  | 'hvac'
  | 'maintenance'
  | 'integration';

export type GlyphId =
  | 'location'
  | 'fire'
  | 'bolt'
  | 'community'
  | 'meter'
  | 'shield'
  | 'wrench'
  | 'fan'
  | 'gear'
  | 'link';

export interface Subsystem {
  id: string;
  label: string;
}

export interface SystemDef {
  id: SystemId;
  label: string;
  glyph: GlyphId;
  /** Empty for 3D View, which drills down through the site instead of tabs. */
  subsystems: Subsystem[];
}

export const SYSTEMS: SystemDef[] = [
  { id: 'site', label: '3D View', glyph: 'location', subsystems: [] },
  {
    id: 'fire',
    label: 'Fire',
    glyph: 'fire',
    subsystems: [
      { id: 'system', label: 'Fire System' },
      { id: 'detection', label: 'Fire Detection' },
    ],
  },
  {
    id: 'electric',
    label: 'Electric',
    glyph: 'bolt',
    subsystems: [
      { id: 'transformers', label: 'Transformers' },
      { id: 'mdb', label: 'MDB' },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    glyph: 'community',
    subsystems: [
      { id: 'application', label: 'Application' },
      { id: 'navigation', label: 'Navigation' },
      { id: 'crowd', label: 'Crowd Monitoring' },
      { id: 'social', label: 'Social Media' },
    ],
  },
  {
    id: 'metering',
    label: 'Metering',
    glyph: 'meter',
    subsystems: [
      { id: 'energy', label: 'Energy Metering' },
      { id: 'analytics', label: 'Energy Analytics' },
      { id: 'water', label: 'Water Metering' },
      { id: 'btu', label: 'BTU' },
      { id: 'billing', label: 'Billing' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    glyph: 'shield',
    subsystems: [
      { id: 'cctv', label: 'CCTV' },
      { id: 'access', label: 'Access Control' },
      { id: 'parking', label: 'Parking & LPR' },
      { id: 'gates', label: 'Gates' },
    ],
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    glyph: 'wrench',
    subsystems: [
      { id: 'domestic', label: 'Domestic Irrigation' },
      { id: 'pumps', label: 'Pumps' },
    ],
  },
  {
    id: 'hvac',
    label: 'HVAC',
    glyph: 'fan',
    subsystems: [
      { id: 'chilled-water', label: 'Chilled Water' },
      { id: 'ahu', label: 'AHU' },
      { id: 'ventilation', label: 'Ventillation' },
      { id: 'environmental', label: 'Environmental' },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    glyph: 'gear',
    subsystems: [
      { id: 'ticketing', label: 'Ticketing' },
      { id: 'mechanical', label: 'Mechanical' },
      { id: 'electrical', label: 'Electrical' },
      { id: 'pumps', label: 'Pumps' },
      { id: 'sensors', label: 'Sensors' },
    ],
  },
  {
    id: 'integration',
    label: 'Integration',
    glyph: 'link',
    subsystems: [
      { id: 'overview', label: 'Overview' },
      { id: 'mobility', label: 'Mobility' },
      { id: 'facility', label: 'Facility' },
      { id: 'lifestyle', label: 'Staff Lifestyle' },
      { id: 'business', label: 'Business' },
      { id: 'advertising', label: 'Advertising' },
      { id: 'analytics', label: 'Analytics' },
      { id: 'feeds', label: 'Data Feeds' },
      { id: 'sync-log', label: 'Sync Log' },
    ],
  },
];

export const systemById = (id: string | undefined) => SYSTEMS.find((s) => s.id === id);

export function systemPath(system: SystemDef): string {
  return system.subsystems.length ? `/${system.id}/${system.subsystems[0].id}` : '/';
}

export const subsystemPath = (system: SystemId, sub: string) => `/${system}/${sub}`;
