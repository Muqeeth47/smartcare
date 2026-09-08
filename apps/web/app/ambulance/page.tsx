import type { Metadata } from 'next';
import { AmbulancePage } from '@/features/ambulance/AmbulancePage';

export const metadata: Metadata = {
  title: '24/7 Emergency Ambulance Dispatch | SmartCare',
  description: 'Instant GPS ambulance dispatch with trauma centre integration and ICU bed reservation.',
};

export default function Page() {
  return <AmbulancePage />;
}
