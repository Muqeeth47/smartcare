'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Footer } from '@/components/layout/Shell';
import { DemoDB } from '@/lib/db/demo-db';
import type { Prescription } from '@smartcare/types';
import {
  ShieldCheck,
  Search,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Printer,
  Pill,
  FileQuestion,
  FileCheck,
  Stethoscope,
  Building2,
  X,
} from 'lucide-react';

export function VerifyRxPage() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || searchParams.get('rx') || 'RX-2026-DEMO01';

  const [query, setQuery] = useState(initialId);
  const [activeRxId, setActiveRxId] = useState(initialId);
  const [rxRecord, setRxRecord] = useState<Prescription | null>(null);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [pharmacyName, setPharmacyName] = useState('Apollo Pharmacy - Banjara Hills');
  const [pharmacistLicense, setPharmacistLicense] = useState('TS-PH-2024-8842');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeRxId) {
      const rec = DemoDB.getPrescriptionByRxId(activeRxId);
      setRxRecord(rec);
    } else {
      setRxRecord(null);
    }
  }, [activeRxId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setActiveRxId(query.trim());
  };

  const handleConfirmDispensation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxRecord) return;
    const res = DemoDB.dispensePrescription(rxRecord.rxId || activeRxId, {
      pharmacyName: pharmacyName.trim(),
      pharmacistName: pharmacistLicense.trim(),
    });

    if (res.success && res.prescription) {
      setRxRecord(res.prescription);
      setShowDispenseModal(false);
      showToast('Prescription marked as DISPENSED & permanently locked against reuse.');
    } else {
      alert(res.error || 'Failed to dispense prescription');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-sunken)] text-[var(--text)] transition-colors">
      <Topbar variant="landing" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--mint)] text-[var(--teal)] border border-[var(--line)] mb-3">
            <ShieldCheck className="w-4 h-4 text-[var(--teal)]" />
            Official Tamper-Proof Cryptographic Verification
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
            Verify Medical Prescription
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)] max-w-xl mx-auto">
            Authorized pharmacists and care providers can verify authenticity directly against issuing hospital records and enforce one-time dispensation under Schedule H regulations.
          </p>
        </div>

        {/* Lookup Search Box */}
        <div className="bg-[var(--surface)] rounded-2xl p-4 shadow-sm border border-[var(--line)] mb-6 transition-colors">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Rx Token (e.g. RX-2026-DEMO01)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] text-[var(--text)] text-base focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] transition-colors"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--teal)] hover:opacity-90 text-white font-semibold text-sm transition shadow-sm min-h-[48px] cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Verify Record
              </button>
              <button
                type="button"
                onClick={() => setShowScannerModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--mint)] text-[var(--text)] font-semibold text-sm transition min-h-[48px] cursor-pointer"
                title="Scan prescription QR code with camera"
              >
                <QrCode className="w-4 h-4 text-[var(--teal)]" />
                Scan QR
              </button>
            </div>
          </form>
        </div>

        {/* Prescription Verification Result Card */}
        {rxRecord ? (
          <article className="bg-[var(--surface)] rounded-2xl border-2 border-[var(--line)] shadow-sm overflow-hidden mb-8 transition-colors">
            {/* Authenticity Header Banner */}
            <div
              className={`p-5 sm:p-6 border-b border-[var(--line)] ${
                rxRecord.status === 'dispensed'
                  ? 'bg-rose-500/10'
                  : 'bg-emerald-500/10'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      rxRecord.status === 'dispensed'
                        ? 'bg-rose-500/20 text-rose-500'
                        : 'bg-emerald-500/20 text-emerald-500'
                    }`}
                  >
                    {rxRecord.status === 'dispensed' ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <ShieldCheck className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
                          rxRecord.status === 'dispensed'
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {rxRecord.status === 'dispensed' ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-white" />
                            DISPENSED &amp; LOCKED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-white" />
                            VERIFIED GENUINE PRESCRIPTION
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--surface-sunken)] px-2 py-0.5 rounded border border-[var(--line)]">
                        Hash: {rxRecord.tamperHash || 'SEC-99A82B-VERIFIED'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-1 font-mono">
                      {rxRecord.rxId}
                    </h2>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-[var(--text-muted)] block">Issuing Hospital</span>
                  <strong className="text-sm sm:text-base text-[var(--teal)] font-semibold flex items-center sm:justify-end gap-1">
                    <Building2 className="w-4 h-4 text-[var(--teal)] inline" />
                    {rxRecord.hospital || 'SmartCare Community Hospital'}
                  </strong>
                </div>
              </div>

              {/* Status Warning Banner */}
              {rxRecord.status === 'dispensed' ? (
                <div className="mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                    DUPLICATE DISPENSING BLOCKED: PRESCRIPTION PERMANENTLY LOCKED
                  </div>
                  <p className="m-0 leading-relaxed">
                    Fulfilled at <strong>{rxRecord.dispensedBy || 'SmartCare Dispensary'}</strong> on{' '}
                    <strong>{rxRecord.dispensedAt}</strong> by{' '}
                    {rxRecord.dispensedPharmacist || 'Licensed Pharmacist'} (Lic:{' '}
                    {rxRecord.pharmacistLicense || 'TS-PH-2024-8842'}). Under Schedule H drug regulations,
                    this token is locked against duplicate claims.
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Active Valid Prescription (Ready to Dispense)
                  </div>
                  <p className="m-0 leading-relaxed">
                    Digitally signed by <strong>{rxRecord.doctorName || 'Dr Meera Shah'}</strong> (NMC
                    Reg: <strong>{rxRecord.doctorRegNo || 'NMC-2018-94821'}</strong>). Pharmacists can
                    fulfill medications and lock this prescription below to ensure compliance.
                  </p>
                </div>
              )}
            </div>

            {/* Patient & Clinical Metadata Grid */}
            <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-[var(--line)] bg-[var(--surface-sunken)]/50">
              <div>
                <span className="text-xs text-[var(--text-muted)] block uppercase tracking-wider font-semibold">
                  Patient Name
                </span>
                <strong className="text-sm font-semibold text-[var(--text)] mt-0.5 block">
                  {rxRecord.patientName || 'Asha Rao'}
                </strong>
              </div>
              <div>
                <span className="text-xs text-[var(--text-muted)] block uppercase tracking-wider font-semibold">
                  Prescribing Doctor
                </span>
                <strong className="text-sm font-semibold text-[var(--text)] mt-0.5 block">
                  {rxRecord.doctorName || 'Dr Meera Shah'}
                </strong>
                <span className="text-[11px] font-mono text-[var(--teal)] bg-[var(--mint)] px-1.5 py-0.5 rounded">
                  {rxRecord.doctorRegNo || 'NMC-2018-94821'}
                </span>
              </div>
              <div>
                <span className="text-xs text-[var(--text-muted)] block uppercase tracking-wider font-semibold">
                  Date Issued
                </span>
                <strong className="text-sm font-semibold text-[var(--text)] mt-0.5 block">
                  {rxRecord.issuedAt || '18 Jul 2026'}
                </strong>
              </div>
              <div>
                <span className="text-xs text-[var(--text-muted)] block uppercase tracking-wider font-semibold">
                  Vitals Recorded
                </span>
                <div className="text-xs font-mono text-[var(--text)] mt-0.5 leading-relaxed">
                  {rxRecord.vitals ? (
                    <>
                      <span>BP: {rxRecord.vitals.bp}</span> · <span>Pulse: {rxRecord.vitals.pulse}</span> ·{' '}
                      <span>SpO2: {rxRecord.vitals.spo2}</span>
                    </>
                  ) : (
                    <span>BP: 120/80 · SpO2: 99%</span>
                  )}
                </div>
              </div>
            </div>

            {/* Diagnosis / Clinical Assessment */}
            <div className="p-5 sm:p-6 border-b border-[var(--line)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-[var(--teal)]" />
                Clinical Assessment &amp; Diagnosis
              </h3>
              <p className="text-sm text-[var(--text)] leading-relaxed bg-[var(--surface-sunken)] p-3.5 rounded-xl border border-[var(--line)]">
                {rxRecord.assessment ||
                  'Acute bronchial spasm with intermittent wheeze and allergic rhinitis. Prescribed bronchodilator therapy.'}
              </p>
            </div>

            {/* Prescribed Medications Card Stack */}
            <div className="p-5 sm:p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-[var(--teal)]" />
                Prescribed Medications (Official Schedule H Record)
              </h3>
              <div className="space-y-3">
                {(rxRecord.medicines || []).map((med, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-md bg-[var(--mint)] text-[var(--teal)] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm sm:text-base font-semibold text-[var(--text)]">
                            {med.name}
                          </strong>
                          {med.strength && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--line)]">
                              {med.strength}
                            </span>
                          )}
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-[var(--mint)] text-[var(--teal)] border border-[var(--line)]">
                            {med.dosage || '1-0-1'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-muted)] flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            <strong className="text-[var(--text)]">Duration:</strong>{' '}
                            {med.duration || '5 days'}
                          </span>
                          <span>
                            <strong className="text-[var(--text)]">Instructions:</strong>{' '}
                            {med.instructions || 'After meals'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-5 sm:p-6 bg-[var(--surface-sunken)] border-t border-[var(--line)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--mint)] text-[var(--text)] text-xs font-semibold transition min-h-[48px] cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Copy
                </button>
                <Link
                  href="/pharmacy"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--mint)] text-[var(--text)] text-xs font-semibold transition min-h-[48px] cursor-pointer no-underline"
                >
                  <Pill className="w-4 h-4 text-[var(--teal)]" />
                  In-House Pharmacy
                </Link>
              </div>

              {rxRecord.status !== 'dispensed' ? (
                <button
                  type="button"
                  onClick={() => setShowDispenseModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--teal)] hover:opacity-90 text-white text-sm font-semibold transition shadow-sm min-h-[48px] cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  Confirm Dispensation &amp; Lock Rx
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--text-muted)] text-xs font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  Prescription Permanently Locked Against Refill
                </div>
              )}
            </div>
          </article>
        ) : (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-8 text-center my-8 transition-colors">
            <FileQuestion className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <h2 className="text-lg font-bold text-[var(--text)]">Prescription Reference Not Found</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mt-1 mb-5">
              No verified prescription matches token <strong>&ldquo;{activeRxId}&rdquo;</strong>.
              Verify reference code or test with our official hospital sample.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveRxId('RX-2026-DEMO01');
                setQuery('RX-2026-DEMO01');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--teal)] hover:opacity-90 text-white font-semibold text-sm transition min-h-[48px] cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              Load Sample Verified Rx (RX-2026-DEMO01)
            </button>
          </div>
        )}
      </main>

      {/* Dispense & Lock Modal */}
      {showDispenseModal && rxRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] text-[var(--text)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--line)] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[var(--teal)]" />
                  Confirm Dispensation &amp; Lock
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">Rx: {rxRecord.rxId}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDispenseModal(false)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispensation} className="space-y-4">
              <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Once marked dispensed, this prescription will be permanently locked across all pharmacies to prevent drug reuse.</span>
              </p>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Dispensing Pharmacy Name
                </label>
                <input
                  type="text"
                  required
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] text-[var(--text)] text-base focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] transition-colors"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Pharmacist License / Registration #
                </label>
                <input
                  type="text"
                  required
                  value={pharmacistLicense}
                  onChange={(e) => setPharmacistLicense(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] text-[var(--text)] text-base focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] transition-colors"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowDispenseModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--line)] text-[var(--text)] text-sm font-semibold hover:bg-[var(--mint)] min-h-[48px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--teal)] hover:opacity-90 text-white text-sm font-semibold transition min-h-[48px] cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  Confirm &amp; Lock Rx
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera QR Scanner Simulator Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] text-[var(--text)] rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-[var(--line)] animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[var(--mint)] text-[var(--teal)] flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-[var(--text)]">Camera QR Scanner</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">
              Point your device camera at the prescription QR code stamp on the printed or digital consultation summary.
            </p>

            <div className="border-2 border-dashed border-[var(--teal)]/40 rounded-xl p-6 bg-[var(--surface-sunken)] mb-4 flex flex-col items-center justify-center">
              <span className="text-xs text-[var(--text-muted)]">Camera Feed Active</span>
              <span className="text-xs font-mono font-bold text-[var(--teal)] mt-2">
                Simulating Optical OCR...
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveRxId('RX-2026-DEMO01');
                  setQuery('RX-2026-DEMO01');
                  setShowScannerModal(false);
                  showToast('Scanned code: RX-2026-DEMO01');
                }}
                className="w-full py-2.5 rounded-xl bg-[var(--teal)] text-white font-semibold text-sm hover:opacity-90 transition min-h-[48px] cursor-pointer"
              >
                Scan Demo Rx (RX-2026-DEMO01)
              </button>
              <button
                type="button"
                onClick={() => setShowScannerModal(false)}
                className="w-full py-2.5 rounded-xl border border-[var(--line)] text-[var(--text)] font-semibold text-sm hover:bg-[var(--mint)] min-h-[48px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
