import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type Screen = LazyExoticComponent<ComponentType>;
const named = <K extends string>(loader: () => Promise<Record<K, ComponentType>>, key: K): Screen =>
  lazy(() => loader().then((m) => ({ default: m[key] })));

const electric = () => import('@/screens/electric/ElectricScreens');
const metering = () => import('@/screens/metering/MeteringScreens');
const plumbing = () => import('@/screens/plumbing/PlumbingScreens');
const hvac = () => import('@/screens/hvac/HvacScreens');
const security = () => import('@/screens/security/SecurityScreens');
const community = () => import('@/screens/community/CommunityScreens');
const integration = () => import('@/screens/integration/IntegrationScreens');
const maintenance = () => import('@/screens/maintenance/MaintenanceScreens');

/** Screen for each `${system}/${subsystem}` route. */
export const SCREENS: Record<string, Screen> = {
  'fire/system': lazy(() => import('@/screens/fire/FireSystemScreen')),
  'fire/detection': lazy(() => import('@/screens/fire/FireDetectionScreen')),
  'electric/transformers': named(electric, 'TransformersScreen'),
  'electric/mdb': named(electric, 'MdbScreen'),
  'metering/energy': named(metering, 'EnergyMeteringScreen'),
  'metering/analytics': named(metering, 'EnergyAnalyticsScreen'),
  'metering/water': named(metering, 'WaterMeteringScreen'),
  'metering/btu': named(metering, 'BtuScreen'),
  'metering/billing': lazy(() => import('@/screens/metering/BillingScreen').then((m) => ({ default: m.BillingScreen }))),
  'plumbing/domestic': named(plumbing, 'DomesticScreen'),
  'plumbing/pumps': named(plumbing, 'PumpsScreen'),
  'hvac/chilled-water': named(hvac, 'ChilledWaterScreen'),
  'hvac/ahu': named(hvac, 'AhuScreen'),
  'hvac/ventilation': named(hvac, 'VentilationScreen'),
  'hvac/environmental': named(hvac, 'EnvironmentalScreen'),
  'security/cctv': named(security, 'CctvScreen'),
  'security/access': named(security, 'AccessScreen'),
  'security/parking': named(security, 'ParkingScreen'),
  'security/gates': named(security, 'GatesScreen'),
  'community/application': named(community, 'ApplicationScreen'),
  'community/navigation': named(community, 'NavigationScreen'),
  'community/crowd': named(community, 'CrowdScreen'),
  'community/social': named(community, 'SocialScreen'),
  'maintenance/ticketing': named(maintenance, 'TicketingScreen'),
  'maintenance/mechanical': named(maintenance, 'MechanicalScreen'),
  'maintenance/electrical': named(maintenance, 'ElectricalScreen'),
  'maintenance/pumps': named(maintenance, 'MaintenancePumpsScreen'),
  'maintenance/sensors': named(maintenance, 'SensorsScreen'),
  'integration/overview': named(integration, 'OverviewScreen'),
  'integration/feeds': named(integration, 'FeedsScreen'),
  'integration/mobility': named(integration, 'MobilityScreen'),
  'integration/facility': named(integration, 'FacilityScreen'),
  'integration/lifestyle': named(integration, 'LifestyleScreen'),
  'integration/business': named(integration, 'BusinessScreen'),
  'integration/advertising': named(integration, 'AdvertisingScreen'),
  'integration/analytics': named(integration, 'AnalyticsScreen'),
  'integration/sync-log': named(integration, 'SyncLogScreen'),
};
