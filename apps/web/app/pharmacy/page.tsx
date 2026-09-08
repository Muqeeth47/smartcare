import type { Metadata } from 'next';
import { PharmacyPage } from '@/features/pharmacy/PharmacyPage';

export const metadata: Metadata = {
  title: 'In-House Hospital Pharmacy | SmartCare Digital Health',
  description: 'Order prescribed medications with Jan Aushadhi generic savings, counter pickup, and live status tracking.',
};

export default function Page() {
  return <PharmacyPage />;
}
