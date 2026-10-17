import {
  Building2,
  Activity,
  MapPin,
  TrendingUp,
  Truck,
  Cpu,
  Layers,
  ShieldAlert,
  Pill,
  Users,
  Bed,
} from 'lucide-react';
import type { ElementType } from 'react';

/**
 * One list of in-page sections per workspace. The sidebar, the mobile bottom bar
 * and each page's heading all read from here, so a name only ever lives in one place.
 */
export interface NavSection {
  id: string;
  /** Name shown in the sidebar and as the page heading */
  label: string;
  /** Short name for tight spaces such as the mobile bottom bar */
  shortLabel: string;
  /** One plain sentence under the heading */
  description: string;
  icon: ElementType;
}

// ─── State / District command (admin workspace, `?adminTab=command&commandTab=`) ───
export const DEFAULT_COMMAND_SECTION = 'summary';

export const COMMAND_SECTIONS: NavSection[] = [
  {
    id: 'summary',
    label: 'Overview',
    shortLabel: 'Overview',
    description: 'How every hospital in the district is doing today, and which medicines are running low.',
    icon: Building2,
  },
  {
    id: 'telemetry',
    label: 'Beds & Staff',
    shortLabel: 'Beds',
    description: 'Free beds, staff on duty and patients walking in. Refreshes every 15 minutes.',
    icon: Activity,
  },
  {
    id: 'heatmap',
    label: 'Shortage Map',
    shortLabel: 'Map',
    description: 'See on a map which hospitals are short of which medicines.',
    icon: MapPin,
  },
  {
    id: 'forecasting',
    label: 'Demand Forecast',
    shortLabel: 'Forecast',
    description: 'Medicines we expect to run short soon, so you can act before it happens.',
    icon: TrendingUp,
  },
  {
    id: 'redistribution',
    label: 'Move Stock',
    shortLabel: 'Move stock',
    description: 'Suggested transfers from hospitals with extra stock to hospitals that are running short.',
    icon: Truck,
  },
  {
    id: 'federated',
    label: 'Other States',
    shortLabel: 'States',
    description: 'What other states have learned, shared without any patient details leaving the hospital.',
    icon: Cpu,
  },
  {
    id: 'manifest',
    label: 'Deliveries',
    shortLabel: 'Deliveries',
    description: 'Shipments that are on the road or waiting to be sent.',
    icon: Layers,
  },
  {
    id: 'escalation',
    label: 'Emergency Orders',
    shortLabel: 'Emergency',
    description: 'Raise an urgent alert or place an emergency medicine order.',
    icon: ShieldAlert,
  },
];

export function getCommandSection(id: string | null | undefined): NavSection {
  return COMMAND_SECTIONS.find((s) => s.id === id) ?? COMMAND_SECTIONS[0];
}

export function commandHref(id: string): string {
  return `/dashboard/admin?adminTab=command&commandTab=${id}`;
}

// ─── Admin "hospital operations" page (`?adminTab=operations`) ───
export const OPERATIONS_SECTION: NavSection = {
  id: 'operations',
  label: 'Rooms & Walk-ins',
  shortLabel: 'Rooms',
  description: 'Register walk-in patients and open or close consultation rooms.',
  icon: Users,
};

// ─── Doctor / PHC supply desk (`?module=supply&supplyTab=`) ───
export const DEFAULT_SUPPLY_SECTION = 'inventory';

export const SUPPLY_SECTIONS: NavSection[] = [
  {
    id: 'inventory',
    label: 'Medicine Stock',
    shortLabel: 'Stock',
    description: 'What we have on the shelf, how fast it is being used, and how many days it will last.',
    icon: Pill,
  },
  {
    id: 'shortage',
    label: 'Report a Shortage',
    shortLabel: 'Shortage',
    description: 'Tell the district office right away when a medicine is about to run out.',
    icon: ShieldAlert,
  },
  {
    id: 'inward',
    label: 'Incoming Deliveries',
    shortLabel: 'Incoming',
    description: 'Check in deliveries on the way to this hospital using the 6-digit code from the driver.',
    icon: Truck,
  },
  {
    id: 'resources',
    label: 'Beds & Staff',
    shortLabel: 'Beds',
    description: 'Free beds, oxygen cylinders and staff on duty at this hospital.',
    icon: Bed,
  },
];

export function getSupplySection(id: string | null | undefined): NavSection {
  return SUPPLY_SECTIONS.find((s) => s.id === id) ?? SUPPLY_SECTIONS[0];
}

export function supplyHref(id: string): string {
  return `/dashboard/hospital?module=supply&supplyTab=${id}`;
}
