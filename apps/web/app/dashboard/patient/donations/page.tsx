import type { Metadata } from 'next';
import { PatientDonationsFinder } from '@/features/donations/PatientDonationsFinder';
export const metadata: Metadata = { title: 'Donations & Blood Finder | SmartCare' };
export default function PatientDonationsPage() { return <PatientDonationsFinder />; }
