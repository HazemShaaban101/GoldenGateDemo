/**
 * The physical model of the site: buildings on the campus render, floors of A02, fire zones on the
 * top-view map, and the devices placed on the floor plan per system. Coordinates are design pixels
 * taken from the Figma exports (hotspot paths in Frame 488 / 490 / Fire System-1).
 */

export interface Building {
  id: string;
  label: string;
  /** Polygon on the campus render, stage coordinates. */
  outline: string;
  /** Tooltip anchor. */
  anchor: { x: number; y: number };
  floors: FloorDef[];
  detailed: boolean;
  use: string;
}

export interface FloorDef {
  id: string;
  label: string;
}

const A02_FLOORS: FloorDef[] = [
  { id: 'ur', label: 'UR' },
  { id: 'r', label: 'R' },
  { id: 'f3', label: 'F3' },
  { id: 'f2', label: 'F2' },
  { id: 'ff', label: 'FF' },
  { id: 'gf', label: 'GF' },
];

/**
 * Buildings on the campus render (stage coordinates of campus.webp at 323,219 1301×732), each traced
 * around its own mass (roofline, end faces and front base) the way the design traces A02 (Frame 488
 * hotspot); streets, plazas and landscaping between them belong to no building. The dense west end is
 * traced per cluster of connected buildings. A02 comes last so it sits on top for hover.
 */
export const BUILDINGS: Building[] = [
  { id: 'c01', label: 'C01', use: 'Hypermarket & services · 2 levels', detailed: false, outline: 'M372 356 L394 338 L448 322 L501 307 L536 310 L540 338 L545 420 L448 409 L416 390 Z', anchor: { x: 459, y: 315 }, floors: A02_FLOORS.slice(2) },
  { id: 'c02', label: 'C02', use: 'Retail pavilions · 3 levels', detailed: false, outline: 'M540 338 L560 326 L598 333 L648 347 L701 368 L700 420 L705 470 L648 466 L613 448 L560 424 L545 420 Z', anchor: { x: 623, y: 334 }, floors: A02_FLOORS.slice(2) },
  { id: 'b03', label: 'B03', use: 'Offices · 5 levels', detailed: false, outline: 'M701 368 L751 366 L800 379 L828 394 L848 404 L848 470 L815 478 L815 490 L790 495 L760 490 L725 478 L705 470 L700 420 Z', anchor: { x: 774, y: 374 }, floors: A02_FLOORS.slice(2) },
  { id: 'b02', label: 'B02', use: 'Mixed use · 4 levels', detailed: false, outline: 'M848 404 L872 398 L898 401 L925 414 L942 420 L978 422 L1003 422 L1003 448 L1000 519 L950 520 L948 566 L813 519 L815 478 L848 470 Z', anchor: { x: 908, y: 406 }, floors: A02_FLOORS.slice(2) },
  { id: 'b01', label: 'B01', use: 'Anchor store & cinema · 4 levels', detailed: false, outline: 'M950 520 L1000 519 L1003 448 L1150 476 L1168 478 L1134 555 L1102 558 L1102 598 L1075 613 L952 580 Z', anchor: { x: 1059, y: 456 }, floors: A02_FLOORS.slice(2) },
  { id: 'a01', label: 'A01', use: 'Food court & retail · 3 levels', detailed: false, outline: 'M1168 478 L1249 500 L1250 600 L1247 660 L1227 676 L1100 636 L1100 560 L1134 555 Z', anchor: { x: 1175, y: 486 }, floors: A02_FLOORS.slice(2) },
  { id: 'a03', label: 'A03', use: 'Clinics & lifestyle · 4 levels', detailed: false, outline: 'M1257 530 L1298 514 L1343 526 L1352 540 L1409 548 L1457 556 L1491 570 L1494 611 L1481 650 L1430 662 L1362 632 L1343 608 L1257 607 Z', anchor: { x: 1376, y: 522 }, floors: A02_FLOORS.slice(2) },
  {
    id: 'a02',
    label: 'A02',
    use: 'Retail & Offices · 6 levels',
    detailed: true,
    outline:
      'M1276.75 614.43L1247.73 664.73C1247.62 664.91 1247.55 665.1 1247.51 665.31L1242.36 689.34C1242.15 690.3 1242.67 691.26 1243.59 691.62L1395.43 750.86C1396.37 751.23 1397.43 750.84 1397.91 749.96L1414.95 718.72C1415.03 718.58 1415.09 718.42 1415.13 718.25L1428.12 666.78C1428.38 665.77 1427.82 664.74 1426.83 664.4L1279.13 613.54C1278.23 613.23 1277.23 613.6 1276.75 614.43Z',
    anchor: { x: 1335, y: 610 },
    floors: A02_FLOORS,
  },
];

export const buildingById = (id: string | undefined) => BUILDINGS.find((b) => b.id === id);

/**
 * Floor bands on A02's render (building-a02.webp cover-fitted into the stage frame). Each floor line is
 * given as its y at the building's left end, front corner and right end; the lines were measured on the
 * render (dark slabs between lit glass) and FF is the design's own band. UR is the set-back rooftop
 * floor, R the roof terrace's parapet and planters.
 */
const EDGE_X = [1059.5, 1410.5, 1801.5] as const;
type FloorLine = readonly [number, number, number];
const LINE = {
  parapet: [530, 590, 505],
  roof: [563, 624, 532],
  f3: [612, 685, 578],
  f2: [660.5, 738.4, 615.2],
  ff: [698.5, 791.9, 653.1],
  ground: [808, 858, 723],
} satisfies Record<string, FloorLine>;

