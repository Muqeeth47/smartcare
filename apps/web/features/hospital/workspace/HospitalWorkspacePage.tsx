'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useSession, useQueue, useAppStore, CARE_TEAM } from '@/lib/store/app-store';
import { WorkspaceShell } from '@/components/layout/Shell';
import { DemoDB } from '@/lib/db/demo-db';
import { cn, getTriageColor } from '@/lib/utils';
import {
  HeartPulse,
  Stethoscope,
  QrCode,
  NotebookPen,
  RefreshCw,
  ArrowRight,
  Check,
  X,
  Clock,
  AlertTriangle,
  Users,
  Building2,
  Save,
  ShieldPlus,
  Pill,
  TriangleAlert,
  ClipboardList,
  Siren,
  BadgeInfo,
  Hospital as HospitalIcon,
  Camera,
} from 'lucide-react';
import type { QueueItem, Prescription, QueueStatus, PatientMedicalHistory } from '@smartcare/types';

export function HospitalWorkspacePage() {
  const { role } = useAuthGuard(['doctor', 'staff']);
  const { hospital, city } = useSession();
  const { queue, metrics, sorted, nextPatient } = useQueue();
  const { updateQueueItem, showToast } = useAppStore();
  const router = useRouter();

  // QR Scanner modal state
  const [showQRModal, setShowQRModal] = useState(false);
  const [manualQRInput, setManualQRInput] = useState('');
  const [passportModalData, setPassportModalData] = useState<{
    passportId: string;
    profile: Record<string, string>;
    history: PatientMedicalHistory;
  } | null>(null);

  // Prescription modal state
  const [editingPatient, setEditingPatient] = useState<QueueItem | null>(null);
  const [rxAssessment, setRxAssessment] = useState('');
  const [rxMedName, setRxMedName] = useState('');
  const [rxStrength, setRxStrength] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxDuration, setRxDuration] = useState('');
  const [rxInstructions, setRxInstructions] = useState('');
  const [rxLabSummary, setRxLabSummary] = useState('');

  if (!role) return null;

  const current = nextPatient;
  const currentStatus = String(current?.status || 'waiting').toLowerCase();
  const currentPrescription = current ? DemoDB.getPrescription(current.id) : null;

  const currentAction: [QueueStatus | null, string] =
    currentStatus === 'waiting'
      ? ['called', 'Call next']
      : currentStatus === 'called'
      ? ['in_progress', 'Start visit']
      : currentStatus === 'in_progress'
      ? ['completed', 'Complete visit']
      : [null, 'Queue ready'];

  const statusLabel = (value?: string) => {
    const s = String(value || 'waiting').toLowerCase();
    if (s === 'waiting') return 'Waiting';
    if (s === 'called') return 'Called';
    if (s === 'in_progress') return 'In consultation';
    if (s === 'completed') return 'Completed';
    return 'Active';
  };

  const handleAdvanceCurrent = () => {
    if (!current || !currentAction[0]) return;
    updateQueueItem(current.id, { status: currentAction[0] });
    showToast(`Patient status updated: ${currentAction[1]}`, 'success');
  };

  const handleOpenPrescriptionModal = (patient: QueueItem) => {
    const existing = DemoDB.getPrescription(patient.id);
    const med = existing?.medicines?.[0];
    setRxAssessment(existing?.assessment || '');
    setRxMedName(med?.name || '');
    setRxStrength(med?.strength || '');
    setRxDosage(med?.dosage || '');
    setRxDuration(med?.duration || '');
    setRxInstructions(med?.instructions || '');
    setRxLabSummary(existing?.labSummary || '');
    setEditingPatient(patient);
  };

  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    const medicines = rxMedName.trim()
      ? [
          {
            name: rxMedName.trim(),
            strength: rxStrength.trim(),
            dosage: rxDosage.trim(),
            duration: rxDuration.trim(),
            instructions: rxInstructions.trim(),
          },
        ]
      : [];

    DemoDB.savePrescription(editingPatient.id, {
      assessment: rxAssessment.trim(),
      medicines,
      labSummary: rxLabSummary.trim(),
      providerName: 'Dr Meera Shah',
      issuedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    });

    showToast(`Demo prescription saved for ${editingPatient.name}`, 'success');
    setEditingPatient(null);
  };

  const handleOpenQRModal = () => {
    setManualQRInput('');
    setShowQRModal(true);
  };

  const handleProcessQR = (val: string) => {
    const raw = val.trim();
    if (!raw) return;
    if (raw.startsWith('SC-PASSPORT-')) {
      const passport = DemoDB.getMedicalPassport(raw, 'doctor');
      if (passport) {
        setPassportModalData(passport);
        setShowQRModal(false);
        showToast('Medical Passport record opened.', 'success');
      } else {
        showToast('Medical Passport ID not recognized in demo records.', 'error');
      }
      return;
    }

    const found = queue.find((q) => q.id.toLowerCase() === raw.toLowerCase());
    if (found) {
      updateQueueItem(found.id, { status: 'called' });
      setShowQRModal(false);
      showToast(`Patient ${found.name} called into OPD room.`, 'success');
    } else {
      showToast(`Appointment reference ${raw} verified.`, 'info');
      setShowQRModal(false);
    }
  };

  return (
    <WorkspaceShell title="Hospital workspace" subtitle="Hospital portal" backHref="/" backLabel="Back to home">
      <div className="max-w-6xl mx-auto py-6 space-y-6">
        {/* Header matching original provider-header */}
        <header className="provider-header flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#0a3b69] pb-3 mb-5">
          <div>
            <div className="eyebrow eyebrow-dark mb-1">
              <span className="eyebrow-dot" />
              Hospital workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a3b69]">
              Good care needs a clear queue.
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {hospital || 'SmartCare Community Hospital'} · {city || 'Hyderabad'}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-[var(--text-muted)]" suppressHydrationWarning>
            <span suppressHydrationWarning>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]},{' '}
              {new Date().getDate()}{' '}
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][new Date().getMonth()]}
            </span>
            <br />
            <strong className="text-[var(--text)]">
              {metrics.waiting} active {metrics.waiting === 1 ? 'visit' : 'visits'}
            </strong>
          </div>
        </header>

        {/* 2-Column Hero & Stats Grid matching original provider-grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Provider Hero on Left (7 cols) */}
          <section className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-[#0a3b69] text-white shadow-md flex flex-col justify-between">
            <div>
              <div className="eyebrow mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block mr-1.5" />
                {currentStatus === 'in_progress' ? 'Current consultation' : 'Next in line'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {current ? current.name : 'Queue is clear'}
              </h2>
              <p className="text-sm text-[#c9def2] mt-1">
                {current
                  ? `${current.symptoms || 'General consultation'} · ${statusLabel(current.status)}`
                  : 'There are no patients waiting for this care centre right now.'}
              </p>

              {current && (
                <div className="flex items-center gap-3 mt-4 flex-wrap text-xs text-[#c9def2] font-semibold">
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', getTriageColor(current.triage))}>
                    {current.triage || 'Unassessed'} priority
                  </span>
                  <span className="flex items-center gap-1">
                    <Stethoscope size={14} />
                    {current.doctorName || 'General care'}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 flex-wrap mt-6 pt-4 border-t border-white/20">
              <button
                id="complete-patient"
                onClick={handleAdvanceCurrent}
                disabled={!currentAction[0]}
                className="btn-primary flex items-center gap-2 h-10 px-5 rounded-xl text-xs font-bold text-[#0a3b69] bg-[#c9def2] hover:bg-white transition-all disabled:opacity-50"
              >
                {currentAction[1]}
                {currentStatus === 'in_progress' ? <Check size={16} /> : <ArrowRight size={16} />}
              </button>

              <button
                id="scan-qr-btn"
                type="button"
                onClick={handleOpenQRModal}
                className="btn-secondary flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold text-white border border-white/25 bg-transparent hover:bg-white hover:text-[#0a3b69] transition-all"
              >
                <QrCode size={16} /> Scan Patient QR
              </button>

              {current && (
                <button
                  id="issue-prescription"
                  type="button"
                  onClick={() => handleOpenPrescriptionModal(current)}
                  className="btn-secondary flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold text-white border border-white/25 bg-transparent hover:bg-white hover:text-[#0a3b69] transition-all"
                >
                  <NotebookPen size={16} /> {currentPrescription ? 'Edit' : 'Create'} demo Rx
                </button>
              )}

              <button
                id="refresh-queue"
                type="button"
                onClick={() => showToast('Queue refreshed', 'success')}
                className="btn-secondary flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-bold text-white border border-white/25 bg-transparent hover:bg-white hover:text-[#0a3b69] transition-all ml-auto"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </section>

          {/* Provider Stats on Right (5 cols) */}
          <section className="lg:col-span-5 grid grid-cols-2 gap-3" aria-label="Queue summary">
            <div className="p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-col justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Waiting now</span>
              <strong className="text-2xl font-extrabold text-[#0a3b69] mt-1">{metrics.waiting}</strong>
              <small className="text-[0.7rem] text-[var(--text-dim)]">Live queue count</small>
            </div>
            <div className="p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-col justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Priority cases</span>
              <strong className="text-2xl font-extrabold text-[#0a3b69] mt-1">{metrics.priority}</strong>
              <small className="text-[0.7rem] text-[var(--text-dim)]">Needs attention first</small>
            </div>
            <div className="p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-col justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Average wait</span>
              <strong className="text-2xl font-extrabold text-[#0a3b69] mt-1">{metrics.averageWait}m</strong>
              <small className="text-[0.7rem] text-[var(--text-dim)]">Based on arrival time</small>
            </div>
            <div className="p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-col justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">Room status</span>
              <strong className="text-2xl font-extrabold text-[#0a3b69] mt-1">
                {currentStatus === 'in_progress' ? 'In use' : 'Open'}
              </strong>
              <small className="text-[0.7rem] text-[var(--text-dim)]">Consultation room 01</small>
            </div>
          </section>
        </div>

        {/* Care Team Roster matching care-team-card */}
        <section className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0a3b69]">Hospital care team</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Each clinician has a department, room, availability, and live queue count.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#e5f1fc] text-[#0f5ca8]">
              {CARE_TEAM.length} clinicians
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CARE_TEAM.map((member) => {
              const assigned = queue.filter((p) => p.doctorName === member.name).length;
              const initials = member.name
                .split(' ')
                .slice(1)
                .map((part) => part[0])
                .join('')
                .slice(0, 2);

              return (
                <div key={member.name} className="p-3.5 rounded-xl border border-[var(--line)] bg-[#f8fafc] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0a3b69] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {initials || 'MD'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="text-xs font-bold text-[#0a3b69] truncate block">{member.name}</strong>
                    <span className="text-[0.7rem] text-[var(--text-muted)] truncate block">{member.specialty}</span>
                    <small className="text-[0.65rem] text-[var(--text-dim)] block">
                      {member.room} · {member.availability}
                    </small>
                  </div>
                  <div className="text-right shrink-0">
                    <strong className="text-sm font-bold text-[#0a3b69] block">{assigned}</strong>
                    <small className="text-[0.6rem] text-[var(--text-dim)] uppercase">active</small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Full Patient Queue Table matching original doctor view */}
        <section className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0a3b69]">Patient queue</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Priority first, then arrival time. Move one visit through each handoff.
              </p>
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)]">{sorted.length} total entries</span>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] flex flex-col items-center gap-2">
              <Users size={32} />
              <p className="text-sm">No patients in queue right now.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f0f6fc] text-[#0a3b69] border-b border-[var(--line)]">
                    <th className="p-3 font-bold">Patient</th>
                    <th className="p-3 font-bold">Reason</th>
                    <th className="p-3 font-bold">Priority</th>
                    <th className="p-3 font-bold">Status</th>
                    <th className="p-3 font-bold">Clinician</th>
                    <th className="p-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {sorted.map((patient, index) => {
                    const isCurrent = current?.id === patient.id;
                    const pStatus = String(patient.status || 'waiting').toLowerCase();

                    return (
                      <tr key={patient.id} className={cn('hover:bg-[#fbfdff] transition-colors', isCurrent && 'bg-[#eaf4fd]/60')}>
                        <td className="p-3">
                          <strong className="text-[#0a3b69] block font-bold">
                            {index + 1}. {patient.name}
                          </strong>
                          <small className="text-[var(--text-dim)]">
                            {patient.age ? `${patient.age} yrs` : ''} · {patient.gender || 'Not specified'}
                          </small>
                        </td>
                        <td className="p-3 text-[var(--text-muted)] max-w-xs truncate">
                          {patient.symptoms || 'General consultation'}
                        </td>
                        <td className="p-3">
                          <span className={cn('px-2 py-0.5 rounded-full text-[0.65rem] font-bold', getTriageColor(patient.triage))}>
                            {patient.triage || 'Standard'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider',
                              pStatus === 'in_progress'
                                ? 'bg-green-100 text-green-800'
                                : pStatus === 'called'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            )}
                          >
                            {statusLabel(patient.status)}
                          </span>
                        </td>
                        <td className="p-3 text-[var(--text-muted)]">{patient.doctorName || 'General care'}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {pStatus === 'waiting' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateQueueItem(patient.id, { status: 'called' });
                                  showToast(`Called ${patient.name}`, 'success');
                                }}
                                className="h-7 px-2.5 rounded-lg border border-[var(--line)] bg-white text-[0.7rem] font-bold text-[#0f5ca8] hover:bg-[#e5f1fc]"
                              >
                                Call
                              </button>
                            )}
                            {pStatus === 'called' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateQueueItem(patient.id, { status: 'in_progress' });
                                  showToast(`Started consultation for ${patient.name}`, 'success');
                                }}
                                className="h-7 px-2.5 rounded-lg border border-transparent bg-[#0f5ca8] text-[0.7rem] font-bold text-white hover:brightness-105"
                              >
                                Start
                              </button>
                            )}
                            {pStatus === 'in_progress' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateQueueItem(patient.id, { status: 'completed' });
                                  showToast(`Completed visit for ${patient.name}`, 'success');
                                }}
                                className="h-7 px-2.5 rounded-lg border border-transparent bg-green-600 text-[0.7rem] font-bold text-white hover:brightness-105"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenPrescriptionModal(patient)}
                              title="Prescription"
                              className="h-7 w-7 rounded-lg border border-[var(--line)] bg-white flex items-center justify-center text-[var(--text-muted)] hover:text-[#0f5ca8]"
                            >
                              <NotebookPen size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ── Prescription Editor Modal ── */}
      {editingPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditingPatient(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--line)]">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[#0a3b69] text-white flex items-center justify-center">
                  <NotebookPen size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#0a3b69]">Clinical note &amp; demo e-prescription</h3>
                  <p className="text-xs text-[var(--text-muted)]">Saved only in this browser for the SmartCare prototype.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPatient(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] transition-colors"
                aria-label="Close editor"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePrescription}>
              <div className="p-6 space-y-4">
                <div className="p-3 bg-[#f4f8fc] rounded-lg border border-[#e0ecf7]">
                  <strong className="text-sm text-[#0a3b69] block font-bold">{editingPatient.name}</strong>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {editingPatient.symptoms || 'General consultation'} · Visit Ref: {editingPatient.id}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text)] mb-1">
                    Clinical assessment <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rxAssessment}
                    onChange={(e) => setRxAssessment(e.target.value)}
                    placeholder="Record the assessment made during this consultation"
                    className="w-full p-2.5 rounded-lg border border-[var(--line)] text-xs text-[var(--text)] bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                      Medicine name <small className="text-[var(--text-dim)]">(optional)</small>
                    </label>
                    <input
                      type="text"
                      value={rxMedName}
                      onChange={(e) => setRxMedName(e.target.value)}
                      placeholder="e.g. Paracetamol"
                      className="w-full p-2 rounded-lg border border-[var(--line)] text-xs text-[var(--text)] bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">Strength</label>
                    <input
                      type="text"
                      value={rxStrength}
                      onChange={(e) => setRxStrength(e.target.value)}
                      placeholder="e.g. 500 mg"
                      className="w-full p-2 rounded-lg border border-[var(--line)] text-xs text-[var(--text)] bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">Dosage</label>
                    <input
                      type="text"
                      value={rxDosage}
                      onChange={(e) => setRxDosage(e.target.value)}
                      placeholder="e.g. One tablet TDS"
                      className="w-full p-2 rounded-lg border border-[var(--line)] text-xs text-[var(--text)] bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">Duration</label>
                    <input
                      type="text"
                      value={rxDuration}
                      onChange={(e) => setRxDuration(e.target.value)}
                      placeholder="e.g. 3 days"
                      className="w-full p-2 rounded-lg border border-[var(--line)] text-xs text-[var(--text)] bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">Medicine instructions</label>
                  <input
                    type="text"
                    value={rxInstructions}
                    onChange={(e) => setRxInstructions(e.target.value)}
                    placeholder="Food, timing, or safety guidance"
                    className="w-full p-2 rounded-lg border border-[var(--line)] text-xs text-[var(--text)] bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Lab summary or follow-up notes <small className="text-[var(--text-dim)]">(optional)</small>
                  </label>
                  <textarea
                    rows={2}
                    value={rxLabSummary}
                    onChange={(e) => setRxLabSummary(e.target.value)}
                    placeholder="Only include results or advice actually recorded"
                    className="w-full p-2.5 rounded-lg border border-[var(--line)] text-xs text-[var(--text)] bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between p-4 border-t border-[var(--line)] bg-[var(--surface-sunken)]">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 rounded-lg border border-[var(--line)] text-xs font-semibold hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-1.5 h-9 px-5 rounded-lg text-xs font-bold text-white shadow-sm"
                  style={{ background: 'var(--teal)' }}
                >
                  <Save size={14} /> Save demo record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRModal && (
        <div className="modal-backdrop" onClick={() => setShowQRModal(false)}>
          <div
            className="prescription-modal"
            style={{ maxWidth: '520px' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-scanner-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="prescription-modal-header">
              <h3 id="qr-scanner-title" className="flex items-center gap-2 font-bold text-sm text-[var(--teal-dark)]">
                <QrCode size={18} /> Scan Patient QR Code
              </h3>
              <button
                type="button"
                className="btn-ghost modal-close-button"
                onClick={() => setShowQRModal(false)}
                aria-label="Close scanner"
              >
                <X size={18} />
              </button>
            </div>
            <div className="prescription-modal-body text-center p-5">
              <p className="text-xs text-[var(--muted)] mb-4">
                Scan an appointment ticket to check in, or a Medical History code to open its read-only clinical summary.
              </p>
              <div
                className="relative flex flex-col items-center justify-center mx-auto mb-4 rounded-xl border border-dashed border-[var(--teal)] bg-black text-white"
                style={{ width: '100%', maxWidth: '380px', minHeight: '220px' }}
              >
                <Camera size={36} className="text-gray-400 mb-2 opacity-80" />
                <span className="text-xs font-semibold text-gray-300">Simulated QR Scanner Active</span>
                <small className="text-[11px] text-gray-400 mt-1">Point camera at QR token or use manual entry below</small>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--line)]">
                <p className="text-xs text-[var(--muted)] mb-2">Or type / paste reference ID manually:</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleProcessQR(manualQRInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="e.g. SC-DEMO001 or SC-PASSPORT-8924"
                    value={manualQRInput}
                    onChange={(e) => setManualQRInput(e.target.value)}
                    className="flex-1 p-2.5 rounded-lg border border-[var(--line)] text-xs font-bold bg-[var(--surface)] text-[var(--text)]"
                  />
                  <button type="submit" className="btn-primary px-4 py-2 text-xs font-bold">
                    Open code
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared Medical Passport Modal */}
      {passportModalData && (
        <div className="modal-backdrop" onClick={() => setPassportModalData(null)}>
          <div
            className="prescription-modal passport-review-modal"
            style={{ maxWidth: '720px' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="passport-review-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="prescription-modal-header">
              <h3 id="passport-review-title" className="flex items-center gap-2 font-bold text-sm text-[var(--teal-dark)]">
                <ShieldPlus size={18} /> Shared Medical History
              </h3>
              <button
                type="button"
                className="btn-ghost modal-close-button"
                onClick={() => setPassportModalData(null)}
                aria-label="Close Medical History"
              >
                <X size={18} />
              </button>
            </div>
            <div className="prescription-modal-body p-5 space-y-4">
              <div className="passport-review-banner grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#eef7ff] border border-[#bce0fd] rounded-xl text-xs">
                <div>
                  <small className="block text-[10px] text-[var(--muted)] uppercase font-bold">Patient</small>
                  <strong>{passportModalData.profile.name || 'Patient'}</strong>
                </div>
                <div>
                  <small className="block text-[10px] text-[var(--muted)] uppercase font-bold">Age / Gender</small>
                  <strong>{passportModalData.profile.age} / {passportModalData.profile.gender}</strong>
                </div>
                <div>
                  <small className="block text-[10px] text-[var(--muted)] uppercase font-bold">Share ID</small>
                  <strong>{passportModalData.passportId}</strong>
                </div>
                <div>
                  <small className="block text-[10px] text-[var(--muted)] uppercase font-bold">Last updated</small>
                  <strong>{passportModalData.history.lastUpdated || 'Recent'}</strong>
                </div>
              </div>

              {passportModalData.history.previousProvider && (
                <section className="passport-provider-summary flex items-start gap-3 p-3 bg-gray-50 border border-[var(--line)] rounded-xl text-xs">
                  <HospitalIcon size={18} className="text-[var(--teal)] shrink-0 mt-0.5" />
                  <div>
                    <small className="block text-[10px] text-[var(--muted)] uppercase font-bold">Previous primary provider</small>
                    <strong className="text-[var(--text)]">{passportModalData.history.previousProvider.doctorName}</strong>
                    <p className="text-[var(--muted)] text-xs mt-0.5">
                      {passportModalData.history.previousProvider.hospitalName} · {passportModalData.history.previousProvider.city}
                    </p>
                  </div>
                </section>
              )}

              <div className="passport-review-grid grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <section className="p-3 bg-white border border-[var(--line)] rounded-xl">
                  <h4 className="flex items-center gap-1.5 font-bold text-[#0a3b69] mb-2">
                    <Pill size={14} /> Effective medications
                  </h4>
                  {passportModalData.history.effectiveMedications?.length ? (
                    <ul className="space-y-1.5">
                      {passportModalData.history.effectiveMedications.map((m, i) => (
                        <li key={i} className="text-gray-700">
                          <strong>{m.medicineName}</strong> · {m.dosage} <small className="text-gray-500">({m.conditionTreated})</small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-xs">No medications recorded.</p>
                  )}
                </section>

                <section className="passport-alert-card p-3 bg-red-50/60 border border-red-200 rounded-xl">
                  <h4 className="flex items-center gap-1.5 font-bold text-red-700 mb-2">
                    <TriangleAlert size={14} /> Allergies &amp; avoid
                  </h4>
                  {passportModalData.history.allergiesAndAvoid?.length ? (
                    <ul className="space-y-1.5">
                      {passportModalData.history.allergiesAndAvoid.map((a, i) => (
                        <li key={i} className="text-red-900">
                          <strong>{a.substance}</strong> · {a.severity} <small className="text-red-700">({a.reactionDescription})</small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-xs">No allergies recorded.</p>
                  )}
                </section>

                <section className="p-3 bg-white border border-[var(--line)] rounded-xl">
                  <h4 className="flex items-center gap-1.5 font-bold text-[#0a3b69] mb-2">
                    <ClipboardList size={14} /> Care conditions
                  </h4>
                  {passportModalData.history.careConditions?.length ? (
                    <ul className="space-y-1.5">
                      {passportModalData.history.careConditions.map((c, i) => (
                        <li key={i} className="text-gray-700">
                          <strong>{c.category}:</strong> {c.instruction}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-xs">No care conditions recorded.</p>
                  )}
                </section>

                <section className="passport-emergency-card p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <h4 className="flex items-center gap-1.5 font-bold text-amber-800 mb-2">
                    <Siren size={14} /> Emergency protocols
                  </h4>
                  {passportModalData.history.emergencyProtocols?.length ? (
                    <ul className="space-y-1.5">
                      {passportModalData.history.emergencyProtocols.map((e, i) => (
                        <li key={i} className="text-amber-950">
                          <strong>{e.triggerCondition}:</strong> {e.actionSteps}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-xs">No emergency protocols recorded.</p>
                  )}
                </section>
              </div>

              <div className="provider-notice flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-[11px]">
                <BadgeInfo size={15} className="shrink-0 text-blue-700" />
                <span>Demo handoff only. Confirm the patient's identity, current medicines, allergies, and emergency instructions before making clinical decisions.</span>
              </div>
            </div>

            <div className="prescription-modal-actions flex items-center justify-between p-4 border-t border-[var(--line)] bg-[var(--surface-sunken)]">
              <span className="status-note text-xs text-[var(--muted)]">Read-only clinical view</span>
              <button
                type="button"
                className="btn-primary px-5 py-2 rounded-lg text-xs font-bold"
                onClick={() => setPassportModalData(null)}
              >
                Done reviewing
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
