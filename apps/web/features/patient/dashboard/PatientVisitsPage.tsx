'use client';

import { useState } from 'react';
import { usePatient, useSession, useAppStore } from '@/lib/store/app-store';
import { PatientShell } from '@/components/layout/Shell';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Building2, FileDown, Clock, Printer, X, HeartPulse, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { PatientVisit } from '@smartcare/types';

export function PatientVisitsPage() {
  const { role } = useAuthGuard(['patient']);
  const { patientVisits, patientData } = usePatient();
  const { email } = useSession();
  const showToast = useAppStore((s) => s.showToast);

  const [activePrintVisit, setActivePrintVisit] = useState<PatientVisit | null>(null);

  if (!role) return null;

  const patientName = patientData.name || (email === 'patient@smartcare.demo' ? 'Asha Rao' : email.split('@')[0].replace(/[._-]/g, ' '));

  const handlePrint = (visit: PatientVisit) => {
    setActivePrintVisit(visit);
  };

  const executePrint = () => {
    window.print();
  };

  return (
    <PatientShell subtitle="My Visits" backHref="/dashboard/patient">
      <div className="max-w-2xl mx-auto py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-[#0a3b69]">My visits</h1>
          <span className="text-xs text-[var(--text-muted)]">
            {patientVisits.length} recorded {patientVisits.length === 1 ? 'consultation' : 'consultations'}
          </span>
        </div>

        {patientVisits.length === 0 ? (
          <div className="text-center py-16 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] shadow-xs">
            <Clock size={32} className="mx-auto text-[var(--text-dim)] mb-3" />
            <p className="text-sm text-[var(--text-muted)]">No visits recorded yet.</p>
            <Link href="/dashboard/patient/apply/1" className="text-sm text-[var(--teal)] hover:underline mt-2 block font-semibold">
              Book your first appointment →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {patientVisits.map((visit) => (
              <div key={visit.id} className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-4 shadow-xs hover:border-[var(--teal)]/40 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 bg-[var(--mint)] rounded-xl flex items-center justify-center text-[var(--teal)] shrink-0">
                    <Building2 size={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-[#0a3b69]">{visit.hospital}</p>
                      <button
                        type="button"
                        onClick={() => handlePrint(visit)}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--mint)] text-[var(--teal)] hover:bg-[var(--teal)] hover:text-white transition-colors cursor-pointer"
                        title="Download / Print Visit Slip"
                      >
                        <FileDown size={14} />
                        <span>Print Slip</span>
                      </button>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{visit.reason}</p>
                    <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                      <span className="text-xs text-[var(--text-dim)]">{visit.date}</span>
                      <span
                        className={cn(
                          'text-[11px] font-bold px-2 py-0.5 rounded-full',
                          visit.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {visit.status}
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#0f5ca8] bg-[#eaf4fd] px-2 py-0.5 rounded-md">
                        {visit.reference}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable Visit Slip Modal Dialog */}
      {activePrintVisit && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <button
              type="button"
              onClick={() => setActivePrintVisit(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Printable Content Container */}
            <div id="printable-medical-report" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#0a3b69] text-white flex items-center justify-center">
                    <HeartPulse size={18} />
                  </span>
                  <div>
                    <strong className="block text-sm font-extrabold text-[#0a3b69]">SmartCare Visit Slip</strong>
                    <span className="text-[10px] text-slate-500">Official Consultation Summary</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Token Ref</span>
                  <span className="text-xs font-mono font-bold text-[#0f5ca8]">{activePrintVisit.reference}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Patient Name</span>
                  <strong className="text-slate-800 font-bold">{patientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Consultation Date</span>
                  <strong className="text-slate-800 font-bold">{activePrintVisit.date}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Healthcare Centre</span>
                  <strong className="text-slate-800 font-bold">{activePrintVisit.hospital}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 size={12} /> {activePrintVisit.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Clinical Note / Reason</span>
                <p className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {activePrintVisit.reason}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/60 text-[11px] text-blue-900 leading-relaxed">
                This document is a certified patient token summary issued through SmartCare Systems. Retain for insurance claim verification or follow-up OPD care.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActivePrintVisit(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={executePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0f5ca8] text-white hover:bg-[#0a3b69] transition-colors shadow-sm"
              >
                <Printer size={14} />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </PatientShell>
  );
}
