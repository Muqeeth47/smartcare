'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQueue, useSession, useAppStore, sortQueue, queueStatus } from '@/lib/store/app-store';
import { WorkspaceShell } from '@/components/layout/Shell';
import { cn, timeAgo, getTriageColor } from '@/lib/utils';
import { DemoDB } from '@/lib/db/demo-db';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  QrCode,
  ArrowRight,
  PhoneCall,
  Stethoscope,
  X,
  Sparkles,
  Activity,
  Check,
} from 'lucide-react';
import type { QueueItem, QueueStatus } from '@smartcare/types';

export function QueueWorkspacePage() {
  const { role } = useAuthGuard(['doctor', 'staff']);
  const { hospital, city } = useSession();
  const { queue, metrics } = useQueue();
  const showToast = useAppStore((s) => s.showToast);
  const setQueue = useAppStore((s) => s.setQueue);
  const updateQueueItem = useAppStore((s) => s.updateQueueItem);

  const router = useRouter();
  const searchParams = useSearchParams();
  const priorityParam = searchParams.get('priority') as 'all' | 'Red' | 'Yellow' | 'Green' | null;
  const statusParam = searchParams.get('status') as 'all' | 'waiting' | 'called' | 'in_progress' | 'completed' | null;

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'Red' | 'Yellow' | 'Green'>(
    priorityParam && ['Red', 'Yellow', 'Green'].includes(priorityParam) ? priorityParam : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'called' | 'in_progress' | 'completed'>(
    statusParam && ['waiting', 'called', 'in_progress', 'completed'].includes(statusParam) ? statusParam : 'all'
  );

  const handlePriorityFilterChange = (priority: 'all' | 'Red' | 'Yellow' | 'Green') => {
    setPriorityFilter(priority);
    const params = new URLSearchParams(searchParams.toString());
    if (priority === 'all') params.delete('priority');
    else params.set('priority', priority);
    router.replace(`/dashboard/queue?${params.toString()}`, { scroll: false });
  };

  const handleStatusFilterChange = (status: 'all' | 'waiting' | 'called' | 'in_progress' | 'completed') => {
    setStatusFilter(status);
    const params = new URLSearchParams(searchParams.toString());
    if (status === 'all') params.delete('status');
    else params.set('status', status);
    router.replace(`/dashboard/queue?${params.toString()}`, { scroll: false });
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  // QR Modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrInput, setQrInput] = useState('');

  if (!role) return null;

  const sorted = sortQueue(queue);

  const filteredQueue = sorted.filter((item) => {
    // Priority filter
    if (priorityFilter !== 'all' && item.triage !== priorityFilter) {
      return false;
    }
    // Status filter
    const status = queueStatus(item);
    if (statusFilter !== 'all' && status !== statusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchSymptoms = item.symptoms?.toLowerCase().includes(q);
      const matchId = item.id.toLowerCase().includes(q);
      const matchDoctor = item.doctorName?.toLowerCase().includes(q);
      if (!matchName && !matchSymptoms && !matchId && !matchDoctor) {
        return false;
      }
    }
    return true;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await DemoDB.fetchQueue();
      setQueue(fresh);
      showToast('Queue updated with live snapshot', 'info');
    } catch {
      showToast('Queue refreshed', 'info');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const advance = async (id: string, currentStatus: string) => {
    const next = ({
      waiting: 'called',
      called: 'in_progress',
      in_progress: 'completed',
    } as Record<string, QueueStatus>)[currentStatus];
    if (!next) return;

    updateQueueItem(id, { status: next });
    await DemoDB.updatePatient(id, { status: next });
    const label = next === 'called' ? 'called for consultation' : next === 'in_progress' ? 'consultation started' : 'visit completed';
    showToast(`Patient ${label}`, 'success');
  };

  const handleLookupQr = () => {
    const clean = qrInput.trim();
    if (!clean) return;

    const found = queue.find(
      (item) => item.id.toLowerCase() === clean.toLowerCase() || clean.toUpperCase().includes('PASSPORT')
    );

    if (found) {
      showToast(`Found patient ticket for ${found.name} (${found.id})`, 'success');
      setSearchQuery(found.name);
      setShowQRModal(false);
      setQrInput('');
    } else {
      showToast(`No matching queue record found for "${clean}"`, 'error');
    }
  };

  return (
    <WorkspaceShell title="Queue workspace" subtitle="Hospital portal">
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
        {/* Provider Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--line)]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--teal)] uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Shared Queue
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
              See every patient handoff.
            </h1>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              {hospital || 'SmartCare Community Hospital'} · {city || 'Hyderabad'}
            </p>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl px-4 py-3 shadow-xs text-right sm:shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
            <span className="text-xs text-[var(--muted)] font-medium">Live Queue</span>
            <strong className="text-sm sm:text-base font-extrabold text-[var(--teal)]">
              {metrics.waiting} waiting now
            </strong>
          </div>
        </div>

        {/* 4 Provider Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 shadow-xs flex items-start justify-between">
            <div>
              <span className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider block">Waiting now</span>
              <strong className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] mt-1 block">
                {metrics.waiting}
              </strong>
              <small className="text-[11px] text-[var(--muted)]">Live queue count</small>
            </div>
            <span className="w-10 h-10 rounded-xl bg-[var(--mint)] text-[var(--teal)] flex items-center justify-center shrink-0">
              <Users size={20} />
            </span>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 shadow-xs flex items-start justify-between">
            <div>
              <span className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider block">Priority cases</span>
              <strong className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] mt-1 block">
                {metrics.priority}
              </strong>
              <small className="text-[11px] text-[var(--muted)]">Needs attention first</small>
            </div>
            <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </span>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 shadow-xs flex items-start justify-between">
            <div>
              <span className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider block">Average wait</span>
              <strong className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] mt-1 block">
                {metrics.averageWait}m
              </strong>
              <small className="text-[11px] text-[var(--muted)]">Based on arrival time</small>
            </div>
            <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </span>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 shadow-xs flex items-start justify-between">
            <div>
              <span className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider block">Queue state</span>
              <strong className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 block">
                {metrics.waiting > 0 ? 'Active' : 'Clear'}
              </strong>
              <small className="text-[11px] text-[var(--muted)]">Ready for new visits</small>
            </div>
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </span>
          </div>
        </div>

        {/* Main Queue Management Section */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--ink)]">Patient queue</h2>
              <p className="text-xs sm:text-sm text-[var(--muted)]">
                Search by patient name, triage priority, symptoms, or registration token.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowQRModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 text-xs font-bold rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] hover:bg-[var(--mint)] hover:text-[var(--teal)] active:scale-95 transition-all"
              >
                <QrCode size={15} />
                <span>Scan QR Ticket</span>
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 text-xs font-bold rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] hover:bg-[var(--surface)] active:scale-95 transition-all"
                title="Refresh queue"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[var(--teal)]' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-[var(--line)]">
            <div className="sm:col-span-6 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, symptoms, or ID..."
                className="w-full pl-10 pr-3 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] focus:outline-none focus:border-[var(--teal)] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="sm:col-span-3">
              <select
                value={priorityFilter}
                onChange={(e) => handlePriorityFilterChange(e.target.value as any)}
                className="w-full px-3 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] focus:outline-none focus:border-[var(--teal)] font-medium text-[var(--ink)] cursor-pointer"
              >
                <option value="all">All priorities</option>
                <option value="Red">Red (Urgent)</option>
                <option value="Yellow">Yellow (Moderate)</option>
                <option value="Green">Green (Standard)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as any)}
                className="w-full px-3 py-2.5 min-h-[44px] text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] focus:outline-none focus:border-[var(--teal)] font-medium text-[var(--ink)] cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="waiting">Waiting</option>
                <option value="called">Called</option>
                <option value="in_progress">In Consultation</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Queue List */}
          {filteredQueue.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[var(--surface-sunken)]/50 border border-dashed border-[var(--line)] rounded-2xl">
              <Users size={36} className="mx-auto text-[var(--muted)] mb-3 opacity-60" />
              <p className="text-sm font-semibold text-[var(--ink)]">No queue entries found</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {searchQuery || priorityFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria or priority filter.'
                  : 'The queue is currently clear.'}
              </p>
              {(searchQuery || priorityFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPriorityFilter('all');
                    setStatusFilter('all');
                  }}
                  className="mt-3 px-3 py-1.5 text-xs font-bold text-[var(--teal)] hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQueue.map((item, index) => {
                const status = queueStatus(item);
                const canAdvance = ['waiting', 'called', 'in_progress'].includes(status);
                const actionData = ({
                  waiting: { label: 'Call next', icon: PhoneCall, variant: 'teal' },
                  called: { label: 'Start visit', icon: Stethoscope, variant: 'amber' },
                  in_progress: { label: 'Complete visit', icon: CheckCircle2, variant: 'emerald' },
                } as Record<string, { label: string; icon: any; variant: string }>)[status];

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs',
                      status === 'in_progress'
                        ? 'bg-emerald-50/40 border-emerald-300 dark:bg-emerald-950/20'
                        : status === 'called'
                        ? 'bg-amber-50/40 border-amber-300 dark:bg-amber-950/20'
                        : status === 'completed'
                        ? 'bg-[var(--surface-sunken)]/30 border-[var(--line)] opacity-80'
                        : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--teal)]/40'
                    )}
                  >
                    {/* Left: Position & Patient Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-center text-xs font-extrabold text-[var(--muted)] shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <strong className="text-sm sm:text-base font-extrabold text-[var(--ink)]">
                            {item.name}
                          </strong>
                          <span className={cn('status-pill text-[10px] font-extrabold px-2 py-0.5 rounded-full', getTriageColor(item.triage))}>
                            {item.triage}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider',
                              status === 'in_progress'
                                ? 'bg-emerald-100 text-emerald-800'
                                : status === 'called'
                                ? 'bg-amber-100 text-amber-800'
                                : status === 'completed'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-blue-100 text-blue-800'
                            )}
                          >
                            {status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted)] leading-relaxed">
                          {item.symptoms || 'General consultation'} {item.age ? `· ${item.age} yrs` : ''} · {timeAgo(item.created_at)}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                          {item.doctorName && (
                            <span className="text-[var(--teal)] font-semibold flex items-center gap-1">
                              <Stethoscope size={12} /> {item.doctorName}
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-[var(--muted)] bg-[var(--surface-sunken)] px-2 py-0.5 rounded-md border border-[var(--line)]">
                            {item.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Advance Action Button */}
                    <div className="shrink-0 flex items-center justify-end w-full sm:w-auto">
                      {canAdvance && actionData ? (
                        <button
                          type="button"
                          onClick={() => advance(item.id, status)}
                          className={cn(
                            'flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer active:scale-95',
                            actionData.variant === 'emerald'
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : actionData.variant === 'amber'
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-[var(--teal)] hover:bg-[var(--teal-dark)]'
                          )}
                        >
                          <actionData.icon size={15} />
                          <span>{actionData.label}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--muted)] flex items-center gap-1">
                          <Check size={14} className="text-emerald-600" /> Done
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner / Lookup Modal */}
      {showQRModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowQRModal(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[var(--line)] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-[var(--mint)] text-[var(--teal)] flex items-center justify-center shrink-0">
                  <QrCode size={20} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--ink)]">Scan Patient QR Ticket</h3>
                  <p className="text-xs text-[var(--muted)]">Enter or scan ticket token / Medical Passport</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-[var(--muted)] hover:bg-[var(--surface-sunken)] active:scale-95 transition-all"
                aria-label="Close scanner"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-[var(--muted)]">
                QR Ticket Token or Passport ID
              </label>
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="e.g. SC-PASSPORT-8924 or P-101"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm font-mono focus:outline-none focus:border-[var(--teal)]"
              />

              <div className="text-[11px] text-[var(--muted)] flex items-center gap-1.5 flex-wrap">
                <span>Demo shortcuts:</span>
                {queue.slice(0, 3).map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setQrInput(q.id)}
                    className="font-mono bg-[var(--surface-sunken)] hover:bg-[var(--mint)] px-2 py-0.5 rounded text-[var(--teal)] transition-colors min-h-[32px]"
                  >
                    {q.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--line)] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-[var(--muted)] hover:bg-[var(--surface-sunken)] active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLookupQr}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold bg-[var(--teal)] text-white hover:bg-[var(--teal-dark)] active:scale-95 transition-all shadow-xs"
              >
                Lookup Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