function band(top: FloorLine, bottom: FloorLine) {
  const at = (line: FloorLine, i: number) => `${EDGE_X[i]} ${line[i]}`;
  return `M${at(top, 0)} L${at(top, 1)} L${at(top, 2)} L${at(bottom, 2)} L${at(bottom, 1)} L${at(bottom, 0)} Z`;
}

export const A02_FLOOR_BANDS: Record<string, string> = {
  gf: band(LINE.ff, LINE.ground),
  ff: band(LINE.f2, LINE.ff),
  f2: band(LINE.f3, LINE.f2),
  f3: band(LINE.roof, LINE.f3),
  r: band(LINE.parapet, LINE.roof),
  // The set-back rooftop floor: the main volume, stepping down to a lower section at its left end.
  ur: 'M1055 497 L1115 496 L1116 479 L1285 481 L1285 524 L1055 523 Z',
};

/** Fire zones across the top-view site map (stage coords of the Fire Detection frame). */
export const FIRE_ZONES = [
  { id: 1, label: 'Zone 1', x0: 1260, x1: 1788 },
  { id: 2, label: 'Zone 2', x0: 690, x1: 1260 },
  { id: 3, label: 'Zone 3', x0: 131, x1: 690 },
];

/** The blocks that light up for a Zone 1 alarm (Fire System-1 hotspot paths). */
export const ZONE1_ALARM_BLOCKS = [
  'M1632.5 624.5V699C1632.5 700.1 1633.4 701 1634.5 701H1709C1710.1 701 1711 700.1 1711 699V624.5C1711 623.4 1710.1 622.5 1709 622.5H1634.5C1633.4 622.5 1632.5 623.4 1632.5 624.5Z',
  'M1539 624V698.5C1539 699.6 1539.9 700.5 1541 700.5H1615.5C1616.6 700.5 1617.5 699.6 1617.5 698.5V624C1617.5 622.9 1616.6 622 1615.5 622H1541C1539.9 622 1539 622.9 1539 624Z',
  'M1560.5 788V799.5C1560.5 800.6 1561.4 801.5 1562.5 801.5L1683.5 801.2C1684.6 801.2 1685.5 800.3 1685.5 799.2L1684.5 736C1684.5 734.9 1683.6 734 1682.5 734H1556.5C1555.4 734 1554.5 734.9 1554.5 736V784C1554.5 785.1 1555.4 786 1556.5 786H1558.5C1559.6 786 1560.5 786.9 1560.5 788Z',
];

/* ---------------------------------------------------------------------------------------------
 * Floor-plan devices (coordinates are % of the floor-plan image, so they stay put when it scales).
 * ------------------------------------------------------------------------------------------- */

export type OverlaySystem = 'hvac' | 'elevators' | 'metering' | 'dampers' | 'fire';

export const OVERLAY_SYSTEMS: { id: OverlaySystem; label: string }[] = [
  { id: 'hvac', label: 'HVAC' },
  { id: 'elevators', label: 'Elevators' },
  { id: 'metering', label: 'Metering' },
  { id: 'dampers', label: 'Dampers' },
  { id: 'fire', label: 'Fire Alarm' },
];

export interface PlanDevice {
  id: string;
  system: OverlaySystem;
  label: string;
  x: number;
  y: number;
  /** Opens the equipment view (live AHU). */
  equipment?: string;
}

export const PLAN_DEVICES: PlanDevice[] = [
  { id: 'fcu-01', system: 'hvac', label: 'FCU-01', x: 26, y: 20 },
  { id: 'fcu-02', system: 'hvac', label: 'FCU-02', x: 53, y: 18 },
  { id: 'fcu-03', system: 'hvac', label: 'FCU-03', x: 83, y: 22 },
  { id: 'fcu-04', system: 'hvac', label: 'FCU-04', x: 18, y: 72 },
  { id: 'fcu-05', system: 'hvac', label: 'FCU-05', x: 58, y: 76 },
  { id: 'fcu-06', system: 'hvac', label: 'FCU-06', x: 86, y: 74 },
  { id: 'fahu-01', system: 'hvac', label: 'FAHU-01', x: 72, y: 47, equipment: 'FAHU-01' },
  { id: 'elv-01', system: 'elevators', label: 'Elevator 1', x: 35.5, y: 57 },
  { id: 'elv-02', system: 'elevators', label: 'Elevator 2', x: 40, y: 57 },
  { id: 'elv-03', system: 'elevators', label: 'Elevator 3', x: 76, y: 60 },
  { id: 'mtr-01', system: 'metering', label: 'Main Meter · GF-East', x: 78.5, y: 44 },
  { id: 'mtr-02', system: 'metering', label: 'Tenant Meter · GF-West', x: 20, y: 38 },
  { id: 'mvd-01', system: 'dampers', label: 'MVD #1', x: 21.5, y: 42 },
  { id: 'mvd-02', system: 'dampers', label: 'MVD #2', x: 36, y: 62 },
  { id: 'mvd-03', system: 'dampers', label: 'MVD #3', x: 66, y: 62 },
  { id: 'mvd-04', system: 'dampers', label: 'MVD #4', x: 14, y: 74 },
  { id: 'mvd-05', system: 'dampers', label: 'MVD #5', x: 24, y: 86 },
  { id: 'sd-01', system: 'fire', label: 'SD-01', x: 22, y: 30 },
  { id: 'sd-02', system: 'fire', label: 'SD-02', x: 45, y: 28 },
  { id: 'sd-03', system: 'fire', label: 'SD-03', x: 70, y: 30 },
  { id: 'sd-04', system: 'fire', label: 'SD-04', x: 30, y: 78 },
  { id: 'sd-05', system: 'fire', label: 'SD-05', x: 62, y: 80 },
  { id: 'sd-06', system: 'fire', label: 'SD-06', x: 85, y: 78 },
];
