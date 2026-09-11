'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { QueueItem, Prescription, PrescriptionMedicine } from '@smartcare/types';
import { DemoDB } from '@/lib/db/demo-db';
import {
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
  Pill,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  Printer,
  ExternalLink,
  CheckCircle2,
  X,
  FileText,
  Activity,
  HeartPulse,
  Info,
  ChevronRight,
  Store,
} from 'lucide-react';

interface ERxStudioModalProps {
  patient: QueueItem;
  hospitalName?: string;
  onClose: () => void;
  onSuccess: (prescription: Prescription) => void;
}

interface CommonDrug {
  name: string;
  genericName: string;
  strength: string;
  defaultDosage: string;
  defaultDuration: string;
  defaultInstructions: string;
  category: string;
  classType: 'penicillin' | 'nsaid' | 'sulfa' | 'macrolide' | 'bronchodilator' | 'other';
}

const COMMON_DRUGS: CommonDrug[] = [
  {
    name: 'Augmentin 625 (Amoxicillin + Clavulanate)',
    genericName: 'Amoxicillin + Clavulanate 625 mg (Jan Aushadhi)',
    strength: '625 mg',
    defaultDosage: '1-0-1',
    defaultDuration: '5 days',
    defaultInstructions: 'Take with food',
    category: 'Antibiotic',
    classType: 'penicillin',
  },
  {
    name: 'Amoxicillin Trihydrate',
    genericName: 'Amoxicillin 500 mg (Jan Aushadhi)',
    strength: '500 mg',
    defaultDosage: '1-1-1',
    defaultDuration: '5 days',
    defaultInstructions: 'After meals',
    category: 'Antibiotic',
    classType: 'penicillin',
  },
  {
    name: 'Dolo 650 (Paracetamol)',
    genericName: 'Paracetamol 650 mg (Jan Aushadhi)',
    strength: '650 mg',
    defaultDosage: '1-0-1',
    defaultDuration: '3 days',
    defaultInstructions: 'After meals or SOS for fever > 100°F',
    category: 'Analgesic / Antipyretic',
    classType: 'other',
  },
  {
    name: 'Brufen 400 (Ibuprofen)',
    genericName: 'Ibuprofen 400 mg (Jan Aushadhi)',
    strength: '400 mg',
    defaultDosage: '1-0-1',
    defaultDuration: '3 days',
    defaultInstructions: 'Always after meals with water',
    category: 'NSAID / Pain Relief',
    classType: 'nsaid',
  },
  {
    name: 'Asthalin Inhaler (Salbutamol)',
    genericName: 'Salbutamol Inhaler 100 mcg (Jan Aushadhi)',
    strength: '100 mcg',
    defaultDosage: '2 puffs PRN',
    defaultDuration: '30 days',
    defaultInstructions: 'Use with spacer as needed for wheeze',
    category: 'Respiratory',
    classType: 'bronchodilator',
  },
  {
    name: 'Cetzine 10 (Cetirizine)',
    genericName: 'Cetirizine 10 mg (Jan Aushadhi)',
    strength: '10 mg',
    defaultDosage: '0-0-1',
    defaultDuration: '5 days',
    defaultInstructions: 'At bedtime',
    category: 'Antihistamine',
    classType: 'other',
  },
  {
    name: 'Electral Powder (ORS)',
    genericName: 'Oral Rehydration Salts IP (Jan Aushadhi)',
    strength: '21.8 g sachet',
    defaultDosage: '1 sachet / 1L water',
    defaultDuration: '3 days',
    defaultInstructions: 'Sip throughout the day',
    category: 'Hydration',
    classType: 'other',
  },
  {
    name: 'Bactrim DS (Trimethoprim + Sulfamethoxazole)',
    genericName: 'Cotrimoxazole 800/160 mg (Jan Aushadhi)',
    strength: 'Double Strength',
    defaultDosage: '1-0-1',
    defaultDuration: '7 days',
    defaultInstructions: 'Plenty of fluids',
    category: 'Sulfa Antibiotic',
    classType: 'sulfa',
  },
  {
    name: 'Azithral 500 (Azithromycin)',
    genericName: 'Azithromycin 500 mg (Jan Aushadhi)',
    strength: '500 mg',
    defaultDosage: '1-0-0',
    defaultDuration: '3 days',
    defaultInstructions: '1 hour before food',
    category: 'Macrolide Antibiotic',
    classType: 'macrolide',
  },
];

