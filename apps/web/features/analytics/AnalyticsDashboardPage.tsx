'use client';

import { useState } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQueue, useSession, useAppStore } from '@/lib/store/app-store';
import { WorkspaceShell } from '@/components/layout/Shell';
import { cn, getTriageColor } from '@/lib/utils';
import {
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  Download,
  Printer,
  CalendarDays,
  CalendarRange,
} from 'lucide-react';

export function AnalyticsDashboardPage() {
  const { role } = useAuthGuard(['doctor', 'staff']);
  const { queue, metrics } = useQueue();
  const { hospital, city } = useSession();
  const { showToast } = useAppStore();

  const [selectedRange, setSelectedRange] = useState<'today' | 'week' | 'month'>('today');

  if (!role) return null;

  const sampleData = {
    today: {
      label: 'Current queue',
      period: 'Live snapshot',
      waiting: metrics.waiting,
      avgWait: `${metrics.averageWait}m`,
      priority: metrics.priority,
      revenue: `₹${metrics.revenue}`,
      sample: false,
    },
    week: {
      label: '7-day sample',
      period: 'Last 7 days',
      waiting: 42,
      avgWait: '18m',
      priority: 8,
      revenue: '₹5,250',
      sample: true,
    },
    month: {
      label: 'Monthly sample',
      period: 'Last 30 days',
      waiting: 168,
      avgWait: '22m',
      priority: 29,
      revenue: '₹21,000',
      sample: true,
    },
  }[selectedRange];

  const triageCounts = { Red: 0, Yellow: 0, Green: 0, Unassessed: 0 };
  queue.forEach((item) => {
    triageCounts[item.triage] = (triageCounts[item.triage] || 0) + 1;
  });

  const statusCounts = { waiting: 0, called: 0, in_progress: 0 };
  queue.forEach((item) => {
    const s = item.status as keyof typeof statusCounts;
    if (s in statusCounts) statusCounts[s]++;
  });

  // CSV Export
  const handleExportCsv = () => {
    const csvCell = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['SmartCare Queue Analytics Report'],
      ['Care Centre', hospital || 'SmartCare Community Hospital'],
      ['Location', city || 'Hyderabad'],
      ['Range', sampleData.label],
      ['Generated At', new Date().toISOString()],
      [],
      ['Queue ID', 'Patient Name', 'Age', 'Gender', 'Symptoms', 'Triage', 'Doctor', 'Status', 'Fee (INR)', 'Created At'],
    ];

    if (queue.length > 0) {
      queue.forEach((p) => {
        rows.push([
          p.id,
          p.name,
          p.age ? String(p.age) : '—',
          p.gender || '—',
          p.symptoms || 'General consultation',
          p.triage || 'Unassessed',
          p.doctorName || 'General care',
          p.status || 'waiting',
          '125',
          p.created_at || new Date().toISOString(),
        ]);
      });
    } else {
      rows.push(['No active queue entries']);
    }

    const csvContent = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartCare_Queue_Report_${selectedRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${sampleData.label} CSV report`, 'success');
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <WorkspaceShell title="Analytics" subtitle={hospital}>
      <div className="max-w-5xl mx-auto py-6 space-y-6" data-section="analytics-dashboard">
        {/* Provider Header */}
        <header className="provider-header flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#0a3b69] pb-3 mb-5">
          <div>
            <div className="eyebrow eyebrow-dark mb-1">
              <span className="eyebrow-dot" />
              Performance analytics
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a3b69]">
              See where care slows down.
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {hospital || 'SmartCare Community Hospital'} · {sampleData.sample ? 'Clearly labeled demo sample' : 'Current active queue snapshot'}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-[var(--text-muted)]">
            <span className="flex items-center sm:justify-end gap-1 font-semibold text-[var(--text)]">
              <CalendarDays size={13} /> {sampleData.period}
            </span>
            <span className="text-[var(--text-dim)]">Refreshes with the queue</span>
          </div>
        </header>

        {/* Toolbar with range tabs and export actions */}
        <div className="analytics-toolbar print-hide flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-[#f8fafc] border border-[var(--line)] rounded-2xl">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[var(--line)] rounded-xl w-full sm:w-auto" role="tablist">
            {(['today', 'week', 'month'] as const).map((r) => {
              const labels = { today: 'Current', week: '7-day', month: 'Monthly' };
              const icons = { today: Clock, week: CalendarDays, month: CalendarRange };
              const Icon = icons[r];
              return (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={selectedRange === r}
                  onClick={() => setSelectedRange(r)}
                  className={cn(
                    'flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95',
                    selectedRange === r
                      ? 'bg-[#0a3b69] text-white shadow-xs'
                      : 'text-[var(--text-muted)] hover:bg-[#f0f7fc] hover:text-[#0a3b69]'
                  )}
                >
                  <Icon size={13} />
                  <span>{labels[r]}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn-secondary flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 rounded-xl text-xs font-bold text-[#0a3b69] border border-[#cbd5e1] bg-white hover:bg-[#f0f7fc] active:scale-95 transition-all"
            >
              <Download size={14} /> <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrintReport}
              className="btn-secondary flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 rounded-xl text-xs font-bold text-[#0a3b69] border border-[#cbd5e1] bg-white hover:bg-[#f0f7fc] active:scale-95 transition-all"
            >
              <Printer size={14} /> <span>Print</span>
            </button>
          </div>
        </div>

        {/* Summary stats matching provider-stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-col justify-between">
            <span className="text-xs text-[var(--text-muted)] font-medium">
              {sampleData.sample ? 'Sample patient volume' : 'Active visits'}
            </span>
            <strong className="text-2xl font-extrabold text-[#0a3b69] mt-1">{sampleData.waiting}</strong>
            <small className="text-[0.7rem] text-[var(--text-dim)]">
              {sampleData.sample ? 'Illustrative, not stored history' : 'Current queue entries'}
            </small>
          </div>
          <div className="p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-col justify-between">
            <span className="text-xs text-[var(--text-muted)] font-medium">Average Wait Time</span>
            <strong className="text-2xl font-extrabold text-[#0a3b69] mt-1">{sampleData.avgWait}</strong>
            <small className="text-[0.7rem] text-[var(--text-dim)]">
              {sampleData.sample ? 'Illustrative duration' : 'Time since queue arrival'}
            </small>
          </div>
          <div className="p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-col justify-between">
            <span className="text-xs text-[var(--text-muted)] font-medium">Priority Triage</span>
            <strong className="text-2xl font-extrabold text-[#0a3b69] mt-1">{sampleData.priority}</strong>
            <small className="text-[0.7rem] text-[var(--text-dim)]">Requires immediate attention</small>
          </div>
          <div className="p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] flex flex-col justify-between">
            <span className="text-xs text-[var(--text-muted)] font-medium">Estimated Care Revenue</span>
            <strong className="text-2xl font-extrabold text-green-700 mt-1">{sampleData.revenue}</strong>
            <small className="text-[0.7rem] text-[var(--text-dim)]">₹125 per outpatient ticket</small>
          </div>
        </div>

        {/* Triage distribution */}
        <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#0a3b69] mb-4">Triage Priority Distribution</h2>
          <div className="flex flex-col gap-3">
            {(['Red', 'Yellow', 'Green', 'Unassessed'] as const).map((level) => {
              const count = triageCounts[level];
              const total = queue.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={level} className="flex items-center gap-3">
                  <span className={cn('status-pill shrink-0 text-xs w-24 text-center', getTriageColor(level))}>{level}</span>
                  <div className="flex-1 bg-[#f0f4f8] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background:
                          level === 'Red'
                            ? '#dc2626'
                            : level === 'Yellow'
                            ? '#d97706'
                            : level === 'Green'
                            ? '#16a34a'
                            : '#64748b',
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[var(--text)] w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#0a3b69] mb-4">Patient Visit Status Breakdown</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Waiting', statusCounts.waiting, '#0a3b69'],
              ['Called', statusCounts.called, '#d97706'],
              ['In progress', statusCounts.in_progress, '#16a34a'],
            ].map(([label, count, color]) => (
              <div key={label as string} className="text-center p-4 bg-[#f8fafc] border border-[var(--line)] rounded-xl">
                <p className="text-3xl font-extrabold" style={{ color: color as string }}>
                  {count as number}
                </p>
                <p className="text-xs font-semibold text-[var(--text-muted)] mt-1 uppercase tracking-wider">{label as string}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
