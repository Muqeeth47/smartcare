'use client';

import { useState } from 'react';
import type { QueueItem, QueueStatus } from '@smartcare/types';
import { cn, getTriageColor } from '@/lib/utils';
import {
  Users,
  Activity,
  AlertTriangle,
  Siren,
  Bell,
  Stethoscope,
  Clock,
  CheckCircle2,
  Volume2,
  Filter,
  HeartPulse,
  QrCode,
  Thermometer,
} from 'lucide-react';

interface LiveQueueTriageVisualizerProps {
  queue: QueueItem[];
  currentPatient: QueueItem | null;
  onAdvanceCurrent: () => void;
  onCallPatient: (patient: QueueItem) => void;
  onStartConsultation: (patient: QueueItem) => void;
  onOpenERxStudio: (patient: QueueItem) => void;
  onOpenVitals: (patient: QueueItem) => void;
  onOpenPassport: (patient: QueueItem) => void;
}

export function LiveQueueTriageVisualizer({
  queue,
  currentPatient,
  onAdvanceCurrent,
  onCallPatient,
  onStartConsultation,
  onOpenERxStudio,
  onOpenVitals,
  onOpenPassport,
}: LiveQueueTriageVisualizerProps) {
  const [triageFilter, setTriageFilter] = useState<'all' | 'critical' | 'priority' | 'routine'>('all');
  const [chimePlayed, setChimePlayed] = useState(false);

  // Categorize queue by urgency
  const criticalCount = queue.filter(
    (p) => p.triage === 'Red' || p.triage?.toLowerCase().includes('critical') || p.triage?.toLowerCase().includes('trauma')
  ).length;

  const priorityCount = queue.filter(
    (p) => p.triage === 'Yellow' || p.triage?.toLowerCase().includes('urgent') || p.triage?.toLowerCase().includes('priority')
  ).length;

  const routineCount = queue.filter(
    (p) => !p.triage || p.triage === 'Green' || p.triage?.toLowerCase().includes('standard') || p.triage?.toLowerCase().includes('routine')
  ).length;

  // Sound chime synthesizer simulation using Web Audio API
  const playCallChime = () => {
    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
      }
    } catch {}
    setChimePlayed(true);
    setTimeout(() => setChimePlayed(false), 2000);
  };

  const handleCallNextWithSound = () => {
    playCallChime();
    onAdvanceCurrent();
  };

  const filteredQueue = queue.filter((item) => {
    if (triageFilter === 'critical') {
      return item.triage === 'Red' || item.triage?.toLowerCase().includes('critical') || item.triage?.toLowerCase().includes('trauma');
    }
    if (triageFilter === 'priority') {
      return item.triage === 'Yellow' || item.triage?.toLowerCase().includes('urgent') || item.triage?.toLowerCase().includes('priority');
    }
    if (triageFilter === 'routine') {
      return !item.triage || item.triage === 'Green' || item.triage?.toLowerCase().includes('standard') || item.triage?.toLowerCase().includes('routine');
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Triage Urgency HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Triage 1: Critical */}
        <div
          onClick={() => setTriageFilter(triageFilter === 'critical' ? 'all' : 'critical')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between',
            triageFilter === 'critical'
              ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/30'
              : 'bg-[var(--surface)] border-[var(--line)] hover:border-rose-400'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Siren className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Triage 1 · Critical
              </span>
              <strong className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                {criticalCount}
              </strong>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300">
            Immediate
          </span>
        </div>

        {/* Triage 2: Priority */}
        <div
          onClick={() => setTriageFilter(triageFilter === 'priority' ? 'all' : 'priority')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between',
            triageFilter === 'priority'
              ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-[var(--surface)] border-[var(--line)] hover:border-amber-400'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Triage 2 · Priority
              </span>
              <strong className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                {priorityCount}
              </strong>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
            &lt; 15 min
          </span>
        </div>

        {/* Triage 3: Routine */}
        <div
          onClick={() => setTriageFilter(triageFilter === 'routine' ? 'all' : 'routine')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between',
            triageFilter === 'routine'
              ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-[var(--surface)] border-[var(--line)] hover:border-emerald-400'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Triage 3 · Routine
              </span>
              <strong className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {routineCount}
              </strong>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            Standard OPD
          </span>
        </div>

        {/* All Queue Count */}
        <div
          onClick={() => setTriageFilter('all')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between',
            triageFilter === 'all'
              ? 'bg-[var(--mint)] border-[var(--teal)] ring-2 ring-[var(--teal)]/20'
              : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--teal)]'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--mint)] text-[var(--teal)] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Total Live Queue
              </span>
              <strong className="text-xl font-extrabold text-[var(--text)]">
                {queue.length}
              </strong>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)]">
            All Visits
          </span>
        </div>
      </div>

      {/* Main Calling Stage & Active Consultation Console */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-5 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-[var(--teal)]">
                Live OPD Calling Board
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text)] mt-0.5">
              {currentPatient ? (
                <span>
                  Now Calling:{' '}
                  <span className="text-[var(--teal)] font-mono">{currentPatient.id}</span> — {currentPatient.name}
                </span>
              ) : (
                <span>OPD Queue Ready · Waiting for Patient Intake</span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentPatient && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenERxStudio(currentPatient)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--teal)] text-white text-xs font-bold hover:opacity-90 transition shadow-xs min-h-[44px] cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4" />
                  Launch e-Rx Studio
                </button>

                <button
                  type="button"
                  onClick={() => onOpenVitals(currentPatient)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text)] hover:bg-[var(--mint)] text-xs font-semibold transition min-h-[44px] cursor-pointer"
                >
                  <Thermometer className="w-4 h-4 text-[var(--teal)]" />
                  Vitals
                </button>

                <button
                  type="button"
                  onClick={() => onOpenPassport(currentPatient)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text)] hover:bg-[var(--mint)] text-xs font-semibold transition min-h-[44px] cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-[var(--teal)]" />
                  Passport
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleCallNextWithSound}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition min-h-[44px] cursor-pointer shadow-xs',
                chimePlayed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[var(--surface-sunken)] hover:bg-[var(--mint)] text-[var(--text)] border border-[var(--line)]'
              )}
              title="Call next patient with audio chime"
            >
              <Volume2 className={cn('w-4 h-4 text-[var(--teal)]', chimePlayed && 'animate-bounce text-white')} />
              <span>{currentPatient?.status === 'called' ? 'Start Consultation' : 'Call Next Patient'}</span>
            </button>
          </div>
        </div>

        {/* Current Patient Vitals & Clinical Snapshot */}
        {currentPatient && (
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
              <span className="text-[11px] text-[var(--text-muted)] block">Triage Classification</span>
              <span className={cn('inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold', getTriageColor(currentPatient.triage))}>
                {currentPatient.triage || 'Standard OPD'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
              <span className="text-[11px] text-[var(--text-muted)] block">Presenting Symptoms</span>
              <strong className="text-xs font-bold text-[var(--text)] mt-1 block truncate">
                {currentPatient.symptoms || 'General OPD follow-up'}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
              <span className="text-[11px] text-[var(--text-muted)] block">Assigned Clinician</span>
              <strong className="text-xs font-bold text-[var(--text)] mt-1 block truncate">
                {currentPatient.doctorName || 'Dr Meera Shah'}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
              <span className="text-[11px] text-[var(--text-muted)] block">Consultation Room</span>
              <strong className="text-xs font-bold text-[var(--teal)] mt-1 block">
                Room #01 · OPD West Wing
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