const PRESETS = [
  {
    title: 'Viral Upper Respiratory Infection',
    tag: 'URI Protocol',
    drugs: [
      { name: 'Paracetamol 650 mg (Jan Aushadhi)', strength: '650 mg', dosage: '1-0-1', duration: '3 days', instructions: 'After food for fever' },
      { name: 'Cetirizine 10 mg (Jan Aushadhi)', strength: '10 mg', dosage: '0-0-1', duration: '5 days', instructions: 'At bedtime for runny nose' },
    ],
    assessment: 'Acute viral upper respiratory tract infection with mild pharyngitis and rhinorrhea. Advised hydration and warm saline gargles.',
  },
  {
    title: 'Acute Bronchospasm / Asthma Flare',
    tag: 'Asthma Protocol',
    drugs: [
      { name: 'Salbutamol Inhaler 100 mcg (Jan Aushadhi)', strength: '100 mcg', dosage: '2 puffs PRN', duration: '30 days', instructions: 'Use with spacer every 4-6h as needed' },
    ],
    assessment: 'Mild acute bronchospasm with intermittent expiratory wheeze. Advised avoidance of dust and allergens.',
  },
  {
    title: 'Acute Gastroenteritis & Dehydration',
    tag: 'GI Protocol',
    drugs: [
      { name: 'Oral Rehydration Salts IP (Jan Aushadhi)', strength: '21.8 g', dosage: '1L water PRN', duration: '3 days', instructions: 'Drink 200ml after each loose stool' },
      { name: 'Paracetamol 650 mg (Jan Aushadhi)', strength: '650 mg', dosage: '1-0-0 PRN', duration: '2 days', instructions: 'Only if body ache or fever' },
    ],
    assessment: 'Acute gastroenteritis without severe dehydration. Tolerating oral fluids well.',
  },
];

