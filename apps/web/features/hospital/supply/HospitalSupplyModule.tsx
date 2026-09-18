'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DemoDB } from '@/lib/db/demo-db';
import { useSession, useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import {
  Pill,
  AlertTriangle,
  Flame,
  Truck,
  ArrowRight,
  RefreshCw,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Building2,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send,
  Bed,
  Box,
  KeyRound,
  Users,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import type {
  HospitalSupplyProfile,
  MedicineItem,
  RedistributionOrder,
  ShortageReport,
  MedicineStockStatus,
} from '@smartcare/types';

export function HospitalSupplyModule() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hospital: sessionHospital, city } = useSession();
  const { showToast } = useAppStore();

  // Selected hospital facility (allows user to test both SmartCare Tertiary and PHC Shamshabad)
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('hosp-smartcare');
  const [profiles, setProfiles] = useState<HospitalSupplyProfile[]>([]);
  const [profile, setProfile] = useState<HospitalSupplyProfile | null>(null);

  // Tab state synced with URL: ?supplyTab=inventory | shortage | inward
  const activeTab = searchParams.get('supplyTab') || 'inventory';

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Stock Edit Modal State
  const [editingMedicine, setEditingMedicine] = useState<MedicineItem | null>(null);
  const [editStockCount, setEditStockCount] = useState<number>(0);
  const [editDailyRate, setEditDailyRate] = useState<number>(0);
  const [editShortageReason, setEditShortageReason] = useState<string>('');
  const [flagAsEmergency, setFlagAsEmergency] = useState<boolean>(false);

  // Inward Transfer OTP State
  const [inwardOrders, setInwardOrders] = useState<RedistributionOrder[]>([]);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [verifyingOrder, setVerifyingOrder] = useState<string | null>(null);

  // Load facilities & current profile
  const refreshData = useCallback(() => {
    const all = DemoDB.getAllSupplyProfiles();
    setProfiles(all);

    // If sessionHospital matches a profile, default to it
    const active =
      all.find((p) => p.hospitalId === selectedFacilityId) ||
      all.find((p) => p.hospitalName.toLowerCase().includes((sessionHospital || '').toLowerCase())) ||
      all[0];

    if (active) {
      setProfile(active);
      setSelectedFacilityId(active.hospitalId);
    }

    // Load inbound transfers for this hospital
    const allOrders = DemoDB.getRedistributionOrders();
    const inbound = allOrders.filter((o) => o.targetHospitalId === active?.hospitalId);
    setInwardOrders(inbound);
  }, [selectedFacilityId, sessionHospital]);

  useEffect(() => {
    refreshData();

    const handleUpdate = () => refreshData();
    window.addEventListener('smartcare:supply-updated', handleUpdate);
    window.addEventListener('smartcare:rebalance-updated', handleUpdate);
    window.addEventListener('smartcare:rebalance-delivered', handleUpdate);
    window.addEventListener('smartcare:shortage-reported', handleUpdate);

    return () => {
      window.removeEventListener('smartcare:supply-updated', handleUpdate);
      window.removeEventListener('smartcare:rebalance-updated', handleUpdate);
      window.removeEventListener('smartcare:rebalance-delivered', handleUpdate);
      window.removeEventListener('smartcare:shortage-reported', handleUpdate);
    };
  }, [refreshData]);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('supplyTab', tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleFacilityChange = (facilityId: string) => {
    setSelectedFacilityId(facilityId);
    const target = profiles.find((p) => p.hospitalId === facilityId);
    if (target) {
      setProfile(target);
      const inbound = DemoDB.getRedistributionOrders().filter((o) => o.targetHospitalId === target.hospitalId);
      setInwardOrders(inbound);
      showToast(`Switched view to ${target.hospitalName}`, 'info');
    }
  };

  const openStockModal = (med: MedicineItem) => {
    setEditingMedicine(med);
    setEditStockCount(med.currentStock);
    setEditDailyRate(med.dailyConsumption);
    setEditShortageReason(med.shortageReason || '');
    setFlagAsEmergency(med.status === 'critical' || !!med.activeShortage);
  };

  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !editingMedicine) return;

    DemoDB.updateMedicineStock(
      profile.hospitalId,
      editingMedicine.id,
      Number(editStockCount),
      Number(editDailyRate),
      flagAsEmergency ? editShortageReason || 'Critical stock deficit reported by hospital pharmacist' : undefined,
      flagAsEmergency
    );

    showToast(`Stock updated for ${editingMedicine.name}. Data synced to State Command Center.`, 'success');
    setEditingMedicine(null);
    refreshData();
  };

  const handleVerifyOtp = (order: RedistributionOrder) => {
    const enteredOtp = otpInputs[order.id] || '';
    if (!enteredOtp.trim()) {
      showToast('Please enter the 6-digit delivery verification OTP.', 'error');
      return;
    }

    setVerifyingOrder(order.id);
    setTimeout(() => {
      const res = DemoDB.receiveRedistributionOrder(order.id, enteredOtp);
      setVerifyingOrder(null);
      if (res.success) {
        showToast(res.message, 'success');
        setOtpInputs((prev) => ({ ...prev, [order.id]: '' }));
        refreshData();
      } else {
        showToast(res.message, 'error');
      }
    }, 400);
  };

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    if (!profile) return [];
    return profile.medicines.filter((m) => {
      const matchesCat = categoryFilter === 'ALL' || m.category === categoryFilter;
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [profile, categoryFilter, searchQuery]);

  // Calculations
  const criticalCount = profile?.medicines.filter((m) => m.status === 'critical').length || 0;
  const lowCount = profile?.medicines.filter((m) => m.status === 'low').length || 0;
  const safeAverage = profile
    ? Math.round(
        profile.medicines.reduce((acc, m) => acc + (m.daysRemaining > 90 ? 30 : m.daysRemaining), 0) /
          profile.medicines.length
      )
    : 0;

  if (!profile) {
    return (
      <div className="p-8 text-center text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
        <p>Loading AushadhiNet facility profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Facility Context & Node Switcher ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                AushadhiNet Active Node
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {profile.hospitalId.toUpperCase()}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider font-semibold">
                Tier: {profile.tier.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <Building2 className="h-7 w-7 text-indigo-400 shrink-0" />
              {profile.hospitalName}
            </h1>
            <p className="text-sm text-slate-300">
              {profile.district} District, {profile.state} &bull; Clinical Inventory &amp; SOS Shortage Register
            </p>
          </div>

          {/* Quick Facility Switcher for Demo Testing */}
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-xs text-slate-300 font-medium">Switch Facility Node:</div>
            <select
              value={profile.hospitalId}
              onChange={(e) => handleFacilityChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {profiles
                .filter((p) => p.tier !== 'warehouse')
                .map((p) => (
                  <option key={p.hospitalId} value={p.hospitalId}>
                    {p.hospitalName} ({p.tier.toUpperCase()})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Node Live Capacity Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Pill className="h-3.5 w-3.5 text-indigo-400" />
              Tracked Medicines
            </div>
            <div className="text-xl font-bold text-white mt-1">{profile.medicines.length} SKUs</div>
            <div className="text-[11px] text-slate-400">All registered essentials</div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className={cn('h-3.5 w-3.5', criticalCount > 0 ? 'text-red-400' : 'text-emerald-400')} />
              Critical Shortages
            </div>
            <div className={cn('text-xl font-bold mt-1', criticalCount > 0 ? 'text-red-400' : 'text-emerald-400')}>
              {criticalCount} Item{criticalCount === 1 ? '' : 's'}
            </div>
            <div className="text-[11px] text-slate-400">
              {criticalCount > 0 ? 'Immediate rebalance needed' : 'All safe buffers met'}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Bed className="h-3.5 w-3.5 text-amber-400" />
              Bed / ICU Capacity
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {profile.bedsOccupied} / {profile.bedsTotal}
            </div>
            <div className="text-[11px] text-slate-400">ICU: {profile.icuOccupied} / {profile.icuTotal} occupied</div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              Oxygen Cylinders
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {profile.oxygenCylindersAvailable} / {profile.oxygenCylindersTotal}
            </div>
            <div className="text-[11px] text-slate-400">Ready in medical gas bank</div>
          </div>
        </div>
      </div>

      {/* ─── Emergency Shortage Warning Banner ───────────────────────────────────── */}
      {criticalCount > 0 && (
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4 sm:p-5 text-red-900 dark:text-red-200">
          <div className="flex items-start gap-3">
            <Flame className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1 text-sm">
              <h3 className="font-bold text-base text-red-700 dark:text-red-300">
                Critical Supply Alert: {criticalCount} Item(s) with &le; 3 Days Remaining
              </h3>
              <p className="text-red-800 dark:text-red-200">
                The State Command Center and District CMO have received automated shortage flags for this facility.
                Recommended AI redistribution transfers have been prepared. Check the{' '}
                <button
                  onClick={() => handleTabChange('inward')}
                  className="font-bold underline text-red-700 dark:text-red-300 hover:opacity-80"
                >
                  Inward Dispatches tab ({inwardOrders.length})
                </button>{' '}
                to accept replenishment shipments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Navigation Tabs ────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => handleTabChange('inventory')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap min-h-[44px]',
            activeTab === 'inventory'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Pill className="h-4 w-4" />
          Medicine Stock Register ({profile.medicines.length})
        </button>

        <button
          onClick={() => handleTabChange('shortage')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap min-h-[44px]',
            activeTab === 'shortage'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <ShieldAlert className="h-4 w-4" />
          SOS Shortage Reports {criticalCount > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{criticalCount}</span>}
        </button>

        <button
          onClick={() => handleTabChange('inward')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap min-h-[44px]',
            activeTab === 'inward'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Truck className="h-4 w-4" />
          Inward Dispatches ({inwardOrders.length})
        </button>

        <button
          onClick={() => handleTabChange('resources')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap min-h-[44px]',
            activeTab === 'resources'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Activity className="h-4 w-4" />
          Beds &amp; Personnel Telemetry
        </button>
      </div>

      {/* ─── TAB 1: INVENTORY REGISTER ─────────────────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicine name, batch, category..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[44px]"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'Critical Supplies', 'Antibiotics', 'Chronic Care', 'Emergency & IV', 'Vaccines'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[38px]',
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Medicines Grid / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedicines.map((med) => {
              const isCritical = med.status === 'critical';
              const isLow = med.status === 'low';

              return (
                <div
                  key={med.id}
                  className={cn(
                    'rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between',
                    isCritical
                      ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                      : isLow
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                          {med.category}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug mt-0.5">
                          {med.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          Batch: {med.batchNumber} &bull; Exp: {med.expiryDate}
                        </p>
                      </div>

                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-bold shrink-0',
                          isCritical
                            ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                            : isLow
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        )}
                      >
                        {isCritical ? 'CRITICAL' : isLow ? 'LOW BUFFER' : 'STABLE'}
                      </span>
                    </div>

                    {/* Stock Metrics Card */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700/50">
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Current</div>
                        <div className={cn('text-lg font-bold', isCritical ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white')}>
                          {med.currentStock}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{med.unit}</div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Safe Buffer</div>
                        <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{med.minBuffer}</div>
                        <div className="text-[10px] text-slate-500 truncate">Min Units</div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Runout</div>
                        <div className={cn('text-lg font-bold', isCritical ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400')}>
                          {med.daysRemaining > 90 ? '90+' : `${med.daysRemaining}d`}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{med.dailyConsumption}/day</div>
                      </div>
                    </div>

                    {med.shortageReason && (
                      <div className="text-xs bg-red-100/70 dark:bg-red-950/40 text-red-800 dark:text-red-300 p-2.5 rounded-lg border border-red-200 dark:border-red-900">
                        <span className="font-semibold">Shortage Alert:</span> {med.shortageReason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => openStockModal(med)}
                      className="flex-1 py-2 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center gap-1.5"
                    >
                      Update Stock
                    </button>

                    <button
                      onClick={() => {
                        openStockModal(med);
                        setFlagAsEmergency(true);
                      }}
                      title="Trigger SOS Shortage Alert to State Command"
                      className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <ShieldAlert className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 2: SHORTAGE REPORTING ─────────────────────────────────────────── */}
      {activeTab === 'shortage' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
              <ShieldAlert className="h-6 w-6" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Active Hospital Stock-Outs &amp; SOS Transmissions
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              When stock drops below safe emergency thresholds, reports are sent in real time to the District CMO and State
              Command Center to authorize rapid buffer replenishment.
            </p>

            <div className="space-y-3">
              {profile.medicines
                .filter((m) => m.status === 'critical' || m.activeShortage)
                .map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{m.name}</span>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-red-600 text-white rounded">
                          {m.daysRemaining} DAY{m.daysRemaining === 1 ? '' : 'S'} LEFT
                        </span>
                      </div>
                      <p className="text-xs text-red-800 dark:text-red-300">
                        {m.shortageReason || 'Stock depleted past minimum buffer reserves.'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Current: {m.currentStock} {m.unit} &bull; Safe Buffer: {m.minBuffer} &bull; Burn: {m.dailyConsumption}/day
                      </p>
                    </div>

                    <button
                      onClick={() => openStockModal(m)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors min-h-[44px] shrink-0"
                    >
                      Update / Resolve Alert
                    </button>
                  </div>
                ))}

              {profile.medicines.filter((m) => m.status === 'critical' || m.activeShortage).length === 0 && (
                <div className="text-center py-8 text-slate-500 space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Zero critical stock-outs reported for {profile.hospitalName}.
                  </p>
                  <p className="text-xs text-slate-400">All essential medicines have adequate buffer stock.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: INWARD TRANSFERS WITH OTP ───────────────────────────────────── */}
      {activeTab === 'inward' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <Truck className="h-6 w-6" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Inward Reallocation Dispatches ({inwardOrders.length})
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Inter-facility shipments routed from District Warehouses or surplus tertiary hospitals. When the driver arrives,
              verify the digital OTP to securely acknowledge delivery and automatically restock your inventory.
            </p>

            <div className="space-y-4">
              {inwardOrders.map((order) => {
                const isDelivered = order.status === 'delivered';
                const isInTransit = order.status === 'in_transit';

                return (
                  <div
                    key={order.id}
                    className={cn(
                      'rounded-2xl border p-4 sm:p-5 transition-all space-y-3',
                      isDelivered
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80'
                        : isInTransit
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {order.orderNumber}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 text-[10px] font-bold rounded uppercase',
                              order.priority === 'CRITICAL'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            )}
                          >
                            {order.priority}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 text-[10px] font-bold rounded uppercase',
                              isDelivered
                                ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                : isInTransit
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 animate-pulse'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                            )}
                          >
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                          {order.quantity} {order.unit} &bull; {order.medicineName}
                        </h4>
                      </div>

                      <div className="text-right text-xs text-slate-500">
                        <div>Dispatched from: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.sourceHospitalName}</span></div>
                        <div>Transit: ~{order.routeDistanceKm} km ({order.estimatedTransitMins} mins)</div>
                      </div>
                    </div>

                    {/* Delivery OTP Verification */}
                    {!isDelivered ? (
                      <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-slate-200 dark:border-slate-700">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <KeyRound className="h-3.5 w-3.5 text-indigo-500" />
                            Delivery Handover Verification
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Manifest Code: <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">{order.otpCode}</span> (Match driver&apos;s manifest)
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={otpInputs[order.id] || ''}
                            onChange={(e) => setOtpInputs((prev) => ({ ...prev, [order.id]: e.target.value }))}
                            placeholder="Enter OTP"
                            className="w-28 px-3 py-2 text-center font-mono font-bold tracking-widest text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl min-h-[44px] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                          <button
                            onClick={() => handleVerifyOtp(order)}
                            disabled={verifyingOrder === order.id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors min-h-[44px] flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {verifyingOrder === order.id ? 'Verifying...' : 'Acknowledge Delivery'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        Inward shipment received and credited to local physical inventory.
                      </div>
                    )}
                  </div>
                );
              })}

              {inwardOrders.length === 0 && (
                <div className="text-center py-8 text-slate-500 space-y-2">
                  <Truck className="h-10 w-10 text-slate-400 mx-auto" />
                  <p className="font-semibold">No inward transfer shipments pending for {profile.hospitalName}.</p>
                  <p className="text-xs text-slate-400">Rebalance dispatches from the District Warehouse will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: BEDS & PERSONNEL TELEMETRY DESK ───────────────────────────── */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-2 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  Facility Resource Telemetry &bull; {profile.hospitalName}
                </h3>
                <p className="text-xs text-slate-500">
                  Manage real-time personnel check-ins and live bed allocation. Data automatically feeds into the National Health Mesh.
                </p>
              </div>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 self-start sm:self-auto">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live 15m Telemetry Connected
              </span>
            </div>
          </div>

          {/* Grid of 3 Telemetry Desks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. Personnel Attendance Desk */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-indigo-500" />
                  Medical Personnel On Duty
                </h4>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  {profile.attendance?.attendancePercent || 85}% Attendance
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Medical Officers (Doctors)</div>
                    <div className="text-[11px] text-slate-400">Sanctioned: {profile.attendance?.doctorsSanctioned || 3} positions</div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      {profile.attendance?.doctorsOnDuty || 2}
                    </span>
                    <span className="text-[11px] text-slate-400"> on duty</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Staff Nurses</div>
                    <div className="text-[11px] text-slate-400">Sanctioned: {profile.attendance?.nursesSanctioned || 5} positions</div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      {profile.attendance?.nursesOnDuty || 4}
                    </span>
                    <span className="text-[11px] text-slate-400"> on duty</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Pharmacist &bull; Lab Technician</div>
                    <div className="text-[11px] text-slate-400">Essential diagnostics &amp; dispensary</div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {profile.attendance?.pharmacistsOnDuty || 1} / {profile.attendance?.labTechsOnDuty || 1}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => showToast('Staff shift biometric attendance broadcasted to District CMO.', 'success')}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors min-h-[44px]"
                >
                  Broadcast Shift Attendance (Morning)
                </button>
              </div>
            </div>

            {/* 2. Bed Occupancy & Gas Bank Desk */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Bed className="h-4 w-4 text-amber-500" />
                  Ward Bed Availability Breakdown
                </h4>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {profile.bedsOccupied} / {profile.bedsTotal} Total
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    <span>General Wards</span>
                    <span>{profile.bedBreakdown?.generalOccupied || 10} / {profile.bedBreakdown?.generalTotal || 12} Occupied</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${Math.min(100, ((profile.bedBreakdown?.generalOccupied || 10) / (profile.bedBreakdown?.generalTotal || 12)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    <span>Oxygen-Supported Beds</span>
                    <span>{profile.bedBreakdown?.oxygenOccupied || 4} / {profile.bedBreakdown?.oxygenTotal || 5} Occupied</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{
                        width: `${Math.min(100, ((profile.bedBreakdown?.oxygenOccupied || 4) / (profile.bedBreakdown?.oxygenTotal || 5)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    <span>ICU / Ventilator Beds</span>
                    <span className={profile.icuOccupied >= profile.icuTotal ? 'text-red-600 font-bold' : ''}>
                      {profile.icuOccupied} / {profile.icuTotal} {profile.icuOccupied >= profile.icuTotal && '(FULL)'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        profile.icuOccupied >= profile.icuTotal ? 'bg-red-500' : 'bg-purple-500'
                      )}
                      style={{
                        width: `${Math.min(100, (profile.icuOccupied / (profile.icuTotal || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    <span>Medical Oxygen Bank</span>
                    <span>{profile.oxygenCylindersAvailable} / {profile.oxygenCylindersTotal} Cylinders</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (profile.oxygenCylindersAvailable / (profile.oxygenCylindersTotal || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => showToast('Bed allocation telemetry updated and mirrored to Ambulance Dispatch network.', 'success')}
                  className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl transition-opacity hover:opacity-90 min-h-[44px]"
                >
                  Publish Live Bed Count
                </button>
              </div>
            </div>

            {/* 3. Footfall & Inflow Desk */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Outpatient Footfall Velocity
                </h4>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono">
                  {profile.footfall?.footfallTrend || 'STABLE'}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <div className="text-[11px] text-slate-500">Today&apos;s Cumulative OPD Footfall:</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {profile.footfall?.todayFootfall || 92} patients
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <div className="text-[11px] text-slate-500">Current Influx Velocity:</div>
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {profile.footfall?.hourlyInfluxRate || 14} patients / hour
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <div className="text-[11px] text-slate-500">Emergency / Red Triage Walk-Ins:</div>
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">
                    {profile.footfall?.emergencyCasesToday || 4} emergency cases
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/queue')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors min-h-[44px]"
                >
                  Open Live Clinical Queue Desk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STOCK UPDATE & SHORTAGE MODAL (Mobile Bottom Sheet) ──────────────── */}
      {editingMedicine && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Sheet Handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Update Medicine Inventory
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingMedicine.name}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {editingMedicine.category} &bull; Batch {editingMedicine.batchNumber}
                </p>
              </div>

              <button
                onClick={() => setEditingMedicine(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Physical Stock ({editingMedicine.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editStockCount}
                    onChange={(e) => setEditStockCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl min-h-[44px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Daily Consumption Rate
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editDailyRate}
                    onChange={(e) => setEditDailyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl min-h-[44px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Calculated projection */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs flex items-center justify-between">
                <span className="text-slate-500">Projected Runout:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {editDailyRate > 0 ? Math.round(editStockCount / editDailyRate) : 999} Days of Stock Remaining
                </span>
              </div>

              {/* Emergency SOS Shortage Flag */}
              <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-200 dark:border-red-900 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flagAsEmergency}
                    onChange={(e) => setFlagAsEmergency(e.target.checked)}
                    className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-xs font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                    Flag as Critical Shortage / SOS Stock-out
                  </span>
                </label>

                {flagAsEmergency && (
                  <div>
                    <label className="block text-[11px] font-semibold text-red-800 dark:text-red-300 mb-1">
                      Reason for Stock Deficit:
                    </label>
                    <select
                      value={editShortageReason}
                      onChange={(e) => setEditShortageReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded-xl min-h-[44px] focus:ring-2 focus:ring-red-500 focus:outline-none"
                    >
                      <option value="Sudden seasonal disease / epidemic surge in outpatient queue">
                        Sudden seasonal disease / epidemic surge in outpatient queue
                      </option>
                      <option value="Supply transit delayed from central warehouse">
                        Supply transit delayed from central warehouse
                      </option>
                      <option value="Expired or quarantined batch withdrawal">
                        Expired or quarantined batch withdrawal
                      </option>
                      <option value="High inpatient emergency trauma and ICU admissions">
                        High inpatient emergency trauma and ICU admissions
                      </option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMedicine(null)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors min-h-[44px]"
                >
                  Sync to AushadhiNet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
