'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DemoDB } from '@/lib/db/demo-db';
import { useSession, useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import { MedicineShortageHeatMap } from './MedicineShortageHeatMap';
import {
  ShieldAlert,
  Building2,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  TrendingUp,
  MapPin,
  Flame,
  Pill,
  Send,
  Bed,
  Network,
  Cpu,
  BarChart3,
  ShieldCheck,
  Check,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  SlidersHorizontal,
  Phone,
  Mail,
  FileSignature,
  Radio,
  Megaphone,
  AlertOctagon,
  Building,
} from 'lucide-react';
import type {
  DistrictSupplyAggregate,
  DistrictMedicineSummary,
  HospitalSupplyProfile,
  RedistributionOrder,
  ShortageReport,
  MedicineStockStatus,
} from '@smartcare/types';

export function StateCommandSupplyModule() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useAppStore();

  // Tab state synced with URL: ?commandTab=summary | heatmap | redistribution | federated | manifest
  const activeTab = searchParams.get('commandTab') || 'summary';

  const [aggregate, setAggregate] = useState<DistrictSupplyAggregate | null>(null);
  const [orders, setOrders] = useState<RedistributionOrder[]>([]);
  const [shortages, setShortages] = useState<ShortageReport[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Hyderabad & Rangareddy Central');

  // Search & Filters
  const [medFilter, setMedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadData = useCallback(() => {
    setIsRefreshing(true);
    const agg = DemoDB.getDistrictSupplyAggregate(selectedDistrict);
    setAggregate(agg);
    const ords = DemoDB.getRedistributionOrders();
    setOrders(ords);
    const sh = DemoDB.getShortageReports();
    setShortages(sh);
    setTimeout(() => setIsRefreshing(false), 250);
  }, [selectedDistrict]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('smartcare:supply-updated', handleUpdate);
    window.addEventListener('smartcare:shortage-reported', handleUpdate);
    window.addEventListener('smartcare:rebalance-updated', handleUpdate);
    window.addEventListener('smartcare:rebalance-delivered', handleUpdate);

    return () => {
      window.removeEventListener('smartcare:supply-updated', handleUpdate);
      window.removeEventListener('smartcare:shortage-reported', handleUpdate);
      window.removeEventListener('smartcare:rebalance-updated', handleUpdate);
      window.removeEventListener('smartcare:rebalance-delivered', handleUpdate);
    };
  }, [loadData]);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('commandTab', tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleApproveOrder = (orderId: string) => {
    const updated = DemoDB.approveRedistributionOrder(orderId);
    if (updated) {
      showToast(`Rebalance order ${updated.orderNumber} approved! Ready for dispatch.`, 'success');
      loadData();
    }
  };

  const handleDispatchOrder = (orderId: string) => {
    const updated = DemoDB.dispatchRedistributionOrder(orderId);
    if (updated) {
      showToast(`Rebalance order ${updated.orderNumber} dispatched! Transit manifest updated.`, 'success');
      loadData();
    }
  };

  const handleTriggerRebalanceFromMap = (targetFacilityId: string, medicineId: string) => {
    const facility = aggregate?.facilityProfiles.find((f) => f.hospitalId === targetFacilityId);
    const med = facility?.medicines.find((m) => m.id === medicineId);
    showToast(
      `Auto-rebalance prioritized for ${facility?.hospitalName || 'facility'} (${med?.name || medicineId}). Order ready for review.`,
      'info'
    );
    handleTabChange('redistribution');
  };

  // ─── Emergency Escalation State & Actions ───────────────────────────────────
  const [showEpoModal, setShowEpoModal] = useState<boolean>(false);
  const [epoMedicine, setEpoMedicine] = useState<string>('Insulin Glargine 100 IU/ml');
  const [epoSupplier, setEpoSupplier] = useState<string>('TSMSIDC Rate Contract #RC-2026-08 (Cipla Ltd)');
  const [epoQuantity, setEpoQuantity] = useState<number>(500);
  const [epoCorridor, setEpoCorridor] = useState<string>('Green Corridor Road Express');
  const [isSubmittingEpo, setIsSubmittingEpo] = useState<boolean>(false);
  const [emergencyPos, setEmergencyPos] = useState<
    Array<{ id: string; poNumber: string; medicine: string; supplier: string; quantity: number; corridor: string; status: string; issuedAt: string }>
  >([
    {
      id: 'epo-demo-1',
      poNumber: 'EPO-2026-TS-041',
      medicine: 'Anti-Rabies Vaccine (ARV)',
      supplier: 'Bharat Serums & Vaccines Ltd (RC #BSV-99)',
      quantity: 300,
      corridor: 'Green Corridor Air-Express',
      status: 'DISPATCHED',
      issuedAt: 'Today, 08:30 AM',
    },
  ]);

  const handleNotifyCmo = () => {
    showToast(
      'Emergency Directive #DIR-2026-HYD-09 dispatched to District CMO Dr. Rajeshwar Sharma (Hyderabad Directorate). Inspection team alerted.',
      'success'
    );
  };

  const handleRequisitionNationalReserve = () => {
    showToast(
      'SOS Central Allocation Request transmitted to MoHFW Disaster Emergency Division, Nirman Bhawan, New Delhi. Token: #CMSS-NAT-8812.',
      'success'
    );
  };

  const handleBroadcastClinicalAdvisory = () => {
    showToast(
      'Clinical Substitution Advisory #ADV-2026-03 broadcasted to all 28 PHC/CHC Medical Officers (Approved alternatives: Ringer Lactate & NPH Insulin).',
      'info'
    );
  };

  const handleSubmitEpo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEpo(true);
    setTimeout(() => {
      const newPo = {
        id: `epo-${Date.now().toString().slice(-6)}`,
        poNumber: `EPO-2026-TS-${Math.floor(100 + Math.random() * 900)}`,
        medicine: epoMedicine,
        supplier: epoSupplier,
        quantity: epoQuantity,
        corridor: epoCorridor,
        status: 'CONFIRMED (24h SLA)',
        issuedAt: 'Just now',
      };
      setEmergencyPos((prev) => [newPo, ...prev]);
      setIsSubmittingEpo(false);
      setShowEpoModal(false);
      showToast(
        `Emergency PO ${newPo.poNumber} issued under Rate Contract! Supplier notified with 24-hour delivery SLA.`,
        'success'
      );
    }, 500);
  };

  // Filtered medicines
  const filteredSummaries = useMemo(() => {
    if (!aggregate) return [];
    return aggregate.medicineSummaries.filter((m) => {
      const matchCat = medFilter === 'ALL' || m.category === medFilter;
      const matchSearch =
        m.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [aggregate, medFilter, searchQuery]);

  if (!aggregate) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
        <p>Connecting to AushadhiNet State Command Hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── State Command Center Header ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                MoHFW &bull; NITI Aayog Health Mesh
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Federated Sync
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Network className="h-8 w-8 text-indigo-400 shrink-0" />
              AushadhiNet State Command Center
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Real-time health resource pooling, inter-hospital shortage aggregation, and AI-governed surplus redistribution
              for {aggregate.state} ({aggregate.district}).
            </p>
          </div>

          {/* Quick Actions & District Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-2 flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium pl-2">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 min-h-[40px] focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
              >
                <option value="Hyderabad & Rangareddy Central">Hyderabad &amp; Rangareddy Central</option>
                <option value="Warangal Urban & Rural">Warangal Urban &amp; Rural</option>
                <option value="Karimnagar North">Karimnagar North</option>
                <option value="Nizamabad Valley">Nizamabad Valley</option>
              </select>
            </div>

            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all min-h-[44px]"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              Refresh Aggregate
            </button>
          </div>
        </div>

        {/* ─── Real-Time District Averages Aggregator Banner ─────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Pill className="h-3.5 w-3.5 text-indigo-400" />
              District Stock Avg
            </div>
            <div className="text-2xl font-black text-white">{aggregate.avgStockDaysRemaining} Days</div>
            <div className="text-[10px] text-slate-400">Mean burn buffer across facilities</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-red-400" />
              Critical Shortages
            </div>
            <div className={cn('text-2xl font-black', aggregate.criticalAlertsCount > 0 ? 'text-red-400' : 'text-emerald-400')}>
              {aggregate.criticalAlertsCount} Alert{aggregate.criticalAlertsCount === 1 ? '' : 's'}
            </div>
            <div className="text-[10px] text-slate-400">Facilities with &le; 3 days stock</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Bed className="h-3.5 w-3.5 text-amber-400" />
              Hospital Beds Avg
            </div>
            <div className="text-2xl font-black text-white">{aggregate.totalBedsOccupancyPercent}%</div>
            <div className="text-[10px] text-slate-400">Occupancy rate across 4 facilities</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-purple-400" />
              ICU Bed Load
            </div>
            <div className="text-2xl font-black text-purple-300">{aggregate.totalIcuOccupancyPercent}%</div>
            <div className="text-[10px] text-slate-400">74 / 86 Critical care beds</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-cyan-400" />
              Oxygen Bank
            </div>
            <div className="text-2xl font-black text-cyan-300">{aggregate.oxygenAvailabilityPercent}%</div>
            <div className="text-[10px] text-slate-400">538 Cylinders ready in district</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-emerald-400" />
              AI Rebalances
            </div>
            <div className="text-2xl font-black text-emerald-300">{aggregate.pendingRebalances} Ready</div>
            <div className="text-[10px] text-slate-400">Awaiting CMO dispatch order</div>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => handleTabChange('summary')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap min-h-[44px]',
            activeTab === 'summary'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <BarChart3 className="h-4 w-4" />
          District Aggregation &amp; Averages
        </button>

        <button
          onClick={() => handleTabChange('heatmap')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap min-h-[44px]',
            activeTab === 'heatmap'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <MapPin className="h-4 w-4" />
          Interactive GIS Resource Map
        </button>

        <button
          onClick={() => handleTabChange('redistribution')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap min-h-[44px]',
            activeTab === 'redistribution'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          AI Redistribution Approval Desk ({orders.filter((o) => o.status === 'suggested').length})
        </button>

        <button
          onClick={() => handleTabChange('federated')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap min-h-[44px]',
            activeTab === 'federated'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Cpu className="h-4 w-4" />
          Federated AI Demand Surge Forecaster
        </button>

        <button
          onClick={() => handleTabChange('manifest')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap min-h-[44px]',
            activeTab === 'manifest'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Truck className="h-4 w-4" />
          Logistics Manifest ({orders.filter((o) => o.status === 'in_transit').length} In-Transit)
        </button>

        <button
          onClick={() => handleTabChange('escalation')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap min-h-[44px]',
            activeTab === 'escalation'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-red-700 dark:text-red-400 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800'
          )}
        >
          <ShieldAlert className="h-4 w-4 text-red-500" />
          Emergency SOS Escalation ({aggregate.criticalAlertsCount} Critical)
        </button>
      </div>

      {/* ─── TAB 1: DISTRICT AGGREGATION & AVERAGING TABLE ──────────────────────── */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Facility Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {aggregate.facilityProfiles.map((f) => {
              const isShortage = f.medicines.some((m) => m.status === 'critical');
              return (
                <div
                  key={f.hospitalId}
                  className={cn(
                    'p-4 rounded-2xl border transition-all space-y-2',
                    f.tier === 'warehouse'
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                      : isShortage
                      ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {f.tier.replace('_', ' ')}
                    </span>
                    <span
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        f.tier === 'warehouse'
                          ? 'bg-blue-500'
                          : isShortage
                          ? 'bg-red-500 animate-ping'
                          : 'bg-emerald-500'
                      )}
                    />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{f.hospitalName}</h4>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    {f.tier !== 'warehouse' ? (
                      <>
                        <div>Beds: {f.bedsOccupied}/{f.bedsTotal} &bull; ICU: {f.icuOccupied}/{f.icuTotal}</div>
                        <div className={cn('font-semibold', isShortage ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                          {f.medicines.filter((m) => m.status === 'critical').length} Critical Shortages
                        </div>
                      </>
                    ) : (
                      <>
                        <div>Strategic Depot Buffer</div>
                        <div className="text-blue-600 dark:text-blue-400 font-semibold">120,000+ Reserve Units</div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* District Medicine Averaging Matrix */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  District Medicine Shortage Aggregation &amp; Averaging Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Data reported from all Primary Health Centres, Community Hospitals, and Central Depot averaged in real time.
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 overflow-x-auto">
                {['ALL', 'Critical Supplies', 'Antibiotics', 'Chronic Care', 'Emergency & IV', 'Vaccines'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMedFilter(cat)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[38px]',
                      medFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                    <th className="py-3 px-3">Medicine / Essential</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">District Stock</th>
                    <th className="py-3 px-3 text-right">Daily Burn</th>
                    <th className="py-3 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">District Avg Buffer</th>
                    <th className="py-3 px-3">Hospitals in Deficit</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSummaries.map((med) => {
                    const isCritical = med.status === 'critical';
                    const isLow = med.status === 'low';

                    return (
                      <tr
                        key={med.medicineId}
                        className={cn(
                          'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                          isCritical && 'bg-red-50/40 dark:bg-red-950/10'
                        )}
                      >
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{med.medicineName}</div>
                          <div className="text-[11px] text-slate-400">{med.hospitalsReporting} Facilities Reporting</div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            {med.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {med.totalStock.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {med.avgDailyConsumption}/day
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-bold text-base text-indigo-600 dark:text-indigo-400">
                          {med.districtAvgDaysRemaining > 90 ? '90+' : `${med.districtAvgDaysRemaining} Days`}
                        </td>

                        <td className="py-3.5 px-3">
                          {med.criticalHospitals.length > 0 ? (
                            <div className="space-y-1">
                              {med.criticalHospitals.map((hName) => (
                                <span
                                  key={hName}
                                  className="inline-block mr-1 text-[11px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                                >
                                  {hName.split(' ')[0]} (Deficit)
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              All facilities stable
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-bold inline-block',
                              isCritical
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                : isLow
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                            )}
                          >
                            {isCritical ? 'CRITICAL' : isLow ? 'LOW' : 'STABLE'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleTabChange('redistribution')}
                            className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:opacity-90 min-h-[38px]"
                          >
                            Rebalance
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: INTERACTIVE GIS RESOURCE HEAT MAP ──────────────────────────── */}
      {activeTab === 'heatmap' && (
        <MedicineShortageHeatMap
          facilities={aggregate.facilityProfiles}
          onTriggerRebalance={handleTriggerRebalanceFromMap}
        />
      )}

      {/* ─── TAB 3: AI REDISTRIBUTION APPROVAL DESK ───────────────────────────── */}
      {activeTab === 'redistribution' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  AI Automated Redistribution &amp; Rebalancing Desk
                </h3>
                <p className="text-xs text-slate-500">
                  Algorithmic routing matching surplus inventory from the Central Warehouse to primary health centres experiencing acute stock-outs.
                </p>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {orders.filter((o) => o.status === 'suggested').length} Suggested Actions
              </span>
            </div>

            <div className="space-y-4">
              {orders.map((order) => {
                const isSuggested = order.status === 'suggested';
                const isApproved = order.status === 'approved';
                const isInTransit = order.status === 'in_transit';
                const isDelivered = order.status === 'delivered';

                return (
                  <div
                    key={order.id}
                    className={cn(
                      'rounded-2xl border p-5 transition-all space-y-4',
                      isSuggested
                        ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-300 dark:border-amber-800 shadow-sm'
                        : isApproved
                        ? 'bg-blue-50/40 dark:bg-blue-950/15 border-blue-300 dark:border-blue-800'
                        : isInTransit
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 text-[10px] font-bold rounded uppercase',
                            order.priority === 'CRITICAL'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                          )}
                        >
                          {order.priority}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500">
                        Route: <strong className="text-slate-800 dark:text-slate-200">{order.routeDistanceKm} km</strong> (~{order.estimatedTransitMins} mins)
                      </div>
                    </div>

                    {/* Routing Diagram */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
                          Source (Surplus Depot)
                        </div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                          {order.sourceHospitalName}
                        </div>
                      </div>

                      <div className="text-center flex flex-col items-center justify-center">
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          Transfer: {order.quantity} {order.unit}
                          <ArrowRight className="h-4 w-4 shrink-0" />
                        </div>
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                          {order.medicineName}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-red-200 dark:border-red-900">
                        <div className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400">
                          Recipient (Stock Deficit)
                        </div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                          {order.targetHospitalName}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="text-xs text-slate-500 font-mono">
                        Digital Handover OTP: <strong className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{order.otpCode}</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSuggested && (
                          <button
                            onClick={() => handleApproveOrder(order.id)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors min-h-[44px] flex items-center gap-1.5"
                          >
                            <Check className="h-4 w-4" />
                            Approve Redistribution
                          </button>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => handleDispatchOrder(order.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors min-h-[44px] flex items-center gap-1.5"
                          >
                            <Truck className="h-4 w-4" />
                            Dispatch Rebalance Vehicle
                          </button>
                        )}

                        {isInTransit && (
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/40 px-3 py-2 rounded-xl">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                            Vehicle en route to destination facility
                          </span>
                        )}

                        {isDelivered && (
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Delivery completed and verified with OTP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: FEDERATED AI DEMAND SURGE FORECASTER ────────────────────────── */}
      {activeTab === 'federated' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-slate-800 p-6 text-white space-y-5">
            <div className="flex items-center gap-3">
              <Cpu className="h-8 w-8 text-indigo-400" />
              <div>
                <h3 className="text-xl font-black text-white">
                  Privacy-Preserving Federated Learning &bull; Demand Surge Forecaster
                </h3>
                <p className="text-xs text-slate-300">
                  Patient OPD electronic records never leave the hospital premise. Only localized neural gradient weights
                  (&Delta;w) are aggregated via FedAvg to predict 14-day district epidemiological spikes.
                </p>
              </div>
            </div>

            {/* Architecture Ring */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2">
                <div className="text-xs font-bold text-indigo-400 uppercase">Local Edge Node 1: PHCs</div>
                <div className="text-sm font-semibold">Trained on Local Patient OPD Data</div>
                <p className="text-xs text-slate-400">
                  Trains localized weights for respiratory caseloads and fever walk-ins. Zero PII transmitted.
                </p>
                <div className="text-[11px] font-mono text-emerald-400">&Delta;w_PHC: [0.042, -0.118, 0.891]</div>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2">
                <div className="text-xs font-bold text-indigo-400 uppercase">Local Edge Node 2: Tertiary Care</div>
                <div className="text-sm font-semibold">Trained on ICU &amp; Trauma Inflow</div>
                <p className="text-xs text-slate-400">
                  Trains localized weights on acute surgical shock, anti-venom, and diabetic ketoacidosis rates.
                </p>
                <div className="text-[11px] font-mono text-emerald-400">&Delta;w_HOSP: [0.129, 0.054, -0.221]</div>
              </div>

              <div className="bg-indigo-900/40 p-4 rounded-xl border border-indigo-600/50 space-y-2">
                <div className="text-xs font-bold text-indigo-300 uppercase">State Central Aggregator</div>
                <div className="text-sm font-semibold">Global FedAvg Model Synthesis</div>
                <p className="text-xs text-slate-300">
                  Combines parameters into a state-wide 14-day supply forecast model with zero patient data exposure.
                </p>
                <div className="text-[11px] font-mono text-indigo-300">Convergence: 98.4% &bull; Loss: 0.012</div>
              </div>
            </div>

            {/* 14-Day Demand Forecast Chart/Table */}
            <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 space-y-4">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
                14-Day District Epidemiological Medicine Demand Projection
              </h4>

              <div className="space-y-3">
                {[
                  { name: 'Insulin Glargine', surge: '+48% Surge Projected', reason: 'Seasonal viral complications & chronic walk-in peak', risk: 'HIGH RISK' },
                  { name: 'IV Normal Saline 0.9%', surge: '+65% Surge Projected', reason: 'High heat index and acute gastroenteritis admissions', risk: 'CRITICAL RISK' },
                  { name: 'Paracetamol 500mg', surge: '+30% Moderate Increase', reason: 'Seasonal viral flu cluster in suburban schools', risk: 'MODERATE' },
                  { name: 'Anti-Rabies Vaccine', surge: '+20% Localized Spike', reason: 'Canine bite clusters reported in peri-urban wards', risk: 'HIGH RISK' },
                ].map((item) => (
                  <div key={item.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 gap-2">
                    <div>
                      <div className="font-bold text-sm text-white">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.reason}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400">{item.surge}</span>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', item.risk === 'CRITICAL RISK' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300')}>
                        {item.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: LOGISTICS MANIFEST ─────────────────────────────────────────── */}
      {activeTab === 'manifest' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="h-5 w-5 text-indigo-500" />
                  Inter-Facility Logistics &amp; Transport Manifest
                </h3>
                <p className="text-xs text-slate-500">Live manifest of delivery vehicles and OTP-verified transfers.</p>
              </div>

              <span className="text-xs font-semibold text-slate-500 font-mono">
                {orders.length} Total Registered Transfers
              </span>
            </div>

            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-indigo-600 dark:text-indigo-400">{o.orderNumber}</strong>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {o.quantity} {o.unit} of {o.medicineName}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      {o.sourceHospitalName} &rarr; <strong>{o.targetHospitalName}</strong> &bull; {o.routeDistanceKm} km
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] uppercase text-slate-400">Digital OTP</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{o.otpCode}</div>
                    </div>

                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[11px] font-bold uppercase',
                        o.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : o.status === 'in_transit'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 animate-pulse'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                      )}
                    >
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: EMERGENCY SOS ESCALATION & SUPPLIER DISPATCH DESK ──────────── */}
      {activeTab === 'escalation' && (
        <div className="space-y-6">
          {/* Header Protocol Card */}
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-2 border-red-500/40 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                    <AlertOctagon className="h-3.5 w-3.5 text-red-400" />
                    MoHFW Critical Shortage SOP Active
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Protocol: NHM-SOP-SEC-9</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <ShieldAlert className="h-6 w-6 text-red-400 shrink-0" />
                  State Emergency Shortage Escalation Desk
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                  When primary health facilities breach critical safety buffers (&le; 3 days), the State Commander triggers a 4-tier public health intervention across District CMOs, State Rate-Contract suppliers, and the National Central Reserve.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEpoModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg min-h-[44px]"
                >
                  <FileSignature className="h-4 w-4" />
                  Issue Emergency PO (24h SLA)
                </button>
                <button
                  type="button"
                  onClick={handleBroadcastClinicalAdvisory}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all min-h-[44px]"
                >
                  <Megaphone className="h-4 w-4 text-amber-400" />
                  Broadcast Clinical Advisory
                </button>
              </div>
            </div>
          </div>

          {/* ─── 4-Tier Public Health Escalation Contacts Grid ───────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Tier 1: District Chief Medical Officer (CMO) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                      Tier 1: Immediate Field Action (&le; 1 Hour)
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      District Chief Medical Officer (CMO)
                    </h4>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  Online
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <div><strong>Officer:</strong> Dr. Rajeshwar Sharma, Hyderabad Health Directorate</div>
                <div><strong>Hotline:</strong> +91 40 2345 6789 &bull; <strong>Email:</strong> cmo@district.gov.in</div>
                <div><strong>SOP Protocol:</strong> Trigger local warehouse reallocation &amp; dispatch inspection team to PHC.</div>
              </div>

              <button
                type="button"
                onClick={handleNotifyCmo}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all min-h-[44px]"
              >
                <Send className="h-3.5 w-3.5" />
                Dispatch Directive to District CMO
              </button>
            </div>

            {/* Contact Tier 2: State Medical Services Corporation (TSMSIDC) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                      Tier 2: Rate Contract Suppliers (&le; 4 Hours)
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      State Medical Services Corp (TSMSIDC)
                    </h4>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                  Rate Contract
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <div><strong>Authority:</strong> General Manager (Procurement), State Medical Corporation</div>
                <div><strong>Desk:</strong> +91 40 2322 0011 &bull; <strong>Email:</strong> procurement@tsmsidc.telangana.gov.in</div>
                <div><strong>SOP Protocol:</strong> Issue binding Emergency Purchase Order against annual Rate Contracts (RC).</div>
              </div>

              <button
                type="button"
                onClick={() => setShowEpoModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all min-h-[44px]"
              >
                <FileSignature className="h-3.5 w-3.5" />
                Issue Emergency Rate-Contract PO
              </button>
            </div>

            {/* Contact Tier 3: National Central Medical Services Society (CMSS / MoHFW) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                      Tier 3: National Central Reserve (&le; 12 Hours)
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      MoHFW Central Medical Services (CMSS)
                    </h4>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                  New Delhi
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <div><strong>Authority:</strong> Emergency Health Stockpile Desk, Nirman Bhawan, New Delhi</div>
                <div><strong>Portal:</strong> cmss.gov.in &bull; <strong>Secure Hotline:</strong> +91 11 2306 1422</div>
                <div><strong>SOP Protocol:</strong> National emergency quota release from Jan Aushadhi Central Depot.</div>
              </div>

              <button
                type="button"
                onClick={handleRequisitionNationalReserve}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all min-h-[44px]"
              >
                <Radio className="h-3.5 w-3.5" />
                Requisition National Central Reserve
              </button>
            </div>

            {/* Contact Tier 4: Clinical Advisory Network (PHC & CHC Medical Officers) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">
                      Tier 4: Clinical Advisory Broadcast
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      PHC / CHC Clinicians Network
                    </h4>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
                  28 Facilities
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <div><strong>Target:</strong> All duty doctors, casualty medical officers &amp; pharmacists in district</div>
                <div><strong>Protocol:</strong> Approved substitutions (Normal Saline &rarr; Ringer Lactate; Insulin &rarr; NPH)</div>
                <div><strong>Effect:</strong> Prevents acute therapy interruption while emergency dispatches transit.</div>
              </div>

              <button
                type="button"
                onClick={handleBroadcastClinicalAdvisory}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all min-h-[44px]"
              >
                <Megaphone className="h-3.5 w-3.5" />
                Broadcast Substitution Advisory
              </button>
            </div>
          </div>

          {/* ─── Tracked Emergency Purchase Orders Manifest ─────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-red-500" />
                  State Emergency Purchase Orders (EPO) Manifest
                </h4>
                <p className="text-xs text-slate-500">Tracked emergency rate-contract dispatches with binding delivery SLAs.</p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {emergencyPos.length} Active Orders
              </span>
            </div>

            <div className="space-y-2.5">
              {emergencyPos.map((epo) => (
                <div
                  key={epo.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-red-600 dark:text-red-400">{epo.poNumber}</strong>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {epo.quantity} Units &bull; {epo.medicine}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Vendor: <strong>{epo.supplier}</strong> &bull; Corridor: {epo.corridor}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">{epo.issuedAt}</span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      {epo.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Issue Emergency Purchase Order (EPO) ────────────────────────── */}
      {showEpoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Mobile handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  MoHFW Procurement SOP &bull; Fast-Track
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Issue Emergency Purchase Order (EPO)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEpoModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitEpo} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medicine in Acute Deficit
                </label>
                <select
                  value={epoMedicine}
                  onChange={(e) => setEpoMedicine(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl min-h-[44px] text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="Insulin Glargine 100 IU/ml">Insulin Glargine 100 IU/ml (Cold-Chain)</option>
                  <option value="IV Normal Saline 0.9% (500ml)">IV Normal Saline 0.9% (500ml)</option>
                  <option value="Anti-Rabies Vaccine (ARV)">Anti-Rabies Vaccine (ARV)</option>
                  <option value="Anti-Snake Venom (ASV) Polyvalent">Anti-Snake Venom (ASV) Polyvalent</option>
                  <option value="Medical Oxygen Cylinders (D-Type)">Medical Oxygen Cylinders (D-Type)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Empaneled Rate Contract (RC) Vendor
                </label>
                <select
                  value={epoSupplier}
                  onChange={(e) => setEpoSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl min-h-[44px] text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="TSMSIDC Rate Contract #RC-2026-08 (Cipla Ltd)">TSMSIDC Rate Contract #RC-2026-08 (Cipla Ltd)</option>
                  <option value="Pradhan Mantri Jan Aushadhi National Depot (PMBI-02)">Pradhan Mantri Jan Aushadhi National Depot (PMBI-02)</option>
                  <option value="Bharat Serums & Vaccines Ltd (RC #BSV-99)">Bharat Serums &amp; Vaccines Ltd (RC #BSV-99)</option>
                  <option value="Sun Pharma Institutional Emergency Fleet">Sun Pharma Institutional Emergency Fleet</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Quantity
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    required
                    value={epoQuantity}
                    onChange={(e) => setEpoQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl min-h-[44px] text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transit Corridor
                  </label>
                  <select
                    value={epoCorridor}
                    onChange={(e) => setEpoCorridor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl min-h-[44px] text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="Green Corridor Road Express">Green Corridor Road Express (24h SLA)</option>
                    <option value="State Medical Drone Link">State Medical Drone Link (2h Express)</option>
                    <option value="Air Freight Courier">Air Freight Courier (12h SLA)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  Legal &amp; Procurement SLA Notice:
                </div>
                <p>
                  This emergency PO is issued under Section 19 of the National Health Mission Act. The vendor is legally required to begin loading within 4 hours. Failure incurs a 15% liquidated damage penalty.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEpoModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEpo}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white min-h-[44px] font-bold flex items-center gap-2"
                >
                  {isSubmittingEpo ? (
                    'Signing & Disagreeing...'
                  ) : (
                    <>
                      <FileSignature className="h-4 w-4" />
                      Authorize &amp; Sign Emergency PO
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
