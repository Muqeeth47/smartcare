'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Footer } from '@/components/layout/Shell';
import { useSession, useAppStore } from '@/lib/store/app-store';
import { DemoDB } from '@/lib/db/demo-db';
import { cn } from '@/lib/utils';
import type { AmbulanceBooking } from '@smartcare/types';
import {
  Siren,
  MapPin,
  Crosshair,
  PhoneCall,
  Navigation,
  Clock,
  ShieldCheck,
  Ban,
  Activity,
  HeartPulse,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Lock,
  Check,
} from 'lucide-react';

const VEHICLE_TIERS = [
  {
    id: 'ALS' as const,
    label: 'Advanced Life Support / ICU (ALS)',
    badge: 'Recommended for Emergencies',
    price: 1800,
    eta: '6–8 mins',
    desc: 'Ventilator, multipara cardiac monitor, defibrillator, and trained emergency doctor onboard.',
    highlight: true,
  },
  {
    id: 'BLS' as const,
    label: 'Basic Life Support (BLS)',
    badge: 'Standard Ambulance',
    price: 750,
    eta: '9–12 mins',
    desc: 'Oxygen cylinder, vital monitor, spine board, and certified paramedic team.',
    highlight: false,
  },
  {
    id: 'PatientTransport' as const,
    label: 'Patient Transport Vehicle',
    badge: 'Non-Emergency',
    price: 500,
    eta: '12–15 mins',
    desc: 'Non-emergency transfers, dialysis appointments, wheelchair ramp, and basic stretcher support.',
    highlight: false,
  },
];

