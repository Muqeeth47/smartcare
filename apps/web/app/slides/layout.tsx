import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pitch Deck',
  description: 'The SmartCare and AushadhiNet presentation deck.',
};

export default function SlidesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
