'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Footer } from '@/components/layout/Shell';
import {
  HeartPulse,
  Clock3,
  MapPin,
  HardDrive,
  HeartHandshake,
  Stethoscope,
  LayoutDashboard,
  Sparkles,
  FlaskConical,
  TriangleAlert,
  FileText,
  Monitor,
  KeyRound,
  Map,
  RefreshCw,
  Lock,
  Cookie,
  Trash2,
  Database,
  Navigation,
  Languages,
  Info,
  ScrollText,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

interface InfoPageProps {
  page: 'about' | 'terms' | 'privacy';
}

const PAGES_DATA = {
  about: {
    eyebrow: 'About SmartCare Systems',
    icon: HeartPulse,
    title: 'A high-fidelity healthcare queue and Medical History prototype.',
    intro:
      'SmartCare demonstrates how patients, care providers, and hospital operations teams can coordinate booking, queue handoffs, and browser-local health records in one accessible interface.',
    badges: [
      { icon: Clock3, text: 'Current Queue Snapshot' },
      { icon: MapPin, text: 'Opt-In Location Search' },
      { icon: HardDrive, text: 'Browser-Local Demo Records' },
      { icon: HeartHandshake, text: 'Donation Workflow Demo' },
    ],
    keypointTitle: 'Prototype & Demo Architecture',
    keypointText:
      'This build is an evaluation prototype. It uses a browser-local service for accounts, queues, rooms, prescriptions, and donation workflows, plus public map services for location search. It is not connected to a clinical system or care network.',
    sections: [
      {
        icon: Stethoscope,
        heading: 'Care Discovery & Queue Access',
        text: 'Search public map data and clearly labeled fictional fallback centres, then create a local demo reservation and follow its current queue state.',
      },
      {
        icon: LayoutDashboard,
        heading: 'Hospital Care Workspace',
        text: 'Hospital teams and Hospital Ops can test queue transitions, walk-in intake, local room readiness, Medical History sharing, and e-prescription workflows.',
      },
      {
        icon: HeartHandshake,
        heading: 'Blood & Organ Donation Workflow',
        text: 'Explore a same-device demonstration of donation offers, support requests, and non-binding organ interest without contacting hospitals or official registries.',
      },
      {
        icon: Sparkles,
        heading: 'Triage-First Ordering',
        text: 'The demo orders queue entries by their assigned Red, Yellow, or Green priority and then by arrival time; it does not make clinical triage decisions.',
      },
    ],
  },
  terms: {
    eyebrow: 'Terms and Conditions',
    icon: ScrollText,
    title: 'Clear, transparent expectations for the SmartCare prototype.',
    intro:
      'These terms outline the scope, responsibilities, and guidelines for using the SmartCare web application and demo environment.',
    badges: [
      { icon: FlaskConical, text: 'Evaluation Prototype' },
      { icon: TriangleAlert, text: 'Not for Medical Emergencies' },
      { icon: FileText, text: 'Updated September 2026' },
    ],
    keypointTitle: 'Important User Responsibilities',
    keypointText:
      'By using the SmartCare prototype, you agree not to enter sensitive medical records, protected health information (PHI), or real credentials.',
    sections: [
      {
        icon: Monitor,
        heading: 'Non-Emergency Simulation',
        text: 'SmartCare is a design and workflow prototype. Do not use this demo for life-threatening medical emergencies. Please call your local emergency services (e.g. 108 / 911 / 112) immediately.',
      },
      {
        icon: KeyRound,
        heading: 'Account & Demo Authentication',
        text: 'Role-based Patient, Hospital, and Hospital Ops accounts are provided for evaluation. Use fictional demo credentials and do not submit sensitive personal identifiers.',
      },
      {
        icon: Map,
        heading: 'Location & Map Services',
        text: 'When you choose a device-location or manual search, the query or coordinates are sent to public OpenStreetMap-based services. Selected booking details may then remain in this browser.',
      },
      {
        icon: RefreshCw,
        heading: 'Continuous Improvements',
        text: 'System features, queue metrics, and simulated inventories may update dynamically as new capabilities are tested and refined.',
      },
    ],
  },
  privacy: {
    eyebrow: 'Privacy Notice & Data Security',
    icon: ShieldCheck,
    title: 'Know what this prototype stores and shares.',
    intro:
      'SmartCare is a front-end demonstration, not a production health-record system. Use only fictional information and clear the site’s browser data when you finish evaluating it.',
    badges: [
      { icon: Lock, text: 'Local-First Storage' },
      { icon: Cookie, text: 'Translation Cookie Only' },
      { icon: Trash2, text: 'Clear Through Browser Settings' },
    ],
    keypointTitle: 'Logging Out Is Not Data Deletion',
    keypointText:
      'Signing out removes the active SmartCare session but intentionally keeps local demo profiles, visits, queues, rooms, prescriptions, Medical History records, theme, and donation entries. Clear this site’s cookies and storage in your browser to remove them.',
    sections: [
      {
        icon: Database,
        heading: 'Data Stored in This Demo',
        text: 'The browser can store fictional profiles, booking drafts and visits, queue entries, room states, prescriptions, Medical History fields, donation entries, session details, and interface preferences.',
      },
      {
        icon: Navigation,
        heading: 'Location & External Map Services',
        text: 'Location access starts only when you select it. Manual search text or device coordinates are sent to Nominatim and Overpass/OpenStreetMap-based services to geocode and find nearby places; map assets also load from external providers.',
      },
      {
        icon: HardDrive,
        heading: 'Local Storage Scope',
        text: 'Patient drafts, visits, and Medical History are account-scoped in this browser. Some shared operational demo data, such as queues, donation posts, and prescriptions, is visible across local demo roles by design.',
      },
      {
        icon: Languages,
        heading: 'Language Preference',
        text: 'The optional translation control may set a Google Translate preference cookie. SmartCare does not include advertising or analytics trackers in this build.',
      },
    ],
  },
};

export function InfoPage({ page: initialPage }: InfoPageProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<'about' | 'terms' | 'privacy'>(initialPage);

  const content = PAGES_DATA[currentPage];
  const PageIcon = content.icon;

  const handleTabSwitch = (p: 'about' | 'terms' | 'privacy') => {
    setCurrentPage(p);
    router.push(`/${p}`);
  };

  return (
    <div className="min-h-dvh bg-[var(--surface-sunken)] flex flex-col">
      {/* Topbar */}
      <Topbar variant="landing" />

      {/* Main container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-8 space-y-6">
        {/* Back link & page tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/"
            className="text-xs text-[var(--text-muted)] hover:text-[#0f5ca8] flex items-center gap-1.5 no-underline font-semibold"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>

          {/* Tab switch */}
          <div className="flex flex-wrap sm:inline-flex bg-white border border-[var(--line)] rounded-2xl sm:rounded-full p-1 gap-1 shadow-sm w-full sm:w-auto">
            {(['about', 'terms', 'privacy'] as const).map((p) => {
              const labels = { about: 'About SmartCare', terms: 'Terms of Use', privacy: 'Privacy Notice' };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleTabSwitch(p)}
                  className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-xl sm:rounded-full text-xs font-bold transition-all text-center ${
                    currentPage === p ? 'bg-[#0a3b69] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[#0a3b69]'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero header matching info-hero */}
        <section className="bg-white border border-[var(--line)] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e5f1fc] text-[#0f5ca8] flex items-center justify-center shrink-0">
              <PageIcon size={24} />
            </div>
            <div>
              <div className="eyebrow eyebrow-dark mb-1">
                <span className="eyebrow-dot" />
                {content.eyebrow}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a3b69] tracking-tight">
                {content.title}
              </h1>
            </div>
          </div>

          <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-2">
            {content.intro}
          </p>

          {/* Badges strip */}
          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[var(--line)]">
            {content.badges.map((b) => (
              <span
                key={b.text}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#f0f7fc] text-[#0a3b69] border border-[#c2dcf3]"
              >
                <b.icon size={13} className="text-[#0f5ca8]" />
                <span>{b.text}</span>
              </span>
            ))}
          </div>
        </section>

        {/* Keypoint callout box matching info-keypoints */}
        <section className="p-5 rounded-2xl bg-[#f0f7fc] border border-[#0a3b69]/30 text-xs leading-relaxed">
          <strong className="text-[#0a3b69] font-bold text-sm flex items-center gap-2 mb-1.5">
            <Info size={16} className="text-[#0f5ca8] shrink-0" />
            {content.keypointTitle}
          </strong>
          <p className="text-[#1e3a5f]">{content.keypointText}</p>
        </section>

        {/* 4 Feature cards matching info-cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.sections.map((s) => (
            <div
              key={s.heading}
              className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-sm flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-[#e5f1fc] text-[#0f5ca8] flex items-center justify-center shrink-0 mt-0.5">
                <s.icon size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0a3b69] mb-1">{s.heading}</h2>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