export function AmbulancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { email } = useSession();
  const showToast = useAppStore((s) => s.showToast);

  const initialTier = (searchParams.get('tier') as 'BLS' | 'ALS' | 'PatientTransport') || 'ALS';
  const [selectedType, setSelectedType] = useState<'BLS' | 'ALS' | 'PatientTransport'>(
    ['BLS', 'ALS', 'PatientTransport'].includes(initialTier) ? initialTier : 'ALS'
  );

  const handleTypeChange = (tier: 'BLS' | 'ALS' | 'PatientTransport') => {
    setSelectedType(tier);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tier', tier);
    router.replace(`/ambulance?${params.toString()}`, { scroll: false });
  };

  const [activeBooking, setActiveBooking] = useState<AmbulanceBooking | null>(null);
  const [pickupAddress, setPickupAddress] = useState('Gachibowli Ring Road, Hyderabad');
  const [callerName, setCallerName] = useState(email ? email.split('@')[0] : 'Emergency Patient');
  const [callerPhone, setCallerPhone] = useState('+91 98765 43210');
  const [destHospital, setDestHospital] = useState('SmartCare Community Hospital');
  const [gpsStatus, setGpsStatus] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  useEffect(() => {
    const current = DemoDB.getActiveAmbulance();
    setActiveBooking(current);

    const handleDispatched = (e: any) => setActiveBooking(e.detail);
    const handleCancelled = () => setActiveBooking(null);

    window.addEventListener('smartcare:ambulance-dispatched', handleDispatched);
    window.addEventListener('smartcare:ambulance-cancelled', handleCancelled);

    return () => {
      window.removeEventListener('smartcare:ambulance-dispatched', handleDispatched);
      window.removeEventListener('smartcare:ambulance-cancelled', handleCancelled);
    };
  }, []);

  const handleDetectGps = () => {
    setIsLocating(true);
    setGpsStatus('Detecting satellite coordinates...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          setGpsStatus(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (Accurate to 15m)`);
          setPickupAddress('Near Gachibowli Outer Ring Road, Hyderabad (GPS Verified)');
          showToast('GPS location verified with dispatch station', 'success');
        },
        () => {
          setIsLocating(false);
          setGpsStatus('Address set via local network location.');
          setPickupAddress('Financial District Road No. 2, Hyderabad');
          showToast('Using verified network location', 'info');
        },
        { timeout: 6000 }
      );
    } else {
      setIsLocating(false);
      setGpsStatus('GPS not available. Please confirm address manually.');
    }
  };

  const handleDispatch = () => {
    if (!pickupAddress.trim()) {
      showToast('Please enter an emergency pickup location.', 'error');
      return;
    }

    setIsDispatching(true);
    setTimeout(() => {
      const booking = DemoDB.bookAmbulance({
        type: selectedType,
        pickupAddress,
        patientName: callerName || 'Emergency Patient',
        patientPhone: callerPhone || '+91 98765 43210',
        hospital: destHospital,
      });
      setActiveBooking(booking);
      setIsDispatching(false);
      showToast('Ambulance dispatched! Paramedic Ram Singh is en route.', 'success');
    }, 600);
  };

  const handleCancelAmbulance = () => {
    if (!activeBooking) return;
    if (confirm('Are you sure you want to cancel this ambulance dispatch?')) {
      DemoDB.cancelAmbulance(activeBooking.id, 'Cancelled by patient');
      setActiveBooking(null);
      showToast('Ambulance dispatch cancelled.', 'info');
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--surface-sunken)]">
      <Topbar variant="landing" />

      <main className="flex-1 max-w-5xl mx-auto w-full py-6 sm:py-10 px-4 sm:px-6 space-y-6">
        {/* Headline */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
            <Zap size={14} className="animate-pulse" /> 24/7 SmartCare Emergency Trauma Fleet
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight">
            Book an Emergency Ambulance
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            Instant GPS dispatch. Paramedic-equipped vehicles matched with nearest emergency hospital trauma units.
          </p>
        </div>

        {activeBooking && activeBooking.status === 'dispatched' ? (
          /* Live Dispatch Tracking View */
          <div className="bg-[var(--surface)] border-2 border-rose-300 rounded-3xl p-5 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--line)]">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Siren size={26} className="animate-bounce" />
                </span>
                <div>
                  <span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-rose-600 text-white uppercase tracking-wider">
                    Vehicle Dispatched &amp; En Route
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--ink)] mt-1">
                    {activeBooking.typeLabel}
                  </h2>
                </div>
              </div>
              <div className="sm:text-right bg-rose-50/60 p-3 sm:p-0 rounded-xl sm:bg-transparent">
                <span className="text-xs text-[var(--muted)] block font-medium">Estimated Arrival</span>
                <strong className="text-2xl sm:text-3xl font-extrabold text-rose-600">
                  ~{activeBooking.etaMinutes} mins
                </strong>
              </div>
            </div>

            {/* Live Progress Visualizer */}
            <div className="bg-[var(--surface-sunken)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm font-semibold text-[var(--ink)]">
                <span className="flex items-center gap-1.5 text-rose-600">
                  <Navigation size={15} /> Fleet Dispatch Station
                </span>
                <span className="flex items-center gap-1.5 text-[var(--muted)]">
                  <MapPin size={15} /> {activeBooking.pickupAddress}
                </span>
                <span className="flex items-center gap-1.5 text-[var(--teal)]">
                  <Building2 size={15} /> {activeBooking.hospital} (ICU Ready)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full w-[65%] animate-pulse" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-[11px] text-[var(--muted)] font-medium">
                <span>Trauma Team Pre-Alerted</span>
                <span>Distance: ~3.2 km</span>
                <span className="text-emerald-600 font-bold">● Trauma Bed Reserved</span>
              </div>
            </div>

            {/* Details Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-[var(--surface-sunken)]/60 border border-[var(--line)] rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block">
                  Assigned Driver &amp; EMT
                </span>
                <strong className="text-sm sm:text-base font-extrabold text-[var(--ink)] block">
                  {activeBooking.driver.name}
                </strong>
                <a
                  href={`tel:${activeBooking.driver.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--mint)] text-[var(--teal)] hover:bg-[var(--teal)] hover:text-white transition-colors"
                >
                  <PhoneCall size={13} />
                  <span>Call Driver Now</span>
                </a>
              </div>

              <div className="bg-[var(--surface-sunken)]/60 border border-[var(--line)] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block">
                  Emergency Vehicle
                </span>
                <strong className="text-sm sm:text-base font-extrabold text-[var(--ink)] block">
                  {activeBooking.driver.vehicleNo}
                </strong>
                <p className="text-xs text-[var(--muted)]">{activeBooking.driver.vehicleModel}</p>
              </div>

              <div className="bg-[var(--surface-sunken)]/60 border border-[var(--line)] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block">
                  Destination Trauma Center
                </span>
                <strong className="text-sm sm:text-base font-extrabold text-[var(--ink)] block">
                  {activeBooking.hospital}
                </strong>
                <span className="text-xs font-bold text-emerald-600 block">
                  ● 1 ICU Trauma Bed Reserved
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={handleCancelAmbulance}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors min-h-[48px]"
              >
                <Ban size={15} />
                <span>Cancel Ambulance Dispatch</span>
              </button>

              <Link
                href="/dashboard/hospital"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[var(--surface-sunken)] text-[var(--ink)] hover:bg-[var(--surface)] border border-[var(--line)] transition-colors min-h-[48px]"
              >
                <Activity size={16} className="text-[var(--teal)]" />
                <span>View Hospital Emergency Room</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Booking Form Card */
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 sm:p-8 shadow-sm space-y-6">
            {/* Step 1: Location */}
            <div className="space-y-3 pb-5 border-b border-[var(--line)]">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-extrabold text-[var(--ink)] flex items-center gap-2">
                  <MapPin size={18} className="text-rose-600" />
                  <span>1. Confirm Emergency Pickup Location</span>
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={isLocating}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors min-h-[48px] shadow-xs cursor-pointer"
                >
                  <Crosshair size={16} className={isLocating ? 'animate-spin' : ''} />
                  <span>Use My Current GPS Location</span>
                </button>
                {gpsStatus && (
                  <span className="text-xs text-[var(--muted)] font-medium">
                    {gpsStatus}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">
                  Pickup Street Address / Landmark
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="e.g. Near Gachibowli Ring Road, Hyderabad"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[16px] text-[var(--ink)] focus:outline-none focus:border-rose-500 transition-colors min-h-[48px]"
                />
              </div>
            </div>

            {/* Step 2: Vehicle Tier Selection */}
            <div className="space-y-3 pb-5 border-b border-[var(--line)]">
              <h2 className="text-base sm:text-lg font-extrabold text-[var(--ink)] flex items-center gap-2">
                <Siren size={18} className="text-rose-600" />
                <span>2. Select Emergency Vehicle Tier</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {VEHICLE_TIERS.map((tier) => {
                  const isSelected = selectedType === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => handleTypeChange(tier.id)}
                      className={cn(
                        'text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer min-h-[48px]',
                        isSelected
                          ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm'
                          : 'border-[var(--line)] bg-[var(--surface)] hover:border-slate-300'
                      )}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider',
                              tier.highlight
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200'
                                : 'bg-[var(--surface-sunken)] text-[var(--muted)]'
                            )}
                          >
                            {tier.badge}
                          </span>
                          <span className="text-xs font-bold text-rose-600">
                            ~{tier.eta}
                          </span>
                        </div>
                        <strong className="text-sm font-extrabold text-[var(--ink)] block">
                          {tier.label}
                        </strong>
                        <p className="text-xs text-[var(--muted)] leading-relaxed">
                          {tier.desc}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[var(--line)] flex items-center justify-between font-extrabold">
                        <span className="text-sm text-[var(--ink)]">₹{tier.price}</span>
                        <span className={cn('text-xs font-bold inline-flex items-center gap-1', isSelected ? 'text-rose-600' : 'text-[var(--muted)]')}>
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-rose-600" />
                              Selected
                            </>
                          ) : (
                            'Select'
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Contact & Destination */}
            <div className="space-y-4">
              <h2 className="text-base sm:text-lg font-extrabold text-[var(--ink)] flex items-center gap-2">
                <HeartPulse size={18} className="text-rose-600" />
                <span>3. Patient Details &amp; Destination Hospital</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">
                    Patient / Caller Name
                  </label>
                  <input
                    type="text"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    placeholder="Patient or Caller Name"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[16px] text-[var(--ink)] focus:outline-none focus:border-rose-500 min-h-[48px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">
                    Emergency Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={callerPhone}
                    onChange={(e) => setCallerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[16px] text-[var(--ink)] focus:outline-none focus:border-rose-500 min-h-[48px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">
                  Preferred Destination Trauma Hospital
                </label>
                <select
                  value={destHospital}
                  onChange={(e) => setDestHospital(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm font-semibold text-[var(--ink)] focus:outline-none focus:border-rose-500 min-h-[48px] cursor-pointer"
                >
                  <option value="SmartCare Community Hospital">
                    SmartCare Community Hospital (4 ICU beds available · 3.2 km)
                  </option>
                  <option value="CityCare Trauma Centre">
                    CityCare Trauma Centre (2 ICU beds · 4.8 km)
                  </option>
                  <option value="Apollo Emergency Hospital">
                    Apollo Emergency Hospital (5 ICU beds · 6.1 km)
                  </option>
                </select>
              </div>

              {/* Action dock */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-[var(--line)]">
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <Lock size={14} className="text-emerald-600 shrink-0" />
                  <span>Zero prepayment required · Pre-authorized emergency trauma dispatch</span>
                </div>

                <button
                  type="button"
                  onClick={handleDispatch}
                  disabled={isDispatching}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-md hover:shadow-lg min-h-[48px] cursor-pointer uppercase tracking-wider"
                >
                  <Siren size={18} className={isDispatching ? 'animate-spin' : ''} />
                  <span>{isDispatching ? 'Dispatching Nearest Unit...' : 'Dispatch Ambulance Now'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
