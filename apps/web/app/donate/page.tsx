import type { Metadata } from 'next';
import { DonationFinderPage } from '@/features/donations/DonationFinderPage';
export const metadata: Metadata = { title: 'Donations | SmartCare', description: 'Blood and organ donation community support.' };
export default function DonatePage() { return <DonationFinderPage />; }
