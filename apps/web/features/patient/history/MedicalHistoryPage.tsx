'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useSession, usePatient, useAppStore } from '@/lib/store/app-store';
import { PatientShell } from '@/components/layout/Shell';
import { DemoDB } from '@/lib/db/demo-db';
import { generatePassportId } from '@/lib/utils';
import {
  HeartPulse,
  Download,
  PlusCircle,
  QrCode,
  Clock3,
  UserRound,
  Hospital,
  Activity,
  Star,
  Pill,
  TriangleAlert,
  ShieldAlert,
  Siren,
  Trash2,
  X,
  Save,
  Copy,
  Check,
} from 'lucide-react';
import type { PatientMedicalHistory } from '@smartcare/types';

export function MedicalHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuthGuard(['patient']);
  const { email } = useSession();
  const { patientData } = usePatient();
  const { showToast } = useAppStore();

  const modalParam = searchParams.get('modal');
  const tabParam = searchParams.get('tab') as 'med' | 'alg' | 'cond' | 'emg' | 'provider' | null;

  const [history, setHistory] = useState<PatientMedicalHistory>(() => DemoDB.getMedicalHistory(email || 'patient@smartcare.demo'));
  const [showEditModal, setShowEditModal] = useState(modalParam === 'edit');
  const [showQrModal, setShowQrModal] = useState(modalParam === 'qr');
  const [copied, setCopied] = useState(false);

  // Form states for Add/Edit
  const [editTab, setEditTab] = useState<'med' | 'alg' | 'cond' | 'emg' | 'provider'>(
    tabParam && ['med', 'alg', 'cond', 'emg', 'provider'].includes(tabParam) ? tabParam : 'med'
  );

  const openEditModal = (tab?: 'med' | 'alg' | 'cond' | 'emg' | 'provider') => {
    const t = tab || editTab;
    setEditTab(t);
    setShowEditModal(true);
    setShowQrModal(false);
    router.replace(`/dashboard/patient/history?modal=edit&tab=${t}`, { scroll: false });
  };

  const handleEditTabChange = (t: 'med' | 'alg' | 'cond' | 'emg' | 'provider') => {
    setEditTab(t);
    router.replace(`/dashboard/patient/history?modal=edit&tab=${t}`, { scroll: false });
  };

  const openQrModal = () => {
    setShowQrModal(true);
    setShowEditModal(false);
    router.replace('/dashboard/patient/history?modal=qr', { scroll: false });
  };

  const closeModal = () => {
    setShowEditModal(false);
    setShowQrModal(false);
    router.replace('/dashboard/patient/history', { scroll: false });
  };
  const [newMed, setNewMed] = useState({ name: '', dosage: '', condition: '', notes: '' });
  const [newAlg, setNewAlg] = useState<{ substance: string; severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-Threatening'; reaction: string }>({
    substance: '',
    severity: 'Severe',
    reaction: '',
  });
  const [newCond, setNewCond] = useState({ category: 'Dietary', instruction: '' });
  const [newEmg, setNewEmg] = useState({ trigger: '', action: '' });
  const [providerForm, setProviderForm] = useState({ doctorName: '', hospitalName: '', city: '', contactPhone: '' });

  const passportId = generatePassportId(email || 'patient@smartcare.demo');

  useEffect(() => {
    const h = DemoDB.getMedicalHistory(email || 'patient@smartcare.demo');
    setHistory(h);
    if (h?.previousProvider) {
      setProviderForm(h.previousProvider);
    }
  }, [email]);

  const patientName = patientData.name || (email === 'patient@smartcare.demo' ? 'Asha Rao' : email.split('@')[0].replace(/[._-]/g, ' '));
  const patientAge = patientData.age ? `${patientData.age} Y` : '32 Y';
  const patientGender = patientData.gender || 'Female';
  const patientCity = patientData.city || 'Hyderabad';
  const lastUpdated = history.lastUpdated || 'Recently synced';

  const prevDoc = history.previousProvider || { doctorName: '', hospitalName: '', city: '', contactPhone: '' };
  const diseases = history.diseases || [];
  const preferences = history.personalPreferences || [];
  const effectiveMeds = history.effectiveMedications || [];
  const allergies = history.allergiesAndAvoid || [];
  const careConditions = history.careConditions || [];
  const protocols = history.emergencyProtocols || [];

  // PDF Print Trigger
  const handleDownloadPdf = () => {
    window.print();
  };

  // Delete item handlers
  const handleDeleteItem = (type: 'med' | 'alg' | 'cond' | 'emg', idx: number) => {
    const updated = { ...history };
    if (type === 'med') updated.effectiveMedications = effectiveMeds.filter((_, i) => i !== idx);
    if (type === 'alg') updated.allergiesAndAvoid = allergies.filter((_, i) => i !== idx);
    if (type === 'cond') updated.careConditions = careConditions.filter((_, i) => i !== idx);
    if (type === 'emg') updated.emergencyProtocols = protocols.filter((_, i) => i !== idx);

    updated.lastUpdated = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    DemoDB.saveMedicalHistory(email, updated);
    setHistory(updated);
    showToast('Medical record item removed', 'info');
  };

  // Add item handler
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...history };
    const now = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (editTab === 'med') {
      if (!newMed.name) return;
      updated.effectiveMedications = [
        ...effectiveMeds,
        {
          id: `med-${Date.now()}`,
          medicineName: newMed.name,
          dosage: newMed.dosage || 'Standard',
          conditionTreated: newMed.condition || 'General',
          notes: newMed.notes,
        },
      ];
      setNewMed({ name: '', dosage: '', condition: '', notes: '' });
    } else if (editTab === 'alg') {
      if (!newAlg.substance) return;
      updated.allergiesAndAvoid = [
        ...allergies,
        {
          id: `alg-${Date.now()}`,
          substance: newAlg.substance,
          severity: newAlg.severity,
          reactionDescription: newAlg.reaction || 'Severe adverse reaction',
        },
      ];
      setNewAlg({ substance: '', severity: 'Severe', reaction: '' });
    } else if (editTab === 'cond') {
      if (!newCond.instruction) return;
      updated.careConditions = [
        ...careConditions,
        {
          id: `cond-${Date.now()}`,
          category: newCond.category as any,
          instruction: newCond.instruction,
        },
      ];
      setNewCond({ category: 'Dietary', instruction: '' });
    } else if (editTab === 'emg') {
      if (!newEmg.trigger || !newEmg.action) return;
      updated.emergencyProtocols = [
        ...protocols,
        {
          id: `emg-${Date.now()}`,
          triggerCondition: newEmg.trigger,
          actionSteps: newEmg.action,
        },
      ];
      setNewEmg({ trigger: '', action: '' });
    } else if (editTab === 'provider') {
      updated.previousProvider = { ...providerForm };
    }

    updated.lastUpdated = now;
    DemoDB.saveMedicalHistory(email, updated);
    setHistory(updated);
    closeModal();
    showToast('Medical history updated successfully', 'success');
  };

  const handleCopyPassport = () => {
    navigator.clipboard.writeText(passportId);
    setCopied(true);
    showToast('Medical Passport ID copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PatientShell subtitle="Medical History" backHref="/dashboard/patient">
      <div className="max-w-5xl mx-auto py-6 space-y-6">
        {/* On-screen Header & Body Actions */}
        <div className="flow-header print-hide space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="eyebrow eyebrow-dark mb-1">
                <span className="eyebrow-dot" />
                Medical History (Share ID: {passportId})
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a3b69]">
                Patient Medical History
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
                Manage your medical records, effective medicines, allergies, and care preferences in one portable profile.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e5f1fc] text-[#0f5ca8] text-xs font-semibold shrink-0 self-start">
              <Clock3 size={14} />
              <span>Last updated: {lastUpdated}</span>
            </div>
          </div>

          {/* Action buttons matching original history.js */}
          <div className="flex items-center gap-2.5 flex-wrap pt-2">
            <button
              id="edit-passport-btn"
              type="button"
              onClick={() => openEditModal()}
              className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
              style={{ background: 'var(--teal)' }}
            >
              <PlusCircle size={16} /> Add / Edit Medical Record
            </button>

            <button
              id="download-pdf-btn"
              type="button"
              onClick={handleDownloadPdf}
              className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-xs font-bold text-[#0a3b69] border border-[#cbd5e1] bg-white hover:bg-[#f8fafc] shadow-sm transition-all cursor-pointer"
            >
              <Download size={16} /> Download PDF Report
            </button>

            <button
              id="qr-handoff-btn"
              type="button"
              onClick={openQrModal}
              className="btn-ghost w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-xs font-bold text-[#0f5ca8] hover:bg-[#e5f1fc] transition-all cursor-pointer"
            >
              <QrCode size={16} /> Share with hospital
            </button>
          </div>
        </div>

        {/* On-screen Patient Demographics Card */}
        <div className="card print-hide p-5 rounded-2xl bg-white border border-[var(--line)] shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)]">
            <strong className="text-sm font-bold text-[#0a3b69] flex items-center gap-2">
              <UserRound size={16} /> Patient Demographics
            </strong>
            <span className="text-[0.7rem] font-bold px-2.5 py-0.5 rounded-full bg-[#e5f1fc] text-[#0f5ca8]">
              Verified Profile
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <small className="text-[var(--text-muted)] block mb-0.5">Full Name</small>
              <strong className="text-sm font-bold text-[var(--text)]">{patientName}</strong>
            </div>
            <div>
              <small className="text-[var(--text-muted)] block mb-0.5">Age / Gender</small>
              <strong className="text-sm font-bold text-[var(--text)]">{patientAge} / {patientGender}</strong>
            </div>
            <div>
              <small className="text-[var(--text-muted)] block mb-0.5">City</small>
              <strong className="text-sm font-bold text-[var(--text)]">{patientCity}</strong>
            </div>
            <div>
              <small className="text-[var(--text-muted)] block mb-0.5">Passport ID</small>
              <strong className="text-sm font-mono font-bold text-[#0f5ca8]">{passportId}</strong>
            </div>
          </div>
        </div>

        {/* Dedicated Printable Medical Report Container */}
        <div id="printable-medical-report">
          {/* PDF Print Header (hidden on screen, visible in print) */}
          <div id="pdf-print-header" className="print-only">
            <div className="flex justify-between items-center pb-3 border-b-2 border-[#0a3b69] mb-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#0a3b69] text-white flex items-center justify-center font-bold">
                  <HeartPulse size={22} />
                </span>
                <div>
                  <strong className="text-xl font-extrabold text-[#0a3b69] tracking-tight block">
                    SmartCare Healthcare Systems
                  </strong>
                  <small className="text-[#5a7a8e] text-xs font-semibold">
                    Official Patient Profile &amp; Medical History Report
                  </small>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-xs font-extrabold text-[#0a3b69]">
                  HISTORY SHARE ID: {passportId}
                </span>
                <span className="block text-[0.7rem] text-[#5a7a8e] font-semibold">
                  Report Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Demographics Print Summary */}
            <div className="p-3 border border-[#c2dcf3] rounded-xl bg-[#f0f7fc] mb-4 grid grid-cols-4 gap-3 text-xs">
              <div><strong>Patient Name:</strong> <span>{patientName}</span></div>
              <div><strong>Age / Gender:</strong> <span>{patientAge} / {patientGender}</span></div>
              <div><strong>City:</strong> <span>{patientCity}</span></div>
              <div><strong>Last Synced:</strong> <span>{lastUpdated}</span></div>
            </div>
          </div>

          {/* Previous Doctor & Clinical Overview Card */}
          <div className="card patient-history-overview-card p-5 rounded-2xl border border-[#c2dcf3] bg-gradient-to-br from-[#f0f7fc] to-[#e5f1fc] mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <small className="text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Hospital size={13} /> Previous Primary Provider
                </small>
                <strong className="text-sm font-bold text-[#0a3b69] block">
                  {prevDoc.doctorName || <span className="text-[var(--text-muted)] italic font-normal">No previous doctor recorded</span>}
                </strong>
                <span className="text-xs text-[var(--text-muted)] block mt-0.5">
                  {prevDoc.hospitalName} {prevDoc.city ? `(${prevDoc.city})` : ''} {prevDoc.contactPhone ? `· ${prevDoc.contactPhone}` : ''}
                </span>
              </div>

              <div>
                <small className="text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Activity size={13} /> Active Diagnosed Conditions
                </small>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {diseases.length > 0 ? (
                    diseases.map((d) => (
                      <span key={d.id} className="badge bg-white text-[#0a3b69] border border-[#b8daf5] text-[0.7rem] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Hospital size={11} /> {d.diseaseName} ({d.diagnosedSince})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">No chronic conditions recorded</span>
                  )}
                </div>
              </div>

              <div>
                <small className="text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Star size={13} /> Personal Care Preferences
                </small>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {preferences.length > 0 ? (
                    preferences.map((p) => (
                      <span key={p.id} className="badge bg-white text-[var(--text)] border border-[var(--line)] text-[0.7rem] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Star size={11} /> {p.preference}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">No preferences recorded</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4-Pillar Medical History Grid matching original history.js */}
          <div className="history-grid grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Pillar 1: Effective Medications */}
            <div className="card history-pillar-card p-5 rounded-2xl bg-white border border-[var(--line)] shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-[#e8f4fb] text-[#0f5ca8] flex items-center justify-center">
                    <Pill size={18} />
                  </span>
                  <h3 className="text-sm font-bold text-[#0a3b69]">Effective Medicines</h3>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3">Medicines &amp; dosages that work best for your condition.</p>
              <div className="space-y-2.5">
                {effectiveMeds.length > 0 ? (
                  effectiveMeds.map((med, idx) => (
                    <div key={med.id} className="history-item-row p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
                      <div className="flex items-start justify-between gap-2">
                        <strong className="text-xs font-bold text-[var(--text)]">{med.medicineName}</strong>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[0.68rem] font-bold px-2 py-0.5 rounded bg-[#e8f4fb] text-[#0f5ca8]">
                            {med.dosage}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem('med', idx)}
                            className="btn-delete-item print-hide text-red-500 hover:text-red-700 p-0.5"
                            title="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="text-[0.75rem] text-[var(--text-muted)] mt-1">Condition: {med.conditionTreated}</div>
                      {med.notes && <div className="text-[0.7rem] text-[var(--text-dim)] italic mt-1">Note: "{med.notes}"</div>}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[var(--text-muted)] p-4 text-center bg-[var(--surface-sunken)] rounded-xl">
                    No effective medications recorded. Click "Add / Edit Medical Record" to add.
                  </div>
                )}
              </div>
            </div>

            {/* Pillar 2: Allergies & Avoid List */}
            <div className="card history-pillar-card p-5 rounded-2xl bg-white border border-red-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-red-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                    <TriangleAlert size={18} />
                  </span>
                  <h3 className="text-sm font-bold text-red-800">Allergies &amp; Avoid List</h3>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3">Drugs &amp; substances that must be strictly avoided by doctors.</p>
              <div className="space-y-2.5">
                {allergies.length > 0 ? (
                  allergies.map((alg, idx) => (
                    <div key={alg.id} className="history-item-row p-3 rounded-xl bg-red-50 border border-red-200">
                      <div className="flex items-start justify-between gap-2">
                        <strong className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                          <TriangleAlert size={13} /> {alg.substance}
                        </strong>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[0.68rem] font-bold px-2 py-0.5 rounded bg-red-200 text-red-800">
                            {alg.severity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem('alg', idx)}
                            className="btn-delete-item print-hide text-red-600 hover:text-red-800 p-0.5"
                            title="Remove allergy"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="text-[0.75rem] text-red-900 mt-1">{alg.reactionDescription}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[var(--text-muted)] p-4 text-center bg-red-50/50 rounded-xl">
                    No allergies recorded. Click "Add / Edit Medical Record" to add.
                  </div>
                )}
              </div>
            </div>

            {/* Pillar 3: Optimal Care Conditions */}
            <div className="card history-pillar-card p-5 rounded-2xl bg-white border border-[var(--line)] shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <ShieldAlert size={18} />
                  </span>
                  <h3 className="text-sm font-bold text-[#0a3b69]">Optimal Care Conditions</h3>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3">Dietary, positioning, &amp; environmental guidelines.</p>
              <div className="space-y-2.5">
                {careConditions.length > 0 ? (
                  careConditions.map((cond, idx) => (
                    <div key={cond.id} className="history-item-row p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-800">
                          {cond.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem('cond', idx)}
                          className="btn-delete-item print-hide text-red-500 hover:text-red-700 p-0.5"
                          title="Remove condition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="text-xs font-semibold text-[var(--text)] mt-1.5">{cond.instruction}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[var(--text-muted)] p-4 text-center bg-amber-50/30 rounded-xl">
                    No care conditions recorded. Click "Add / Edit Medical Record" to add.
                  </div>
                )}
              </div>
            </div>

            {/* Pillar 4: Emergency Protocols */}
            <div className="card history-pillar-card p-5 rounded-2xl bg-white border border-[var(--line)] shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Siren size={18} />
                  </span>
                  <h3 className="text-sm font-bold text-[#0a3b69]">Emergency Protocols</h3>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3">Step-by-step crisis action plans for attending doctors.</p>
              <div className="space-y-2.5">
                {protocols.length > 0 ? (
                  protocols.map((emg, idx) => (
                    <div key={emg.id} className="history-item-row p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                      <div className="flex items-start justify-between gap-2">
                        <strong className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <Siren size={13} /> Trigger: {emg.triggerCondition}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem('emg', idx)}
                          className="btn-delete-item print-hide text-red-500 hover:text-red-700 p-0.5"
                          title="Remove protocol"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="text-xs text-indigo-800 mt-1">Action: {emg.actionSteps}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[var(--text-muted)] p-4 text-center bg-indigo-50/30 rounded-xl">
                    No emergency protocols recorded. Click "Add / Edit Medical Record" to add.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PDF Print Footer (hidden on screen, visible in print) */}
          <div id="pdf-print-footer" className="print-only">
            <div className="mt-8 pt-3 border-t border-[#d8e4ef] flex justify-between items-center text-[0.7rem] text-[#5a7a8e]">
              <div>
                <strong>Confidential Medical Document</strong> - Generated by SmartCare Healthcare Systems.
                <br />For authorized clinical, emergency, &amp; attending physician use only.
              </div>
              <div className="text-right">
                <strong>SmartCare Patient Medical History | Page 1 of 1</strong>
                <br /><span>https://smartcare.health</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Medical Record Modal ── */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--line)]">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[#0a3b69] text-white flex items-center justify-center">
                  <PlusCircle size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#0a3b69]">Add / Update Medical History</h3>
                  <p className="text-xs text-[var(--text-muted)]">Saved locally to this profile</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex p-2 bg-[#f4f8fc] border-b border-[var(--line)] gap-1.5 text-xs font-bold overflow-x-auto" role="tablist">
              {[
                { id: 'med', label: 'Medicine' },
                { id: 'alg', label: 'Allergy' },
                { id: 'cond', label: 'Condition' },
                { id: 'emg', label: 'Protocol' },
                { id: 'provider', label: 'Provider' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={editTab === t.id}
                  onClick={() => handleEditTabChange(t.id as any)}
                  className={`flex-1 min-h-[44px] py-2 px-2.5 rounded-lg transition-all font-bold text-center shrink-0 cursor-pointer ${
                    editTab === t.id ? 'bg-[#0a3b69] text-white shadow-xs' : 'text-[#0a3b69] hover:bg-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              {editTab === 'med' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Medicine Name *</label>
                    <input
                      type="text"
                      required
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      placeholder="e.g. Metformin"
                      className="w-full p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text)] mb-1">Dosage</label>
                      <input
                        type="text"
                        value={newMed.dosage}
                        onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                        placeholder="e.g. 500mg daily"
                        className="w-full p-2 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text)] mb-1">Condition Treated</label>
                      <input
                        type="text"
                        value={newMed.condition}
                        onChange={(e) => setNewMed({ ...newMed, condition: e.target.value })}
                        placeholder="e.g. Type 2 Diabetes"
                        className="w-full p-2 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] mb-1">Doctor Notes</label>
                    <input
                      type="text"
                      value={newMed.notes}
                      onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
                      placeholder="e.g. Take with food"
                      className="w-full p-2 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>
                </>
              )}

              {editTab === 'alg' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Substance / Drug *</label>
                    <input
                      type="text"
                      required
                      value={newAlg.substance}
                      onChange={(e) => setNewAlg({ ...newAlg, substance: e.target.value })}
                      placeholder="e.g. Penicillin, Sulfa drugs"
                      className="w-full p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Severity</label>
                    <select
                      value={newAlg.severity}
                      onChange={(e) => setNewAlg({ ...newAlg, severity: e.target.value as any })}
                      className="w-full p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    >
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                      <option value="Life-Threatening">Life-Threatening</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Reaction Description</label>
                    <textarea
                      rows={2}
                      value={newAlg.reaction}
                      onChange={(e) => setNewAlg({ ...newAlg, reaction: e.target.value })}
                      placeholder="e.g. Swelling, hives, respiratory distress"
                      className="w-full p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>
                </>
              )}

              {editTab === 'cond' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Category</label>
                    <select
                      value={newCond.category}
                      onChange={(e) => setNewCond({ ...newCond, category: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    >
                      <option value="Dietary">Dietary</option>
                      <option value="Positioning">Positioning</option>
                      <option value="Environmental">Environmental</option>
                      <option value="Physical">Physical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Care Instruction *</label>
                    <textarea
                      rows={3}
                      required
                      value={newCond.instruction}
                      onChange={(e) => setNewCond({ ...newCond, instruction: e.target.value })}
                      placeholder="e.g. Low sodium diet, elevate feet when sitting"
                      className="w-full p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>
                </>
              )}

              {editTab === 'emg' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Trigger Condition *</label>
                    <input
                      type="text"
                      required
                      value={newEmg.trigger}
                      onChange={(e) => setNewEmg({ ...newEmg, trigger: e.target.value })}
                      placeholder="e.g. Sudden severe dizziness or chest tightness"
                      className="w-full p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Emergency Action Steps *</label>
                    <textarea
                      rows={3}
                      required
                      value={newEmg.action}
                      onChange={(e) => setNewEmg({ ...newEmg, action: e.target.value })}
                      placeholder="e.g. Administer sublingual spray, keep seated, call 108 immediately"
                      className="w-full p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>
                </>
              )}

              {editTab === 'provider' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Doctor Name</label>
                    <input
                      type="text"
                      value={providerForm.doctorName}
                      onChange={(e) => setProviderForm({ ...providerForm, doctorName: e.target.value })}
                      placeholder="e.g. Dr. Rajesh Kumar"
                      className="w-full p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Hospital / Clinic</label>
                    <input
                      type="text"
                      value={providerForm.hospitalName}
                      onChange={(e) => setProviderForm({ ...providerForm, hospitalName: e.target.value })}
                      placeholder="e.g. City Health Centre"
                      className="w-full p-2.5 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text)] mb-1">City</label>
                      <input
                        type="text"
                        value={providerForm.city}
                        onChange={(e) => setProviderForm({ ...providerForm, city: e.target.value })}
                        placeholder="e.g. Hyderabad"
                        className="w-full p-2 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text)] mb-1">Phone</label>
                      <input
                        type="text"
                        value={providerForm.contactPhone}
                        onChange={(e) => setProviderForm({ ...providerForm, contactPhone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full p-2 rounded-lg border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-4 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-lg border border-[var(--line)] text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-1.5 px-5 rounded-lg text-xs font-bold text-white shadow-sm cursor-pointer"
                  style={{ background: 'var(--teal)' }}
                >
                  <Save size={14} /> Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Share With Hospital QR Modal ── */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
              <h3 className="text-base font-bold text-[#0a3b69] flex items-center gap-2">
                <QrCode size={18} /> Medical Passport QR
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-[#f0f7fc] border border-[#c2dcf3] rounded-2xl inline-block">
              <div className="w-48 h-48 bg-white border border-[#0a3b69]/20 rounded-xl flex flex-col items-center justify-center p-3 mx-auto shadow-inner">
                <QrCode size={130} className="text-[#0a3b69]" />
                <span className="font-mono text-xs font-bold text-[#0a3b69] mt-2">{passportId}</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-[var(--text-muted)]">
                Present this QR code or Passport ID at hospital check-in to securely share your allergies and medical records.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPassport}
                className="w-full sm:flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border border-[var(--line)] text-xs font-bold text-[#0a3b69] hover:bg-[#f0f7fc] transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy ID'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="w-full sm:flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl bg-[#0a3b69] text-xs font-bold text-white hover:brightness-110 transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </PatientShell>
  );
}
