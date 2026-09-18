'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQueue, useSession, useAppStore } from '@/lib/store/app-store';
import { DemoDB } from '@/lib/db/demo-db';
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
  Activity,
  Pill,
  Bed,
  Stethoscope,
  ShieldAlert,
  ShieldCheck,
  Building2,
  BarChart3,
  Network,
  Flame,
  CheckCircle2,
  RefreshCw,
  Heart,
  Siren,
} from 'lucide-react';
import type { DistrictSupplyAggregate, HospitalSupplyProfile } from '@smartcare/types';

type AnalyticsTab = 'queue' | 'supply' | 'facilities' | 'federated';

export function AnalyticsDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuthGuard(['doctor', 'staff']);
  const { queue, metrics } = useQueue();
  const { hospital, city } = useSession();
  const { showToast } = useAppStore();

  const initialRange = (searchParams.get('range') as 'today' | 'week' | 'month') || 'today';
  const initialTab = (searchParams.get('analyticsTab') as AnalyticsTab) || 'queue';

  const [selectedRange, setSelectedRange] = useState<'today' | 'week' | 'month'>(
    ['today', 'week', 'month'].includes(initialRange) ? initialRange : 'today'
  );
  const [activeTab, setActiveTab] = useState<AnalyticsTab>(
    ['queue', 'supply', 'facilities', 'federated'].includes(initialTab) ? initialTab : 'queue'
  );

  // PHC & Supply Chain data
  const [aggregate, setAggregate] = useState<DistrictSupplyAggregate | null>(null);
  const [facilityProfiles, setFacilityProfiles] = useState<HospitalSupplyProfile[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadSupplyData = useCallback(() => {
    const agg = DemoDB.getDistrictSupplyAggregate('Hyderabad & Rangareddy Central');
    setAggregate(agg);
    setFacilityProfiles(DemoDB.getAllSupplyProfiles());
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    loadSupplyData();
    const handler = () => loadSupplyData();
    window.addEventListener('smartcare:supply-updated', handler);
    window.addEventListener('smartcare:telemetry-15m-sync', handler);
    return () => {
      window.removeEventListener('smartcare:supply-updated', handler);
      window.removeEventListener('smartcare:telemetry-15m-sync', handler);
    };
  }, [loadSupplyData]);

  const handleTabChange = (tab: AnalyticsTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('analyticsTab', tab);
    router.replace(`/dashboard/analytics?${params.toString()}`, { scroll: false });
  };

  const handleRangeChange = (range: 'today' | 'week' | 'month') => {
    setSelectedRange(range);
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', range);
    router.replace(`/dashboard/analytics?${params.toString()}`, { scroll: false });
  };

  if (!role) return null;

  // Queue metrics by range
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
    week: { label: '7-day sample', period: 'Last 7 days', waiting: 42, avgWait: '18m', priority: 8, revenue: '₹5,250', sample: true },
    month: { label: 'Monthly sample', period: 'Last 30 days', waiting: 168, avgWait: '22m', priority: 29, revenue: '₹21,000', sample: true },
  }[selectedRange];

  const triageCounts = { Red: 0, Yellow: 0, Green: 0, Unassessed: 0 };
  queue.forEach((item) => { triageCounts[item.triage] = (triageCounts[item.triage] || 0) + 1; });

  const statusCounts = { waiting: 0, called: 0, in_progress: 0 };
  queue.forEach((item) => {
    const s = item.status as keyof typeof statusCounts;
    if (s in statusCounts) statusCounts[s]++;
  });

  // Supply chain aggregates
  const totalMeds = facilityProfiles.reduce((sum, fp) => sum + fp.medicines.length, 0);
  const criticalMeds = facilityProfiles.reduce((sum, fp) => sum + fp.medicines.filter((m) => m.status === 'critical').length, 0);
  const lowMeds = facilityProfiles.reduce((sum, fp) => sum + fp.medicines.filter((m) => m.status === 'low').length, 0);
  const safeMeds = totalMeds - criticalMeds - lowMeds;
  const avgDaysStock = facilityProfiles.length
    ? Math.round(
        facilityProfiles.reduce((sum, fp) => {
          const avg = fp.medicines.reduce((s, m) => s + Math.min(m.daysRemaining, 90), 0) / (fp.medicines.length || 1);
          return sum + avg;
        }, 0) / facilityProfiles.length
      )
    : 0;

  const totalBeds = facilityProfiles.reduce((sum, fp) => sum + (fp.bedsTotal || (fp.bedBreakdown ? fp.bedBreakdown.generalTotal + fp.bedBreakdown.icuTotal + fp.bedBreakdown.oxygenTotal + fp.bedBreakdown.pediatricTotal + fp.bedBreakdown.traumaTotal : 0)), 0);
  const occupiedBeds = facilityProfiles.reduce((sum, fp) => sum + (fp.bedsOccupied || (fp.bedBreakdown ? fp.bedBreakdown.generalOccupied + fp.bedBreakdown.icuOccupied + fp.bedBreakdown.oxygenOccupied + fp.bedBreakdown.pediatricOccupied + fp.bedBreakdown.traumaOccupied : 0)), 0);
  const icuBeds = facilityProfiles.reduce((sum, fp) => sum + (fp.icuTotal || fp.bedBreakdown?.icuTotal || 0), 0);
  const icuOccupied = facilityProfiles.reduce((sum, fp) => sum + (fp.icuOccupied || fp.bedBreakdown?.icuOccupied || 0), 0);
  const totalDoctors = facilityProfiles.reduce((sum, fp) => sum + (fp.attendance?.doctorsOnDuty || 0), 0);
  const totalNurses = facilityProfiles.reduce((sum, fp) => sum + (fp.attendance?.nursesOnDuty || 0), 0);
  const todayFootfall = facilityProfiles.reduce((sum, fp) => sum + (fp.footfall?.todayFootfall || 0), 0);



  // CSV Export
  const handleExportCsv = () => {
    const csvCell = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['SmartCare Analytics Report — Hyderabad & Rangareddy Central'],
      ['Generated At', new Date().toISOString()],
      ['Range', sampleData.label],
      [],
      ['QUEUE ANALYTICS'],
      ['Active Visits', sampleData.waiting, 'Avg Wait', sampleData.avgWait, 'Priority', sampleData.priority, 'Revenue', sampleData.revenue],
      [],
      ['SUPPLY CHAIN'],
      ['Total Medicines Tracked', totalMeds, 'Critical', criticalMeds, 'Low Stock', lowMeds, 'Safe', safeMeds],
      ['Avg Days of Stock Remaining', avgDaysStock],
      [],
      ['FACILITY TELEMETRY'],
      ['Total Beds', totalBeds, 'Occupied', occupiedBeds, 'ICU Beds', icuBeds, 'ICU Occupied', icuOccupied],
      ['Doctors on Duty', totalDoctors, 'Nurses on Duty', totalNurses, 'Today Footfall', todayFootfall],
      [],
      ['QUEUE DETAIL'],
      ['Queue ID', 'Patient Name', 'Age', 'Triage', 'Status', 'Doctor', 'Fee (INR)'],
    ];
    queue.forEach((p) => {
      rows.push([p.id, p.name, p.age ? String(p.age) : '—', p.triage || 'Unassessed', p.status || 'waiting', p.doctorName || 'General care', '125']);
    });
    const csvContent = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartCare_Analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('District analytics report exported', 'success');
  };

  const TABS = [
    { id: 'queue' as const, label: 'Queue & Revenue', Icon: Users },
    { id: 'supply' as const, label: 'Supply Chain', Icon: Pill },
    { id: 'facilities' as const, label: 'PHC Telemetry', Icon: Building2 },
    { id: 'federated' as const, label: 'AI Health Mesh', Icon: Network },
  ];

  return (
    <WorkspaceShell title="Analytics" subtitle={hospital}>
      <div className="max-w-6xl mx-auto py-6 space-y-6" data-section="analytics-dashboard">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="provider-header flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#0a3b69] pb-3 mb-5">
          <div>
            <div className="eyebrow eyebrow-dark mb-1">
              <span className="eyebrow-dot" />
              District Health Analytics — Hyderabad &amp; Rangareddy Central
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a3b69]">
              AushadhiNet Live Dashboard
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {hospital || 'SmartCare Community Hospital'} · Real-time supply chain, telemetry &amp; queue intelligence
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-[var(--text-muted)]">
            <span className="flex items-center sm:justify-end gap-1 font-semibold text-[var(--text)]">
              <RefreshCw size={12} className="text-emerald-600" />
              Last sync: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[var(--text-dim)]">{sampleData.period}</span>
          </div>
        </header>

        {/* ── System-Wide KPI Banner ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            {
              label: 'Critical Stock Alerts',
              value: criticalMeds,
              sub: `${lowMeds} low-stock items`,
              color: criticalMeds > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600',
              Icon: ShieldAlert,
              bg: criticalMeds > 0 ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900',
            },
            {
              label: 'Bed Occupancy Rate',
              value: totalBeds ? `${Math.round((occupiedBeds / totalBeds) * 100)}%` : '—',
              sub: `${occupiedBeds}/${totalBeds} beds occupied`,
              color: 'text-indigo-600 dark:text-indigo-400',
              Icon: Bed,
              bg: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900',
            },
            {
              label: "Today's OPD Footfall",
              value: todayFootfall.toLocaleString('en-IN'),
              sub: `${totalDoctors} doctors on duty`,
              color: 'text-teal-600 dark:text-teal-400',
              Icon: Heart,
              bg: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900',
            },
            {
              label: 'Avg Stock Runway',
              value: `${avgDaysStock}d`,
              sub: `Across ${facilityProfiles.length} PHC nodes`,
              color: avgDaysStock < 14 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
              Icon: Activity,
              bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900',
            },
          ].map(({ label, value, sub, color, Icon, bg }) => (
            <div key={label} className={cn('rounded-2xl border p-4 flex flex-col gap-1.5', bg)}>
              <div className="flex items-center gap-1.5">
                <Icon size={14} className={color} />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{label}</span>
              </div>
              <strong className={cn('text-2xl font-extrabold', color)}>{value}</strong>
              <small className="text-[11px] text-slate-500">{sub}</small>
            </div>
          ))}
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto" role="tablist">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => handleTabChange(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px]',
                  activeTab === id
                    ? 'bg-white dark:bg-slate-900 text-[#0a3b69] dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[40px]"
            >
              <Download size={13} /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[40px]"
            >
              <Printer size={13} /> Print
            </button>
          </div>
        </div>

        {/* ── TAB: QUEUE & REVENUE ─────────────────────────────────────────── */}
        {activeTab === 'queue' && (
          <div className="space-y-5">
            {/* Range selector */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-fit" role="tablist">
              {(['today', 'week', 'month'] as const).map((r) => {
                const icons = { today: Clock, week: CalendarDays, month: CalendarRange };
                const labels = { today: 'Current', week: '7-day', month: 'Monthly' };
                const Icon = icons[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRangeChange(r)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px]',
                      selectedRange === r
                        ? 'bg-[var(--teal)] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                    )}
                  >
                    <Icon size={12} /> {labels[r]}
                  </button>
                );
              })}
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                { label: sampleData.sample ? 'Sample patient volume' : 'Active visits', value: sampleData.waiting, color: 'text-[var(--teal)]', sub: sampleData.sample ? 'Illustrative' : 'Current queue' },
                { label: 'Average Wait Time', value: sampleData.avgWait, color: 'text-[var(--teal)]', sub: 'Time since queue arrival' },
                { label: 'Priority Triage', value: sampleData.priority, color: 'text-amber-600 dark:text-amber-400', sub: 'Requires immediate attention' },
                { label: 'Estimated Revenue', value: sampleData.revenue, color: 'text-emerald-600 dark:text-emerald-400', sub: '₹125 per outpatient' },
              ].map(({ label, value, color, sub }) => (
                <div key={label} className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex flex-col justify-between">
                  <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
                  <strong className={cn('text-2xl font-extrabold mt-1', color)}>{value}</strong>
                  <small className="text-[0.7rem] text-[var(--text-dim)]">{sub}</small>
                </div>
              ))}
            </div>

            {/* Triage distribution */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <BarChart3 size={15} className="text-[var(--teal)]" /> Triage Priority Distribution
              </h2>
              <div className="flex flex-col gap-3">
                {(['Red', 'Yellow', 'Green', 'Unassessed'] as const).map((level) => {
                  const count = triageCounts[level];
                  const total = queue.length || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <span className={cn('status-pill shrink-0 text-xs w-24 text-center', getTriageColor(level))}>{level}</span>
                      <div className="flex-1 bg-[var(--surface-sunken)] rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-2.5 rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: level === 'Red' ? '#dc2626' : level === 'Yellow' ? '#d97706' : level === 'Green' ? '#16a34a' : '#64748b',
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
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <Activity size={15} className="text-[var(--teal)]" /> Visit Status Breakdown
              </h2>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  ['Waiting', statusCounts.waiting, 'var(--teal)'],
                  ['Called', statusCounts.called, '#d97706'],
                  ['In Progress', statusCounts.in_progress, '#16a34a'],
                ].map(([label, count, color]) => (
                  <div key={label as string} className="text-center p-4 bg-[var(--surface-sunken)] border border-[var(--line)] rounded-xl">
                    <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: color as string }}>{count as number}</p>
                    <p className="text-[0.65rem] font-semibold text-[var(--text-muted)] mt-1 uppercase tracking-wider">{label as string}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: SUPPLY CHAIN ───────────────────────────────────────────── */}
        {activeTab === 'supply' && (
          <div className="space-y-5">
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'Total Medicines', value: totalMeds, color: 'text-slate-700 dark:text-slate-200', Icon: Pill },
                { label: 'Critical Stock', value: criticalMeds, color: 'text-red-600 dark:text-red-400', Icon: ShieldAlert },
                { label: 'Low Stock', value: lowMeds, color: 'text-amber-600 dark:text-amber-400', Icon: AlertTriangle },
                { label: 'Safe Stock', value: safeMeds, color: 'text-emerald-600 dark:text-emerald-400', Icon: ShieldCheck },
              ].map(({ label, value, color, Icon }) => (
                <div key={label} className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={13} className={color} />
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold">{label}</span>
                  </div>
                  <strong className={cn('text-2xl font-extrabold', color)}>{value}</strong>
                </div>
              ))}
            </div>

            {/* Per-facility supply health */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <Building2 size={15} className="text-indigo-600" /> Facility-Level Medicine Stock Health
              </h2>
              {facilityProfiles.map((fp) => {
                const crit = fp.medicines.filter((m) => m.status === 'critical').length;
                const low = fp.medicines.filter((m) => m.status === 'low').length;
                const safe = fp.medicines.length - crit - low;
                const healthPct = Math.round((safe / (fp.medicines.length || 1)) * 100);
                return (
                  <div key={fp.hospitalId} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{fp.hospitalName}</p>
                        <p className="text-[11px] text-slate-500">{fp.district} &bull; {fp.medicines.length} items tracked</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {crit > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 text-[11px] font-bold">{crit} critical</span>
                        )}
                        {low > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-[11px] font-bold">{low} low</span>
                        )}
                        {crit === 0 && low === 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-[11px] font-bold">
                            <CheckCircle2 size={10} /> All clear
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${healthPct}%`,
                            background: healthPct > 70 ? '#16a34a' : healthPct > 40 ? '#d97706' : '#dc2626',
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 shrink-0">{healthPct}% healthy</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stock category breakdown */}
            {aggregate && (
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                  <BarChart3 size={15} className="text-indigo-600" /> District Medicine Category Overview
                </h2>
                <div className="space-y-2.5">
                  {aggregate.medicineSummaries?.map((cat) => {
                    const maxVal = aggregate.medicineSummaries ? Math.max(...aggregate.medicineSummaries.map((c) => c.totalStock)) : 1;
                    const pct = Math.round((cat.totalStock / (maxVal || 1)) * 100);
                    return (
                      <div key={cat.medicineName} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-48 truncate shrink-0">{cat.medicineName}</span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 bg-indigo-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 w-20 text-right shrink-0">
                          {cat.totalStock.toLocaleString('en-IN')}
                        </span>
                        {cat.hospitalsInShortage > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 shrink-0">
                            {cat.hospitalsInShortage} critical
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: PHC TELEMETRY ──────────────────────────────────────────── */}
        {activeTab === 'facilities' && (
          <div className="space-y-5">
            {/* District bed & staff summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'Total Beds', value: totalBeds, sub: `${occupiedBeds} occupied`, color: 'text-indigo-600 dark:text-indigo-400', Icon: Bed },
                { label: 'ICU Beds', value: icuBeds, sub: `${icuOccupied} occupied`, color: icuOccupied >= icuBeds ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400', Icon: Siren },
                { label: 'Doctors on Duty', value: totalDoctors, sub: `${totalNurses} nurses`, color: 'text-teal-600 dark:text-teal-400', Icon: Stethoscope },
                { label: "Today's OPD", value: todayFootfall.toLocaleString('en-IN'), sub: 'Patients served today', color: 'text-violet-600 dark:text-violet-400', Icon: TrendingUp },
              ].map(({ label, value, sub, color, Icon }) => (
                <div key={label} className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={13} className={color} />
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold">{label}</span>
                  </div>
                  <strong className={cn('text-2xl font-extrabold', color)}>{value}</strong>
                  <small className="text-[11px] text-[var(--text-dim)]">{sub}</small>
                </div>
              ))}
            </div>

            {/* Per-facility telemetry grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {facilityProfiles.map((fp) => {
                const bedTotal = fp.bedsTotal || (fp.bedBreakdown ? fp.bedBreakdown.generalTotal + fp.bedBreakdown.icuTotal + fp.bedBreakdown.oxygenTotal + fp.bedBreakdown.pediatricTotal + fp.bedBreakdown.traumaTotal : 0);
                const bedOccupied = fp.bedsOccupied || (fp.bedBreakdown ? fp.bedBreakdown.generalOccupied + fp.bedBreakdown.icuOccupied + fp.bedBreakdown.oxygenOccupied + fp.bedBreakdown.pediatricOccupied + fp.bedBreakdown.traumaOccupied : 0);
                const bedOccupancy = bedTotal ? Math.round((bedOccupied / bedTotal) * 100) : 0;
                const attPct = fp.attendance?.attendancePercent || 0;
                const isUnderstaffed = attPct < 70;
                return (
                  <div key={fp.hospitalId} className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{fp.hospitalName}</p>
                        <p className="text-[11px] text-slate-500">{fp.district}</p>
                      </div>
                      {isUnderstaffed && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 text-[10px] font-bold shrink-0">
                          <AlertTriangle size={9} /> Understaffed
                        </span>
                      )}
                    </div>

                    {fp.bedBreakdown && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1"><Bed size={10} /> Bed Occupancy</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {bedOccupied}/{bedTotal} ({bedOccupancy}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${bedOccupancy}%`,
                              background: bedOccupancy > 85 ? '#dc2626' : bedOccupancy > 60 ? '#d97706' : '#16a34a',
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          {[
                            { label: 'ICU', val: `${fp.bedBreakdown.icuOccupied}/${fp.bedBreakdown.icuTotal}` },
                            { label: 'O2 Beds', val: `${fp.bedBreakdown.oxygenOccupied}/${fp.bedBreakdown.oxygenTotal}` },
                            { label: 'Pediatric', val: `${fp.bedBreakdown.pediatricOccupied}/${fp.bedBreakdown.pediatricTotal}` },
                          ].map(({ label, val }) => (
                            <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1.5">
                              <p className="text-[10px] text-slate-500">{label}</p>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{val}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {fp.attendance && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <Stethoscope size={11} className="text-teal-600 shrink-0" />
                        <span className="text-slate-500">
                          {fp.attendance.doctorsOnDuty}D · {fp.attendance.nursesOnDuty}N · {fp.attendance.pharmacistsOnDuty}Ph
                        </span>
                        <span className="ml-auto font-bold text-teal-700 dark:text-teal-400">{attPct}% att.</span>
                      </div>
                    )}

                    {fp.footfall && (
                      <div className="flex items-center gap-2 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                        <TrendingUp size={11} className="text-violet-600 shrink-0" />
                        <span className="text-slate-500">OPD Today: <strong className="text-slate-700 dark:text-slate-300">{fp.footfall.todayFootfall}</strong></span>
                        <span className="ml-auto text-slate-500">Rate: <strong className="text-slate-700 dark:text-slate-300">{fp.footfall.hourlyInfluxRate}/hr</strong></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB: FEDERATED AI MESH ──────────────────────────────────────── */}
        {activeTab === 'federated' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl border border-slate-800 p-5 text-white space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                    <Network size={10} /> MoHFW Federated Learning Analytics
                  </span>
                  <h2 className="text-lg font-extrabold text-white">Multi-State Health AI Convergence Status</h2>
                  <p className="text-[12px] text-slate-400 mt-0.5">Privacy-preserving gradient aggregation across 5 state health directorates (DPDP Act 2023 compliant)</p>
                </div>
                <ShieldCheck size={28} className="text-emerald-400 shrink-0 mt-1" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { state: 'Telangana (HQ)', city: 'Hyderabad', pct: 98.7, color: '#34d399', status: 'Active' },
                  { state: 'Maharashtra', city: 'Mumbai / Pune', pct: 94.2, color: '#60a5fa', status: 'Active' },
                  { state: 'Karnataka', city: 'Bengaluru', pct: 91.8, color: '#a78bfa', status: 'Active' },
                  { state: 'Uttar Pradesh', city: 'Lucknow', pct: 87.3, color: '#fbbf24', status: 'Syncing' },
                  { state: 'Tamil Nadu', city: 'Chennai', pct: 89.6, color: '#f87171', status: 'Active' },
                ].map(({ state, city: stateCity, pct, color, status }) => (
                  <div key={state} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{state}</p>
                        <p className="text-[11px] text-slate-400">{stateCity}</p>
                      </div>
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300 animate-pulse'
                      )}>
                        {status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Model convergence</span>
                        <strong style={{ color }}>{pct}%</strong>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                {[
                  { label: 'FedAvg Rounds', value: '14', sub: 'This session' },
                  { label: 'Global Accuracy', value: '93.1%', sub: 'Demand forecast model' },
                  { label: 'PII Records Shared', value: '0', sub: 'Privacy preserved' },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="bg-slate-800/40 border border-slate-700 rounded-xl p-3 text-center">
                    <p className="text-lg sm:text-xl font-extrabold text-white">{value}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{label}</p>
                    <p className="text-[10px] text-slate-500">{sub}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-3 text-emerald-300 text-[12px]">
                <ShieldCheck size={15} className="shrink-0" />
                <span><strong>ABDM / DPDP Act 2023 Compliant:</strong> Only gradient deltas (ΔW) exchanged. No patient records leave their state boundary. Encryption: TLS 1.3 + Differential Privacy ε=0.1.</span>
              </div>
            </div>

            {/* AI model performance */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <Flame size={15} className="text-indigo-600" /> Federated Demand Forecast Model — National Performance Metrics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'Dengue Prediction Accuracy', value: '97.2%', color: 'text-emerald-600' },
                  { label: 'Stockout Prediction Precision', value: '94.8%', color: 'text-emerald-600' },
                  { label: 'False Alarm Rate', value: '2.1%', color: 'text-amber-600' },
                  { label: 'Avg Prediction Horizon', value: '21 days', color: 'text-indigo-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800">
                    <p className={cn('text-xl font-extrabold', color)}>{value}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
