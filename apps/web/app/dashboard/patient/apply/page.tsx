import { BookingWizard } from '@/features/patient/booking/BookingWizard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Book Appointment | SmartCare' };

export default function BookingPage() {
  return <BookingWizard step={1} />;
}
