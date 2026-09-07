'use client';

import { useState, useEffect } from 'react';
import { DemoDB } from '@/lib/db/demo-db';
import { WorkspaceShell, PatientShell } from '@/components/layout/Shell';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useSession, useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import type { DonationsData, DonationType, HospitalDonationPost } from '@smartcare/types';
import {
  Heart,
  Droplets,
  Activity,
  HeartHandshake,
  Upload,
  Download,
  Info,
  Phone,
  Send,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Check,
} from 'lucide-react';

interface DonationsPageProps {
  role?: string;
}

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
const ORGANS = ['Kidney', 'Liver', 'Heart', 'Cornea', 'Lung', 'Pancreas'];

export function DonationsPage({ role: roleProp }: DonationsPageProps) {
  const { role: authRole } = useAuthGuard();
  const { hospital, city } = useSession();
  const showToast = useAppStore((s) => s.showToast);

  const [data, setData] = useState<DonationsData>({ hospitalPosts: [], patientPosts: [] });
  const [donationType, setDonationType] = useState<DonationType>('blood');
  const [mode, setMode] = useState<'offer' | 'request'>('offer');

  // Form states
  const [selectedGroup, setSelectedGroup] = useState('O+');
  const [selectedOrgan, setSelectedOrgan] = useState('Kidney');
  const [units, setUnits] = useState('4');
  const [urgency, setUrgency] = useState<'Routine' | 'Urgent' | 'Emergency'>('Routine');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setData(DemoDB.getDonationsData());
  }, []);

  const effectiveRole = roleProp || authRole;
  const isPatientView = effectiveRole === 'patient';
  const Shell = isPatientView ? PatientShell : WorkspaceShell;
  const shellProps = isPatientView
    ? { subtitle: 'Donations', backHref: '/dashboard/patient' }
    : { title: 'Donations', subtitle: 'Hospital portal' };

  // Filter matching records
  const targetPatientMode = mode === 'offer' ? 'receive' : 'give';
  const matchingPatients = data.patientPosts.filter(
    (p) => p.type === donationType && p.mode === targetPatientMode
  );
  const filteredHospitalPosts = data.hospitalPosts.filter((h) => h.type === donationType);

  const handleContactPatient = (name: string, group: string) => {
    showToast(`Demo coordinator outreach initiated for ${name} (${group}).`, 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (donationType === 'organ' && !consent) {
      showToast('Please confirm clinical compliance before recording organ case.', 'error');
      return;
    }

    setSubmitting(true);
    const postGroup = donationType === 'blood' ? selectedGroup : selectedOrgan;
    const unitNum = units ? Number(units) : 1;

    const newPost = DemoDB.addHospitalDonation({
      type: donationType,
      mode: mode,
      group: postGroup,
      units: unitNum,
      hospital: hospital || 'SmartCare Central Hospital',
      city: city || 'Hyderabad',
      urgency: urgency,
      notes: notes.trim() || (donationType === 'blood' ? 'Main Blood Bank Wing' : 'Transplant Evaluation Demo'),
    });

    // Refresh local state
    setData(DemoDB.getDonationsData());
    setSubmitting(false);
    setNotes('');
    setConsent(false);

    showToast(
      mode === 'offer'
        ? `Saved ${unitNum} unit(s) of ${postGroup} availability to the local demo pool.`
        : `Posted ${postGroup} requirement to local coordination pool.`,
      'success'
    );
  };

  return (
    <Shell {...(shellProps as any)}>
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--line)]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--teal)] uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Blood Bank &amp; Organ Network
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
              Explore centre donation workflows.
            </h1>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              {hospital || 'SmartCare Community Hospital'} · {city || 'Hyderabad'}
            </p>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl px-4 py-3 shadow-xs text-right sm:shrink-0">
            <span className="text-xs text-[var(--muted)] block">Simulated Network</span>
            <strong className="text-sm font-extrabold text-[var(--teal)]">Local Demo Pool</strong>
          </div>
        </div>

        {/* Prototype Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-2.5">
          <Info size={18} className="shrink-0 text-amber-600 mt-0.5" />
          <span>
            <strong>Evaluation Demo Only:</strong> All records are stored locally on this device. No patients, donors, external blood banks, NOTTO registries, or emergency services are notified.
          </span>
        </div>

        {/* Category Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3 shadow-xs">
          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider px-2">
            Donation Category
          </span>
          <div className="flex items-center gap-2 bg-[var(--surface-sunken)] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setDonationType('blood');
                setSelectedGroup('O+');
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all',
                donationType === 'blood'
                  ? 'bg-[var(--teal)] text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              )}
            >
              <Droplets size={16} />
              <span>Blood bank</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDonationType('organ');
                setSelectedOrgan('Kidney');
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all',
                donationType === 'organ'
                  ? 'bg-[var(--teal)] text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              )}
            >
              <Activity size={16} />
              <span>Organ pool</span>
            </button>
          </div>
        </div>

        {/* 2-Column Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Hospital Action Mode & Form */}
          <div className="lg:col-span-6 bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-2">
                Hospital Action Mode
              </span>
              <div className="grid grid-cols-2 gap-2 bg-[var(--surface-sunken)] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('offer')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all',
                    mode === 'offer'
                      ? 'bg-[var(--teal)] text-white shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  )}
                >
                  <Upload size={15} />
                  <span>We can offer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('request')}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all',
                    mode === 'request'
                      ? 'bg-[var(--teal)] text-white shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  )}
                >
                  <Download size={15} />
                  <span>We need units</span>
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-[var(--ink)]">
                {donationType === 'blood'
                  ? mode === 'offer'
                    ? 'Publish blood stock availability'
                    : 'Post urgent blood requirement'
                  : mode === 'offer'
                  ? 'Record organ availability scenario'
                  : 'Record organ requirement scenario'}
              </h2>
              <p className="text-xs text-[var(--muted)] mt-1">
                {donationType === 'blood'
                  ? mode === 'offer'
                    ? 'Record available blood units in your hospital inventory for community discovery.'
                    : 'Broadcast an urgent shortage to registered donors and sister healthcare facilities.'
                  : 'Simulate authorized hospital coordinator workflows on this device.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Group / Organ Select */}
              {donationType === 'blood' ? (
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
                    Blood Group
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {BLOOD_GROUPS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGroup(g)}
                        className={cn(
                          'py-2 text-xs font-extrabold rounded-xl border transition-all',
                          selectedGroup === g
                            ? 'border-[var(--teal)] bg-[var(--mint)] text-[var(--teal)] shadow-xs'
                            : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--teal)]/40'
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
                    Organ Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ORGANS.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setSelectedOrgan(o)}
                        className={cn(
                          'py-2 text-xs font-bold rounded-xl border transition-all',
                          selectedOrgan === o
                            ? 'border-[var(--teal)] bg-[var(--mint)] text-[var(--teal)] shadow-xs'
                            : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--teal)]/40'
                        )}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Units & Urgency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">
                    Units {mode === 'offer' ? 'Available' : 'Needed'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] focus:outline-none focus:border-[var(--teal)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] focus:outline-none focus:border-[var(--teal)] font-medium text-[var(--ink)]"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">
                  {donationType === 'blood' ? 'Storage Wing / Location Notes' : 'Clinical Compatibility / HLA Notes'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    donationType === 'blood'
                      ? 'e.g. Blood Bank Wing B, Shelf 3'
                      : 'e.g. Cross-match compatible with O+ recipient'
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] focus:outline-none focus:border-[var(--teal)]"
                />
              </div>

              {/* Organ Consent */}
              {donationType === 'organ' && (
                <label className="flex items-start gap-2 p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] cursor-pointer text-xs text-[var(--muted)] leading-relaxed">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded text-[var(--teal)]"
                    required
                  />
                  <span>
                    I confirm that this is a simulated workflow evaluation and does not submit records to NOTTO or clinical registries.
                  </span>
                </label>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[var(--teal)] text-white hover:bg-[var(--teal-dark)] transition-all shadow-xs cursor-pointer"
              >
                <Send size={15} />
                <span>
                  {mode === 'offer'
                    ? `Save Demo ${donationType === 'blood' ? 'Blood' : 'Organ'} Offer`
                    : `Save Demo ${donationType === 'blood' ? 'Blood' : 'Support'} Request`}
                </span>
              </button>
            </form>
          </div>

          {/* Right Column: Network Matches & Inventory */}
          <div className="lg:col-span-6 space-y-6">
            {/* Matching Patient Leads */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[var(--ink)]">
                    {mode === 'offer'
                      ? `Sample Patient ${donationType} Requests`
                      : donationType === 'organ'
                      ? 'Recorded Organ Pledges'
                      : 'Registered Blood Donors'}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {mode === 'offer'
                      ? `Community patients in need of ${donationType} units.`
                      : `Registered donors ready for outreach.`}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--mint)] text-[var(--teal)]">
                  {matchingPatients.length} match(es)
                </span>
              </div>

              {matchingPatients.length === 0 ? (
                <div className="text-center py-8 bg-[var(--surface-sunken)]/50 border border-dashed border-[var(--line)] rounded-xl">
                  <Users size={28} className="mx-auto text-[var(--muted)] mb-2 opacity-50" />
                  <p className="text-xs text-[var(--muted)]">No matching community entries found.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {matchingPatients.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex items-center justify-between gap-3 shadow-2xs hover:border-[var(--teal)]/40 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-lg bg-[var(--mint)] text-[var(--teal)] flex items-center justify-center shrink-0">
                          {p.type === 'blood' ? <Droplets size={16} /> : <Activity size={16} />}
                        </span>
                        <div className="min-w-0">
                          <strong className="text-xs sm:text-sm font-bold text-[var(--ink)] block truncate">
                            {p.name} · {p.group}
                          </strong>
                          <p className="text-[11px] text-[var(--muted)]">
                            {p.city} · {p.status || 'Active'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleContactPatient(p.name, p.group)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--mint)] text-[var(--teal)] hover:bg-[var(--teal)] hover:text-white transition-colors cursor-pointer"
                      >
                        <Phone size={12} />
                        <span>Contact</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hospital Network Stock & Requests */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[var(--ink)]">
                    Hospital Network Inventory &amp; Requests
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Live posts across affiliated healthcare centres.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--surface-sunken)] text-[var(--muted)]">
                  {filteredHospitalPosts.length} posts
                </span>
              </div>

              {filteredHospitalPosts.length === 0 ? (
                <div className="text-center py-8 bg-[var(--surface-sunken)]/50 border border-dashed border-[var(--line)] rounded-xl">
                  <Building2 size={28} className="mx-auto text-[var(--muted)] mb-2 opacity-50" />
                  <p className="text-xs text-[var(--muted)]">No hospital posts recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {filteredHospitalPosts.map((h) => (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                            h.mode === 'offer'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {h.mode === 'offer' ? <Upload size={16} /> : <Download size={16} />}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <strong className="text-xs sm:text-sm font-bold text-[var(--ink)]">
                              {h.hospital}
                            </strong>
                            <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-[var(--mint)] text-[var(--teal)]">
                              {h.group}
                            </span>
                            {h.units && (
                              <span className="text-xs font-medium text-[var(--muted)]">
                                {h.units} units
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--muted)]">
                            {h.mode === 'offer' ? 'Stock Offer' : 'Urgent Requirement'} · {h.city} · {h.date}
                          </p>
                          {h.notes && (
                            <p className="text-[11px] text-[var(--muted)] mt-1 bg-[var(--surface-sunken)] px-2 py-1 rounded-md">
                              {h.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={cn(
                          'text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wider',
                          h.urgency === 'Urgent' || h.urgency === 'Emergency'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        )}
                      >
                        {h.urgency || 'Routine'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
