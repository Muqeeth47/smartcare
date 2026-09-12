'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useSession, useQueue, useAppStore, CARE_TEAM, sortQueue } from '@/lib/store/app-store';
import { WorkspaceShell } from '@/components/layout/Shell';
import { DemoDB } from '@/lib/db/demo-db';
import { StateCommandSupplyModule } from '../supply/StateCommandSupplyModule';
import { cn, getTriageColor } from '@/lib/utils';
import {
  Users,
  UserPlus,
  ArrowRight,
  DoorOpen,
  DoorClosed,
  TriangleAlert,
  X,
  ListPlus,
  Building,
} from 'lucide-react';
import type { TriagePriority } from '@smartcare/types';

interface Room {
  name: string;
  type: string;
  status: 'Available' | 'In use';
}

const DEFAULT_ROOMS: Room[] = [
  { name: 'Consultation 01', type: 'Internal medicine', status: 'In use' },
  { name: 'Consultation 02', type: 'General care', status: 'Available' },
  { name: 'Triage desk', type: 'Initial assessment', status: 'In use' },
  { name: 'Pharmacy', type: 'Prescription pickup', status: 'Available' },
];

export function AdminWorkspacePage() {
  const { role } = useAuthGuard(['staff']);
  const { hospital, city } = useSession();
  const { queue, metrics } = useQueue();
  const { showToast, setQueue } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('adminTab') || 'command';

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('adminTab', tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Rooms state
  const roomStorageKey = `smartcare.rooms:${String(hospital || 'SmartCare Community Hospital').toLowerCase()}`;
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS);

  // Walk-in form state
  const [showWalkin, setShowWalkin] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinAge, setWalkinAge] = useState('');
  const [walkinGender, setWalkinGender] = useState('Not specified');
  const [walkinTriage, setWalkinTriage] = useState<TriagePriority>('Green');
  const [walkinClinician, setWalkinClinician] = useState(CARE_TEAM[0]?.name || 'Dr Meera Shah');
  const [walkinSymptoms, setWalkinSymptoms] = useState('');
  const [submittingWalkin, setSubmittingWalkin] = useState(false);

  // Load rooms from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(roomStorageKey) || 'null');
      if (Array.isArray(stored) && stored.length === 4) {
        setRooms(stored);
      }
    } catch {}
  }, [roomStorageKey]);

  if (!role) return null;

  const sorted = sortQueue(queue);

  const toggleRoom = (index: number) => {
    const updated = rooms.map((r, i) => {
      if (i !== index) return r;
      const nextStatus = r.status === 'Available' ? 'In use' : 'Available';
      return { ...r, status: nextStatus as 'Available' | 'In use' };
    });
    setRooms(updated);
    try {
      window.localStorage.setItem(roomStorageKey, JSON.stringify(updated));
    } catch {}
    showToast(`${rooms[index].name} is now ${updated[index].status.toLowerCase()}.`, 'success');
  };

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName.trim() || !walkinAge.trim() || !walkinSymptoms.trim()) {
      showToast('Please fill in patient name, age, and symptoms.', 'error');
      return;
    }
    setSubmittingWalkin(true);
    try {
      const clinician = CARE_TEAM.find((m) => m.name === walkinClinician) || CARE_TEAM[0];
      const patientId = await DemoDB.addPatient({
        name: walkinName.trim(),
        age: walkinAge.trim(),
        gender: walkinGender,
        triage: walkinTriage,
        doctorPref: clinician.name,
        doctorId: clinician.id,
        doctorName: clinician.name,
        department: clinician.department,
        consultationType: 'Walk-in consultation',
        appointmentDate: new Date().toISOString().slice(0, 10),
        appointmentSlot: 'Next available',
        symptoms: walkinSymptoms.trim(),
        area: 'Front desk walk-in',
        hospital: hospital || 'SmartCare Community Hospital',
        country: 'India',
        state: 'Telangana',
        city: city || 'Hyderabad',
      });

      const freshQueue = await DemoDB.fetchQueue();
      setQueue(freshQueue);
      showToast(`Walk-in ${patientId} added to the live queue.`, 'success');
      setShowWalkin(false);
      setWalkinName('');
      setWalkinAge('');
      setWalkinSymptoms('');
      router.push('/dashboard/queue');
    } catch {
      showToast('Failed to register walk-in.', 'error');
    } finally {
      setSubmittingWalkin(false);
    }
  };

  const removePatient = async (id: string) => {
    await DemoDB.removePatient(id);
    const fresh = await DemoDB.fetchQueue();
    setQueue(fresh);
    showToast('Patient removed from queue', 'success');
  };

  const facilityReadiness = Math.max(0, 100 - metrics.priority * 8);

  return (
    <WorkspaceShell title="Hospital operations" subtitle="Operations workspace" backHref="/" backLabel="Back to home">
      <div className="max-w-6xl mx-auto py-6 space-y-6">
        {/* Module Switcher: Module 2 (State & District Command Center) vs Operations */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange('command')}
              className={cn(
                'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px]',
                currentTab === 'command'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <Building className="w-4 h-4 text-amber-300" />
              Module 2: AushadhiNet State Command
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('operations')}
              className={cn(
                'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px]',
                currentTab === 'operations'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <Users className="w-4 h-4" />
              Hospital Ops &amp; Rooms
            </button>
          </div>

          <div className="text-xs text-slate-500 px-3 hidden md:flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            District CMO &amp; State Command Active
          </div>
        </div>

        {currentTab === 'command' ? (
          <StateCommandSupplyModule />
        ) : (
          <>
            {/* Provider Header */}
            <header className="provider-header flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#0a3b69] pb-3 mb-5">
          <div>
            <div className="eyebrow eyebrow-dark mb-1">
              <span className="eyebrow-dot" />
              Hospital operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a3b69]">
              Keep the centre ready.
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {hospital || 'SmartCare Community Hospital'} · {city || 'Hyderabad'}
            </p>
          </div>
          <div className="text-right text-xs text-[var(--text-muted)] p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)]" suppressHydrationWarning>
            <span suppressHydrationWarning>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]},{' '}
              {new Date().getDate()}{' '}
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][new Date().getMonth()]}
            </span>
            <strong className="block text-sm text-[#0a3b69] font-bold mt-0.5">Operational view</strong>
          </div>
        </header>

        {/* Next Actions Banner */}
        <section className="dashboard-quick-actions flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#bce0fd] bg-gradient-to-r from-[#ebf5fe] to-[#f2fbf6]">
          <div>
            <span className="eyebrow eyebrow-dark mb-1 text-[11px]">
              <span className="eyebrow-dot" /> Next actions
            </span>
            <strong className="block text-base text-[#0a3b69] font-bold">Keep the centre moving</strong>
            <small className="text-xs text-[var(--text-muted)]">
              Register walk-ins, review rooms, and monitor today's operating signals.
            </small>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="open-walkin"
              type="button"
              onClick={() => setShowWalkin(!showWalkin)}
              className="btn-primary flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold"
            >
              <UserPlus size={16} /> Register walk-in
            </button>
            <Link
              href="/dashboard/analytics"
              className="btn-secondary flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold border border-[var(--line)] bg-white hover:bg-[var(--surface-raised)] transition-all"
            >
              Open analytics <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Walk-in Intake Form (Collapsible Accordion) */}
        {showWalkin && (
          <section id="walkin-panel" className="provider-card p-5 rounded-2xl border border-[var(--line)] bg-white shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
              <div>
                <span className="eyebrow eyebrow-dark text-[11px] mb-1">
                  <span className="eyebrow-dot" /> Front desk intake
                </span>
                <h2 className="text-lg font-extrabold text-[#0a3b69]">Register a walk-in patient</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Add the patient to a clinician's live queue. Emergency symptoms still require the centre's emergency protocol.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWalkin(false)}
                className="btn-ghost flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-black p-1"
                aria-label="Close walk-in registration"
              >
                <X size={17} /> Close
              </button>
            </div>

            <form id="walkin-form" onSubmit={handleWalkinSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="field flex flex-col gap-1">
                <label htmlFor="walkin-name" className="text-xs font-bold text-[#0a3b69]">
                  Patient name <span>*</span>
                </label>
                <input
                  id="walkin-name"
                  type="text"
                  required
                  placeholder="e.g. Asha Rao"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  className="p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] text-[var(--text)]"
                />
              </div>

              <div className="field flex flex-col gap-1">
                <label htmlFor="walkin-age" className="text-xs font-bold text-[#0a3b69]">
                  Age <span>*</span>
                </label>
                <input
                  id="walkin-age"
                  type="number"
                  min={1}
                  max={120}
                  required
                  placeholder="32"
                  value={walkinAge}
                  onChange={(e) => setWalkinAge(e.target.value)}
                  className="p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] text-[var(--text)]"
                />
              </div>

              <div className="field flex flex-col gap-1">
                <label htmlFor="walkin-gender" className="text-xs font-bold text-[#0a3b69]">
                  Gender
                </label>
                <select
                  id="walkin-gender"
                  value={walkinGender}
                  onChange={(e) => setWalkinGender(e.target.value)}
                  className="p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] text-[var(--text)]"
                >
                  <option value="Not specified">Prefer not to say</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="field flex flex-col gap-1">
                <label htmlFor="walkin-triage" className="text-xs font-bold text-[#0a3b69]">
                  Triage priority <span>*</span>
                </label>
                <select
                  id="walkin-triage"
                  value={walkinTriage}
                  onChange={(e) => setWalkinTriage(e.target.value as TriagePriority)}
                  className="p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] text-[var(--text)]"
                >
                  <option value="Green">Green - routine</option>
                  <option value="Yellow">Yellow - urgent</option>
                  <option value="Red">Red - immediate</option>
                </select>
              </div>

              <div className="field sm:col-span-2 flex flex-col gap-1">
                <label htmlFor="walkin-clinician" className="text-xs font-bold text-[#0a3b69]">
                  Clinician queue <span>*</span>
                </label>
                <select
                  id="walkin-clinician"
                  value={walkinClinician}
                  onChange={(e) => setWalkinClinician(e.target.value)}
                  className="p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] text-[var(--text)]"
                >
                  {CARE_TEAM.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name} - {member.specialty} ({member.room})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field sm:col-span-2 flex flex-col gap-1">
                <label htmlFor="walkin-symptoms" className="text-xs font-bold text-[#0a3b69]">
                  Reason for visit <span>*</span>
                </label>
                <textarea
                  id="walkin-symptoms"
                  rows={2}
                  maxLength={300}
                  required
                  placeholder="Brief symptoms or reason for consultation"
                  value={walkinSymptoms}
                  onChange={(e) => setWalkinSymptoms(e.target.value)}
                  className="p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] text-[var(--text)]"
                />
                <span className="text-[11px] text-[var(--muted)]">Use clinical summary text only in this demo.</span>
              </div>
              <div className="sm:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={submittingWalkin}
                  className="btn-primary flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl text-xs font-bold text-white shadow-sm active:scale-95 transition-all"
                >
                  <ListPlus size={16} />
                  <span>{submittingWalkin ? 'Adding to queue...' : 'Add to live queue'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowWalkin(false)}
                  className="btn-secondary min-h-[44px] px-4 rounded-xl text-xs font-bold border border-[var(--line)] active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 4 Provider Stats */}
        <div className="provider-stats grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="provider-stat p-3.5 sm:p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc]">
            <span className="text-xs text-[var(--muted)]">Patients waiting</span>
            <strong className="block text-2xl font-extrabold text-[#0a3b69] mt-1">{metrics.waiting}</strong>
            <small className="text-[11px] text-[var(--text-dim)]">Current active queue</small>
          </div>
          <div className="provider-stat p-3.5 sm:p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc]">
            <span className="text-xs text-[var(--muted)]">Average wait</span>
            <strong className="block text-2xl font-extrabold text-[#0a3b69] mt-1">{metrics.averageWait}m</strong>
            <small className="text-[11px] text-[var(--text-dim)]">Based on arrival time</small>
          </div>
          <div className="provider-stat p-3.5 sm:p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc]">
            <span className="text-xs text-[var(--muted)]">Priority cases</span>
            <strong className="block text-2xl font-extrabold text-[#0a3b69] mt-1">{metrics.priority}</strong>
            <small className="text-[11px] text-[var(--text-dim)]">Needs attention first</small>
          </div>
          <div className="provider-stat p-3.5 sm:p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc]">
            <span className="text-xs text-[var(--muted)]">Projected revenue</span>
            <strong className="block text-2xl font-extrabold text-[#0a3b69] mt-1">₹{metrics.revenue}</strong>
            <small className="text-[11px] text-[var(--text-dim)]">Current queue estimate</small>
          </div>
        </div>

        {/* 2-Column Provider Grid: Rooms & Today at a Glance */}
        <div className="provider-grid grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Room Status Card (7 cols) */}
          <section className="lg:col-span-7 provider-card p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-white shadow-sm space-y-4">
            <div className="provider-card-heading flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#0a3b69]">Room status</h2>
                <p className="text-xs text-[var(--text-muted)]">Click a room to keep the next handoff visible to the front desk.</p>
              </div>
            </div>

            <div className="room-grid grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {rooms.map((room, index) => {
                const isAvailable = room.status === 'Available';
                return (
                  <button
                    key={room.name}
                    type="button"
                    onClick={() => toggleRoom(index)}
                    aria-pressed={!isAvailable}
                    className={`room-item flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left active:scale-[0.98] transition-all min-h-[56px] ${
                      isAvailable
                        ? 'bg-white border-[var(--line)] hover:border-[#8bbbe2]'
                        : 'bg-[#f3f9ff] border-[#8bbbe2] shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {isAvailable ? <DoorOpen size={17} className="text-green-600" /> : <DoorClosed size={17} className="text-[#0a3b69]" />}
                        <strong className="text-xs font-bold text-[#0a3b69]">{room.name}</strong>
                      </div>
                      <small className="block text-[11px] text-[var(--muted)] mt-1">{room.type}</small>
                    </div>
                    <span className={`room-status text-xs font-bold ${isAvailable ? 'text-green-600' : 'text-[#0a3b69]'}`}>
                      {room.status}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="provider-notice flex items-start gap-2 p-3 rounded-lg bg-[#fffaf0] border border-[#ecd9a6] text-[#72541b] text-xs">
              <TriangleAlert size={15} className="shrink-0 mt-0.5 text-amber-600" />
              <span>
                Triage desk is handling the next priority case. The live queue has {metrics.priority} red-priority patient(s).
              </span>
            </div>
          </section>

          {/* Today at a Glance Card (5 cols) */}
          <section className="lg:col-span-5 provider-card p-5 rounded-2xl border border-[var(--line)] bg-white shadow-sm space-y-4">
            <div className="provider-card-heading border-b border-[var(--line)] pb-3">
              <h2 className="text-base font-extrabold text-[#0a3b69]">Today at a glance</h2>
              <p className="text-xs text-[var(--text-muted)]">Use these signals to plan the next hour.</p>
            </div>

            <div className="divide-y divide-[var(--line)] text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-muted)]">Peak period</span>
                <strong className="font-bold text-[#0a3b69]">10:00–12:00</strong>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-muted)]">Queue health</span>
                <strong className={`font-bold ${metrics.waiting < 6 ? 'text-green-600' : 'text-amber-600'}`}>
                  {metrics.waiting < 6 ? 'Within target' : 'Needs attention'}
                </strong>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-muted)]">Facility readiness</span>
                <strong className="font-bold text-[#0a3b69]">{facilityReadiness}%</strong>
              </div>
            </div>

            <Link
              href="/dashboard/analytics"
              className="btn-secondary flex items-center justify-center gap-1.5 w-full h-10 rounded-xl text-xs font-bold border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] transition-all"
            >
              Open analytics <ArrowRight size={16} />
            </Link>
          </section>
        </div>

        {/* Live Queue Management Table */}
        <section className="provider-card p-5 rounded-2xl border border-[var(--line)] bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
            <div>
              <h2 className="text-base font-extrabold text-[#0a3b69]">Live patient queue</h2>
              <p className="text-xs text-[var(--text-muted)]">{sorted.length} total entries</p>
            </div>
            <Link
              href="/dashboard/queue"
              className="text-xs font-bold text-[#0f5ca8] hover:underline flex items-center gap-1"
            >
              Full queue manager <ArrowRight size={14} />
            </Link>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <Users size={32} className="mx-auto text-[var(--text-dim)] mb-3" />
              <p className="text-sm font-semibold">Queue is empty.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f0f6fc] text-left text-[#0a3b69]">
                    <th className="p-2.5 font-bold">#</th>
                    <th className="p-2.5 font-bold">Patient</th>
                    <th className="p-2.5 font-bold">Triage</th>
                    <th className="p-2.5 font-bold">Clinician</th>
                    <th className="p-2.5 font-bold">Symptoms</th>
                    <th className="p-2.5 font-bold">Status</th>
                    <th className="p-2.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {sorted.map((item, i) => (
                    <tr key={item.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                      <td className="p-2.5 font-bold text-[var(--text-muted)]">{i + 1}</td>
                      <td className="p-2.5 font-semibold text-[#0a3b69]">
                        {item.name}
                        <span className="block font-mono text-[10px] text-[var(--text-dim)] font-normal">{item.id}</span>
                      </td>
                      <td className="p-2.5">
                        <span className={cn('status-pill text-[0.65rem] px-2 py-0.5 rounded font-bold', getTriageColor(item.triage))}>
                          {item.triage}
                        </span>
                      </td>
                      <td className="p-2.5 text-[var(--text-muted)]">{item.doctorName || item.doctorPref || 'Unassigned'}</td>
                      <td className="p-2.5 text-[var(--text-muted)] max-w-[200px] truncate">{item.symptoms}</td>
                      <td className="p-2.5 capitalize font-medium text-[var(--text)]">{item.status}</td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => removePatient(item.id)}
                          className="text-red-600 hover:underline font-bold text-xs"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
          </>
        )}
      </div>
    </WorkspaceShell>
  );
}