export function ERxStudioModal({ patient, hospitalName, onClose, onSuccess }: ERxStudioModalProps) {
  // Existing prescription if any
  const existingRx = useMemo(() => DemoDB.getPrescription(patient.id), [patient.id]);

  // Vitals
  const [bp, setBp] = useState(existingRx?.vitals?.bp || '120/80 mmHg');
  const [pulse, setPulse] = useState(existingRx?.vitals?.pulse || '76 bpm');
  const [spo2, setSpo2] = useState(existingRx?.vitals?.spo2 || '99%');
  const [temp, setTemp] = useState(existingRx?.vitals?.temp || '98.4 °F');

  // Clinical Details
  const [assessment, setAssessment] = useState(
    existingRx?.assessment || patient.symptoms ? `Clinical assessment for ${patient.symptoms}.` : 'General outpatient examination.'
  );
  const [labSummary, setLabSummary] = useState(existingRx?.labSummary || '');

  // Patient documented allergies
  const knownAllergies = useMemo(() => {
    const list: string[] = [];
    const patientAllergies = (patient as unknown as { allergies?: string }).allergies;
    if (patientAllergies) {
      list.push(...patientAllergies.split(',').map((s: string) => s.trim().toLowerCase()));
    }
    // Check demo medical history for Asha Rao or SC-DEMO001
    const passport = DemoDB.getMedicalPassport('SC-PASSPORT-8924', 'doctor');
    if (passport?.history?.allergiesAndAvoid?.length) {
      for (const a of passport.history.allergiesAndAvoid) {
        list.push(a.substance.toLowerCase());
      }
    }
    // Default fallback for demo safety testing
    if (!list.length) {
      list.push('penicillin');
    }
    return Array.from(new Set(list));
  }, [patient]);

  // Medicines builder
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>(() => {
    if (existingRx?.medicines?.length) {
      return existingRx.medicines;
    }
    return [
      {
        name: 'Paracetamol 650 mg (Jan Aushadhi)',
        strength: '650 mg',
        dosage: '1-0-1',
        duration: '5 days',
        instructions: 'After meals',
      },
    ];
  });

  // Allergy warning overrides acknowledged
  const [overrideAcknowledged, setOverrideAcknowledged] = useState(false);
  const [issuedRx, setIssuedRx] = useState<Prescription | null>(null);

  // Detect allergy conflicts in active medicines list
  const allergyConflicts = useMemo(() => {
    const conflicts: { medIndex: number; medName: string; allergicTo: string; reason: string }[] = [];
    medicines.forEach((med, idx) => {
      const lower = med.name.toLowerCase();
      // Check penicillin
      if (
        knownAllergies.some((a) => a.includes('penicillin') || a.includes('amoxicillin')) &&
        (lower.includes('amoxicillin') || lower.includes('augmentin') || lower.includes('ampicillin') || lower.includes('penicillin'))
      ) {
        conflicts.push({
          medIndex: idx,
          medName: med.name,
          allergicTo: 'Penicillin / Beta-lactams',
          reason: 'Severe anaphylaxis and cutaneous eruption risk. Consider Macrolide (Azithromycin) as alternative.',
        });
      }
      // Check NSAIDs
      if (
        knownAllergies.some((a) => a.includes('nsaid') || a.includes('aspirin') || a.includes('ibuprofen')) &&
        (lower.includes('ibuprofen') || lower.includes('brufen') || lower.includes('diclofenac') || lower.includes('aspirin'))
      ) {
        conflicts.push({
          medIndex: idx,
          medName: med.name,
          allergicTo: 'NSAIDs / Aspirin',
          reason: 'Documented NSAID hypersensitivity. Paracetamol recommended as safer analgesic.',
        });
      }
      // Check Sulfa
      if (
        knownAllergies.some((a) => a.includes('sulfa') || a.includes('sulfonamide')) &&
        (lower.includes('bactrim') || lower.includes('cotrimoxazole') || lower.includes('sulfa'))
      ) {
        conflicts.push({
          medIndex: idx,
          medName: med.name,
          allergicTo: 'Sulfonamides',
          reason: 'Stevens-Johnson Syndrome / Severe rash risk.',
        });
      }
    });
    return conflicts;
  }, [medicines, knownAllergies]);

  const handleAddMedicine = (drug?: CommonDrug) => {
    if (drug) {
      setMedicines((prev) => [
        ...prev,
        {
          name: drug.genericName || drug.name,
          strength: drug.strength,
          dosage: drug.defaultDosage,
          duration: drug.defaultDuration,
          instructions: drug.defaultInstructions,
        },
      ]);
    } else {
      setMedicines((prev) => [
        ...prev,
        {
          name: '',
          strength: '500 mg',
          dosage: '1-0-1',
          duration: '5 days',
          instructions: 'After meals',
        },
      ]);
    }
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateMedicine = (idx: number, field: keyof PrescriptionMedicine, val: string) => {
    setMedicines((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: val } : m))
    );
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setMedicines(preset.drugs);
    setAssessment(preset.assessment);
  };

  const handleIssuePrescription = (e: React.FormEvent) => {
    e.preventDefault();

    if (allergyConflicts.length > 0 && !overrideAcknowledged) {
      alert('Please review and acknowledge the critical allergy warning before signing this e-prescription.');
      return;
    }

    const rxId = existingRx?.rxId || `RX-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRx: Prescription = {
      rxId,
      visitId: patient.id,
      patientName: patient.name,
      patientAge: typeof patient.age === 'number' ? patient.age : parseInt(String(patient.age || '32'), 10),
      patientGender: patient.gender || 'Not specified',
      doctorName: 'Dr Meera Shah',
      doctorRegNo: 'NMC-2018-94821',
      providerName: 'Dr Meera Shah',
      hospital: hospitalName || 'SmartCare Community Hospital',
      assessment: assessment.trim(),
      labSummary: labSummary.trim(),
      medicines: medicines.filter((m) => m.name.trim() !== ''),
      vitals: { bp, pulse, spo2, temp },
      issuedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'active',
      tamperHash: `SEC-${Math.random().toString(36).slice(2, 8).toUpperCase()}-VERIFIED`,
      demo: true,
    };

    DemoDB.savePrescription(patient.id, newRx);
    setIssuedRx(newRx);
    onSuccess(newRx);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--surface)] text-[var(--text)] rounded-2xl max-w-3xl w-full my-6 shadow-2xl border border-[var(--line)] flex flex-col max-h-[92vh] transition-colors animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--line)] flex items-center justify-between shrink-0 bg-[var(--surface-sunken)]/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--mint)] text-[var(--teal)] flex items-center justify-center shrink-0 shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-[var(--text)]">
                  Interactive e-Rx Clinical Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--mint)] text-[var(--teal)] border border-[var(--line)]">
                  Safety Guard Active
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Patient: <strong className="text-[var(--text)]">{patient.name}</strong> ({patient.age || '32'}y / {patient.gender || 'F'}) · Ref #{patient.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--mint)] rounded-xl transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {issuedRx ? (
            /* SUCCESS CONFIRMATION STATE */
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  Tamper-Proof e-Prescription Issued
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--text)] font-mono">
                  {issuedRx.rxId}
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mt-1">
                  Cryptographically signed by Dr Meera Shah. Synced to hospital records and ready for pharmacist verification or fulfillment.
                </p>
              </div>

              {/* Hash badge */}
              <div className="bg-[var(--surface-sunken)] p-3 rounded-xl border border-[var(--line)] max-w-md mx-auto font-mono text-xs text-[var(--text-muted)] flex items-center justify-between">
                <span>Cryptographic Digest:</span>
                <strong className="text-[var(--teal)]">{issuedRx.tamperHash}</strong>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href={`/verify-rx?id=${issuedRx.rxId}`}
                  target="_blank"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--teal)] text-white font-bold text-xs hover:opacity-90 transition shadow-sm min-h-[44px] no-underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Verify on /verify-rx
                </Link>

                <Link
                  href="/pharmacy"
                  target="_blank"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text)] hover:bg-[var(--mint)] font-bold text-xs transition min-h-[44px] no-underline"
                >
                  <Store className="w-4 h-4 text-[var(--teal)]" />
                  Dispensary Fulfillment
                </Link>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--mint)] text-[var(--text)] font-bold text-xs transition min-h-[44px] cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Copy
                </button>
              </div>

              <div className="pt-4 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-[var(--surface-sunken)] hover:bg-[var(--mint)] text-[var(--text)] text-xs font-bold border border-[var(--line)] cursor-pointer"
                >
                  Return to Patient Queue
                </button>
              </div>
            </div>
          ) : (
            /* PRESCRIPTION BUILDER FORM */
            <form onSubmit={handleIssuePrescription} className="space-y-6">
              
              {/* Allergy Safety Warning Banner */}
              {knownAllergies.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] flex items-start gap-3">
                  <Info className="w-4 h-4 text-[var(--teal)] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-[var(--text)]">Patient Allergy Profile: </span>
                    <span className="text-[var(--text-muted)]">
                      {knownAllergies.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}
                    </span>
                    <span className="block text-[11px] text-[var(--text-muted)] mt-0.5">
                      SmartCare Safety Guard actively checks newly prescribed agents against this profile.
                    </span>
                  </div>
                </div>
              )}

              {/* CRITICAL ALLERGY CONFLICT WARNING */}
              {allergyConflicts.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-800 dark:text-rose-200 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-sm mb-1 text-rose-600 dark:text-rose-300">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    CRITICAL CONTRAINDICATION ALERT: POTENTIAL ALLERGIC REACTION
                  </div>
                  {allergyConflicts.map((c, idx) => (
                    <div key={idx} className="text-xs mt-2 pl-7">
                      Prescribed <strong>&ldquo;{c.medName}&rdquo;</strong> conflicts with documented{' '}
                      <strong>{c.allergicTo}</strong> allergy.
                      <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 italic">
                        {c.reason}
                      </div>
                    </div>
                  ))}

                  <div className="mt-3.5 pt-3 border-t border-rose-500/20 flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="allergy-override-check"
                      checked={overrideAcknowledged}
                      onChange={(e) => setOverrideAcknowledged(e.target.checked)}
                      className="rounded border-rose-400 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <label htmlFor="allergy-override-check" className="text-xs font-bold text-rose-800 dark:text-rose-200 cursor-pointer">
                      I have evaluated clinical alternatives and explicitly authorize this medication under physician oversight.
                    </label>
                  </div>
                </div>
              )}

              {/* Quick Protocol Presets */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Clinical Diagnosis Protocols (1-Click Fill)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] hover:border-[var(--teal)] hover:bg-[var(--mint)] text-left transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--mint)] text-[var(--teal)]">
                          {p.tag}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      </div>
                      <div className="font-bold text-xs text-[var(--text)] mt-1.5 truncate">
                        {p.title}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        {p.drugs.length} medicines pre-loaded
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vitals Summary Strip */}
              <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[var(--teal)]" />
                  Arrival Vitals (Recorded by Triage)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-[var(--text-muted)] block">Blood Pressure</label>
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--text)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--text-muted)] block">Pulse Rate</label>
                    <input
                      type="text"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--text)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--text-muted)] block">Blood Oxygen (SpO2)</label>
                    <input
                      type="text"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--text)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--text-muted)] block">Temperature</label>
                    <input
                      type="text"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--text)] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Assessment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Clinical Assessment &amp; Diagnosis *
                </label>
                <textarea
                  required
                  rows={2}
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  placeholder="e.g. Acute bronchitis with intermittent wheezing. Lungs clear bilaterally..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] text-xs sm:text-sm text-[var(--text)] focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] transition-colors"
                />
              </div>

              {/* Multi-Medication Regimen Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-[var(--teal)]" />
                    Prescribed Medications ({medicines.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddMedicine()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--mint)] text-[var(--teal)] hover:opacity-90 font-bold text-xs border border-[var(--line)] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Custom Drug
                  </button>
                </div>

                <div className="space-y-3">
                  {medicines.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] space-y-2.5 relative group transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--teal)] border border-[var(--line)]">
                          Drug #{idx + 1}
                        </span>
                        {medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(idx)}
                            className="text-[var(--text-muted)] hover:text-rose-500 p-1 rounded transition cursor-pointer"
                            title="Remove medication"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-[var(--text-muted)] mb-0.5">Medicine Name &amp; Formulation</label>
                          <input
                            type="text"
                            required
                            value={med.name}
                            onChange={(e) => handleUpdateMedicine(idx, 'name', e.target.value)}
                            placeholder="e.g. Paracetamol 650 mg (Jan Aushadhi)"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--text)] font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[var(--text-muted)] mb-0.5">Strength</label>
                          <input
                            type="text"
                            value={med.strength}
                            onChange={(e) => handleUpdateMedicine(idx, 'strength', e.target.value)}
                            placeholder="e.g. 650 mg / 100 mcg"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--text)]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] text-[var(--text-muted)] mb-0.5">Frequency / Dosage</label>
                          <select
                            value={med.dosage}
                            onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--text)]"
                          >
                            <option value="1-0-1">1-0-1 (Morning &amp; Night)</option>
                            <option value="1-1-1">1-1-1 (TID - 3 times a day)</option>
                            <option value="0-0-1">0-0-1 (At Bedtime)</option>
                            <option value="1-0-0">1-0-0 (Morning only)</option>
                            <option value="PRN">PRN (As needed)</option>
                            <option value="2 puffs PRN">2 puffs PRN (Inhaler)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-[var(--text-muted)] mb-0.5">Duration</label>
                          <input
                            type="text"
                            value={med.duration}
                            onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                            placeholder="e.g. 5 days / 1 month"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--text)]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[var(--text-muted)] mb-0.5">Instructions</label>
                          <input
                            type="text"
                            value={med.instructions}
                            onChange={(e) => handleUpdateMedicine(idx, 'instructions', e.target.value)}
                            placeholder="e.g. After meals with warm water"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--text)]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Add from Hospital Formulary */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">
                    + Quick Add from Formulary:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_DRUGS.slice(0, 6).map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddMedicine(d)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--teal)] hover:bg-[var(--mint)] text-[var(--text)] transition cursor-pointer"
                      >
                        + {d.name.split(' ')[0]} {d.strength}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lab Orders & Follow-up */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Lab Investigations / Special Notes
                </label>
                <input
                  type="text"
                  value={labSummary}
                  onChange={(e) => setLabSummary(e.target.value)}
                  placeholder="e.g. CBC, Serum Creatinine on day 5. Review OPD in 7 days."
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] text-xs text-[var(--text)] focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] transition-colors"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[var(--line)] text-[var(--text)] text-xs font-bold hover:bg-[var(--mint)] transition min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--teal)] hover:opacity-90 text-white font-bold text-xs sm:text-sm transition shadow-sm min-h-[44px] cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  Digitally Sign &amp; Issue e-Rx
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
