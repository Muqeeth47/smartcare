'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Flame,
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  Pill,
  MapPin,
  Truck,
  Activity,
  CheckCircle2,
  Layers,
  Search,
  Building2,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Navigation,
} from 'lucide-react';
import type {
  HospitalSupplyProfile,
  MedicineItem,
  MedicineStockStatus,
} from '@smartcare/types';

interface MedicineShortageHeatMapProps {
  facilities: HospitalSupplyProfile[];
  onTriggerRebalance: (targetFacilityId: string, medicineId: string) => void;
}

export function MedicineShortageHeatMap({
  facilities,
  onTriggerRebalance,
}: MedicineShortageHeatMapProps) {
  // Filter state
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'spatial' | 'matrix'>('spatial');
  const [selectedFacility, setSelectedFacility] = useState<HospitalSupplyProfile | null>(facilities[0] || null);

  // Extract unique medicines across all facilities
  const medicineList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; category: string }>();
    facilities.forEach((f) => {
      f.medicines.forEach((m) => {
        if (!map.has(m.id)) {
          map.set(m.id, { id: m.id, name: m.name, category: m.category });
        }
      });
    });
    return Array.from(map.values());
  }, [facilities]);

  // Warehouse depot (central reference)
  const warehouse = useMemo(
    () => facilities.find((f) => f.tier === 'warehouse') || facilities[0],
    [facilities]
  );

  // Calculate Haversine distance from warehouse in km
  const getDistanceFromWarehouse = (f: HospitalSupplyProfile): number => {
    if (!warehouse?.coordinates || !f.coordinates || f.hospitalId === warehouse.hospitalId) return 0;
    const R = 6371;
    const dLat = ((f.coordinates.lat - warehouse.coordinates.lat) * Math.PI) / 180;
    const dLon = ((f.coordinates.lng - warehouse.coordinates.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((warehouse.coordinates.lat * Math.PI) / 180) *
        Math.cos((f.coordinates.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  // Severity calculator for a facility given the selected medicine filter
  const getFacilityShortageScore = (f: HospitalSupplyProfile): {
    score: number; // 0 to 100 (100 is most severe shortage)
    daysRemaining: number;
    status: MedicineStockStatus;
    criticalCount: number;
    worstMedicineName: string;
  } => {
    if (f.tier === 'warehouse') {
      return { score: 0, daysRemaining: 999, status: 'normal', criticalCount: 0, worstMedicineName: 'None' };
    }

    if (selectedMedicineId !== 'ALL') {
      const targetMed = f.medicines.find((m) => m.id === selectedMedicineId);
      if (!targetMed) return { score: 0, daysRemaining: 999, status: 'normal', criticalCount: 0, worstMedicineName: 'None' };
      const days = targetMed.daysRemaining;
      const score = Math.max(0, Math.min(100, Math.round(((targetMed.minBuffer - targetMed.currentStock) / targetMed.minBuffer) * 100)));
      return {
        score: days <= 2 ? 100 : days <= 5 ? 75 : days <= 8 ? 40 : 10,
        daysRemaining: days,
        status: targetMed.status,
        criticalCount: targetMed.status === 'critical' ? 1 : 0,
        worstMedicineName: targetMed.name,
      };
    }

    // When viewing all medicines: score based on worst critical medicine
    const sortedByDays = [...f.medicines].sort((a, b) => a.daysRemaining - b.daysRemaining);
    const worst = sortedByDays[0];
    const critCount = f.medicines.filter((m) => m.status === 'critical').length;
    const minDays = worst?.daysRemaining || 30;
    const score = critCount >= 3 || minDays <= 1 ? 100 : critCount >= 1 || minDays <= 3 ? 80 : minDays <= 7 ? 45 : 10;

    return {
      score,
      daysRemaining: minDays,
      status: minDays <= 3 ? 'critical' : minDays <= 7 ? 'low' : 'normal',
      criticalCount: critCount,
      worstMedicineName: worst?.name || 'All Stable',
    };
  };

  return (
    <div className="space-y-5">
      {/* ─── Heat Map Controls & Filter Header ───────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
                <Flame className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  District Medicine Depletion &amp; Shortage Heat Map
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time spatial density tracking identifying facilities with critical stock depletion and zero-day buffers.
                </p>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('spatial')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all min-h-[40px]',
                viewMode === 'spatial'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              <MapPin className="h-3.5 w-3.5 text-indigo-500" />
              Spatial Heat Map
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all min-h-[40px]',
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              Shortage Intensity Matrix
            </button>
          </div>
        </div>

        {/* Medicine Selector Pills */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Pill className="h-3.5 w-3.5 text-indigo-500" />
              Filter Heat by Essential Medicine:
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {selectedMedicineId === 'ALL' ? 'Aggregated Shortage Index' : 'Single SKU Depletion Heat'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
            <button
              onClick={() => setSelectedMedicineId('ALL')}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap min-h-[42px] transition-all',
                selectedMedicineId === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              All Critical Shortages
            </button>

            {medicineList.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMedicineId(m.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap min-h-[42px] transition-all',
                  selectedMedicineId === m.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {m.name.split(' ')[0]} {m.name.includes('Insulin') ? 'Insulin' : m.name.includes('Saline') ? 'Saline' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Heat Map Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <div className="font-bold text-slate-700 dark:text-slate-300">Depletion Severity Scale:</div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
              <span className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
              Critical Lack (0-2 Days)
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              Severe Shortage (3-5 Days)
            </span>
            <span className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 font-medium">
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              Buffer Warning (6-8 Days)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              Adequate (&gt;8 Days)
            </span>
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
              <span className="h-3 w-3 rounded-full bg-blue-600" />
              Central Depot
            </span>
          </div>
        </div>
      </div>

      {/* ─── VIEW 1: SPATIAL MESH HEAT MAP ───────────────────────────────────── */}
      {viewMode === 'spatial' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Spatial Heat Canvas */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden min-h-[460px] flex flex-col justify-between">
            {/* Ambient heat glow behind severe shortage nodes */}
            <div className="absolute right-10 bottom-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-20 top-20 w-48 h-48 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between z-10 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-indigo-400" />
                <span className="font-bold text-sm text-white">
                  Hyderabad &amp; Rangareddy Geographic Telemetry Grid
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Central Depot at [17.4100 N, 78.4600 E]
              </span>
            </div>

            {/* Spatial Schematic Canvas */}
            <div className="relative my-6 h-80 w-full rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
              {/* Distance routing vectors connecting warehouse to health centers */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-indigo-500/25 stroke-dashed stroke-2">
                <line x1="50%" y1="20%" x2="18%" y2="28%" />
                <line x1="50%" y1="20%" x2="80%" y2="35%" />
                <line x1="50%" y1="20%" x2="45%" y2="75%" />
                <line x1="50%" y1="20%" x2="82%" y2="80%" />
              </svg>

              {/* Node 1: Central Depot */}
              <button
                type="button"
                onClick={() => setSelectedFacility(warehouse)}
                className={cn(
                  'absolute left-[50%] top-[20%] -translate-x-1/2 -translate-y-1/2 p-3.5 rounded-2xl border-2 transition-all text-left shadow-xl group z-20 min-h-[44px]',
                  selectedFacility?.hospitalId === warehouse.hospitalId
                    ? 'border-blue-400 bg-slate-800 scale-105 ring-4 ring-blue-500/30'
                    : 'border-blue-500/80 bg-slate-900/95 hover:scale-105'
                )}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="font-black text-xs text-white">Central Buffer Warehouse</span>
                </div>
                <div className="text-[10px] text-blue-300 font-semibold mt-0.5">
                  Strategic Depot &bull; 120,000+ Units
                </div>
              </button>

              {/* Node 2: PHC Gachibowli */}
              {(() => {
                const f = facilities.find((p) => p.hospitalId === 'phc-gachibowli');
                if (!f) return null;
                const stats = getFacilityShortageScore(f);
                const isCrit = stats.daysRemaining <= 2;
                const isSelected = selectedFacility?.hospitalId === f.hospitalId;

                return (
                  <button
                    type="button"
                    key={f.hospitalId}
                    onClick={() => setSelectedFacility(f)}
                    className={cn(
                      'absolute left-[18%] top-[28%] -translate-x-1/2 -translate-y-1/2 p-3 rounded-2xl border-2 transition-all text-left shadow-lg group z-10 min-h-[44px]',
                      isCrit
                        ? 'border-red-500 bg-red-950/80 shadow-red-500/20'
                        : stats.daysRemaining <= 5
                        ? 'border-amber-500 bg-amber-950/70'
                        : 'border-emerald-500/80 bg-slate-900/90',
                      isSelected && 'ring-4 ring-indigo-500/50 scale-105'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-2.5 w-2.5 rounded-full', isCrit ? 'bg-red-500 animate-ping' : 'bg-emerald-400')} />
                      <span className="font-bold text-xs text-white">PHC Gachibowli</span>
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5">
                      {stats.daysRemaining > 90 ? '90+ Days' : `${stats.daysRemaining} Days Stock`} &bull; {getDistanceFromWarehouse(f)} km
                    </div>
                  </button>
                );
              })()}

              {/* Node 3: SmartCare Community Hospital */}
              {(() => {
                const f = facilities.find((p) => p.hospitalId === 'hosp-smartcare');
                if (!f) return null;
                const stats = getFacilityShortageScore(f);
                const isCrit = stats.daysRemaining <= 2;
                const isSelected = selectedFacility?.hospitalId === f.hospitalId;

                return (
                  <button
                    type="button"
                    key={f.hospitalId}
                    onClick={() => setSelectedFacility(f)}
                    className={cn(
                      'absolute left-[80%] top-[35%] -translate-x-1/2 -translate-y-1/2 p-3.5 rounded-2xl border-2 transition-all text-left shadow-xl group z-10 min-h-[44px]',
                      isCrit
                        ? 'border-red-500 bg-red-950/90 shadow-red-500/30'
                        : stats.daysRemaining <= 5
                        ? 'border-amber-500 bg-amber-950/80'
                        : 'border-emerald-500/80 bg-slate-900/90',
                      isSelected && 'ring-4 ring-indigo-500/50 scale-105'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-red-500 animate-bounce" />
                      <span className="font-bold text-xs text-white">SmartCare Community</span>
                    </div>
                    <div className="text-[10px] text-red-300 font-bold mt-0.5">
                      Critical Shortage: {stats.daysRemaining}d Left &bull; {getDistanceFromWarehouse(f)} km
                    </div>
                  </button>
                );
              })()}

              {/* Node 4: City General Hospital */}
              {(() => {
                const f = facilities.find((p) => p.hospitalId === 'hosp-city-gen');
                if (!f) return null;
                const stats = getFacilityShortageScore(f);
                const isCrit = stats.daysRemaining <= 2;
                const isSelected = selectedFacility?.hospitalId === f.hospitalId;

                return (
                  <button
                    type="button"
                    key={f.hospitalId}
                    onClick={() => setSelectedFacility(f)}
                    className={cn(
                      'absolute left-[45%] top-[75%] -translate-x-1/2 -translate-y-1/2 p-3 rounded-2xl border-2 transition-all text-left shadow-lg group z-10 min-h-[44px]',
                      isCrit
                        ? 'border-red-500 bg-red-950/80'
                        : stats.daysRemaining <= 5
                        ? 'border-amber-500 bg-amber-950/70'
                        : 'border-emerald-500/80 bg-slate-900/90',
                      isSelected && 'ring-4 ring-indigo-500/50 scale-105'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <span className="font-bold text-xs text-white">City General (Charminar)</span>
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5">
                      Buffer: {stats.daysRemaining} Days &bull; {getDistanceFromWarehouse(f)} km
                    </div>
                  </button>
                );
              })()}

              {/* Node 5: PHC Shamshabad */}
              {(() => {
                const f = facilities.find((p) => p.hospitalId === 'phc-shamshabad');
                if (!f) return null;
                const stats = getFacilityShortageScore(f);
                const isCrit = stats.daysRemaining <= 2;
                const isSelected = selectedFacility?.hospitalId === f.hospitalId;

                return (
                  <button
                    type="button"
                    key={f.hospitalId}
                    onClick={() => setSelectedFacility(f)}
                    className={cn(
                      'absolute left-[82%] top-[80%] -translate-x-1/2 -translate-y-1/2 p-3.5 rounded-2xl border-2 transition-all text-left shadow-xl group z-10 min-h-[44px]',
                      isCrit
                        ? 'border-red-500 bg-red-950/95 shadow-red-500/40'
                        : stats.daysRemaining <= 5
                        ? 'border-amber-500 bg-amber-950/80'
                        : 'border-emerald-500/80 bg-slate-900/90',
                      isSelected && 'ring-4 ring-indigo-500/50 scale-105'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-red-500 animate-pulse" />
                      <span className="font-extrabold text-xs text-white">PHC Shamshabad</span>
                    </div>
                    <div className="text-[10px] text-red-200 font-black mt-0.5">
                      SOS Alert: {stats.daysRemaining}d Stock Left &bull; {getDistanceFromWarehouse(f)} km
                    </div>
                  </button>
                );
              })()}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span>Click node to view facility diagnostics and initiate buffer dispatch</span>
              <span className="font-mono text-slate-500">Live GPS Vector Active</span>
            </div>
          </div>

          {/* Detailed Facility Telemetry & Shortage Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            {selectedFacility ? (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Facility Diagnostic Telemetry
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
                      {selectedFacility.hospitalId.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                    {selectedFacility.hospitalName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tier: {selectedFacility.tier.toUpperCase()} &bull; Transit Distance: ~{getDistanceFromWarehouse(selectedFacility)} km
                  </p>
                </div>

                {/* Depletion Level Bar */}
                {(() => {
                  const stats = getFacilityShortageScore(selectedFacility);
                  const isCrit = stats.daysRemaining <= 2;

                  return (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          {selectedMedicineId === 'ALL' ? 'Worst Runout Buffer' : 'Selected Medicine Runout'}
                        </span>
                        <span className={cn('font-bold', isCrit ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white')}>
                          {stats.daysRemaining > 90 ? '90+ Days' : `${stats.daysRemaining} Days Left`}
                        </span>
                      </div>

                      {/* Depletion Progress Bar */}
                      <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-500',
                            isCrit ? 'bg-red-600' : stats.daysRemaining <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                          )}
                          style={{ width: `${Math.max(10, Math.min(100, 100 - stats.daysRemaining * 10))}%` }}
                        />
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Depletion Index: {stats.score}%</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.worstMedicineName}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Stock Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Critical Medicine Status:</span>
                    <span className="text-[11px] text-slate-400">
                      {selectedFacility.medicines.filter((m) => m.status === 'critical').length} Critical SKUs
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedFacility.medicines.map((m) => {
                      const isItemCrit = m.status === 'critical';
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            'p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2',
                            isItemCrit
                              ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                          )}
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold">{m.name}</div>
                            <div className="text-[10px] text-slate-500">
                              Stock: {m.currentStock} {m.unit} &bull; Burn: {m.dailyConsumption}/day
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className={cn('font-bold', isItemCrit ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300')}>
                              {m.daysRemaining > 90 ? '90+d' : `${m.daysRemaining}d`}
                            </div>
                            {isItemCrit && (
                              <button
                                type="button"
                                onClick={() => onTriggerRebalance(selectedFacility.hospitalId, m.id)}
                                className="mt-1 px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold transition-colors min-h-[30px]"
                              >
                                Rebalance
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedFacility.tier !== 'warehouse' && (
                  <button
                    type="button"
                    onClick={() => {
                      const worstMed = selectedFacility.medicines.find((m) => m.status === 'critical') || selectedFacility.medicines[0];
                      if (worstMed) onTriggerRebalance(selectedFacility.hospitalId, worstMed.id);
                    }}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors min-h-[44px] flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Truck className="h-4 w-4" />
                    Dispatch Emergency Warehouse Replenishment
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                Select a facility on the heat map to inspect real-time shortage diagnostics.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── VIEW 2: FACILITY × MEDICINE INTENSITY MATRIX ─────────────────────── */}
      {viewMode === 'matrix' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                Facility &times; Medicine Depletion Intensity Matrix
              </h4>
              <p className="text-xs text-slate-500">
                Cross-facility stock runout days. Red cells indicate acute shortage (&le; 3 days of safe reserve).
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">5 Facilities &times; 10 Essential SKUs</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                  <th className="py-3 px-3 min-w-[200px]">Facility Node</th>
                  <th className="py-3 px-2 text-center">Tier</th>
                  {medicineList.map((m) => (
                    <th key={m.id} className="py-3 px-2 text-center min-w-[90px]">
                      {m.name.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {facilities.map((fac) => (
                  <tr key={fac.hospitalId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{fac.hospitalName}</div>
                      <div className="text-[10px] text-slate-400">
                        {fac.district} &bull; Beds: {fac.bedsOccupied}/{fac.bedsTotal}
                      </div>
                    </td>

                    <td className="py-3 px-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                        {fac.tier.replace('_', ' ')}
                      </span>
                    </td>

                    {medicineList.map((m) => {
                      const item = fac.medicines.find((med) => med.id === m.id);
                      if (!item) return <td key={m.id} className="py-3 px-2 text-center text-slate-300">-</td>;
                      const days = item.daysRemaining;
                      const isCrit = days <= 3;
                      const isLow = days <= 7;

                      return (
                        <td key={m.id} className="py-3 px-2 text-center">
                          <span
                            className={cn(
                              'px-2 py-1 rounded-lg font-mono font-bold text-xs inline-block min-w-[40px]',
                              fac.tier === 'warehouse'
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                : isCrit
                                ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                                : isLow
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            )}
                          >
                            {days > 90 ? '90+' : `${days}d`}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
