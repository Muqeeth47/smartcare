import type { Metadata } from 'next';
import { LandingPage } from '@/features/landing/LandingPage';

export const metadata: Metadata = {
  title: { absolute: 'SmartCare | Care access, simplified' },
  description: 'Find nearby care, see the queue before you leave home, and reserve your place in a few calm, clear steps.',
};

export default function Home() {
  return <LandingPage />;
}
