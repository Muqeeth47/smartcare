'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PatientShell } from '@/components/layout/Shell';
import { usePatient, useAppStore, useSession, CARE_TEAM, getAppointmentSlots } from '@/lib/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { DemoDB } from '@/lib/db/demo-db';
import {
  HeartPulse,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Search,
  LocateFixed,
  Crosshair,
  Map as MapIcon,
  List as ListIcon,
  MapPin,
  ExternalLink,
  CalendarPlus,
  LayoutDashboard,
  Stethoscope,
  Heart,
  Baby,
  ShieldAlert,
  ClipboardList,
  Copy,
  CreditCard,
  Smartphone,
  Building,
  Wallet,
  Lock,
  ShieldCheck,
  QrCode,
  Info,
  X,
  Plus,
  Clock,
  FlaskConical,
  Navigation,
} from 'lucide-react';
import type { PatientVisit } from '@smartcare/types';

interface CentreListing {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  openingHours: string;
  source: 'SmartCare Care Network' | 'OpenStreetMap';
  distance?: number;
}

const DEFAULT_CENTRES: CentreListing[] = [
  { id: 'sc-1', name: 'SmartCare Community Hospital', lat: 17.4126, lng: 78.4482, type: 'General hospital', openingHours: '24/7', source: 'SmartCare Care Network' },
  { id: 'sc-2', name: 'Apollo Health City', lat: 17.4239, lng: 78.4101, type: 'Multi-speciality hospital', openingHours: '24/7', source: 'OpenStreetMap' },
  { id: 'sc-3', name: 'Care Hospital Banjara Hills', lat: 17.4185, lng: 78.4489, type: 'Super speciality centre', openingHours: '24/7', source: 'OpenStreetMap' },
  { id: 'sc-4', name: 'Yashoda Hospital Secunderabad', lat: 17.4399, lng: 78.4983, type: 'General hospital', openingHours: '24/7', source: 'OpenStreetMap' },
  { id: 'sc-5', name: 'Rainbow Children’s Clinic', lat: 17.4150, lng: 78.4420, type: 'Paediatric clinic', openingHours: '08:00–21:00', source: 'OpenStreetMap' },
  { id: 'sc-6', name: 'Continental Care Centre', lat: 17.4190, lng: 78.3470, type: 'Care centre', openingHours: '24/7', source: 'OpenStreetMap' },
];

const COMMON_SYMPTOMS = [
  'Fever',
  'Cold & cough',
  'Stomach pain',
  'Headache',
  'Fatigue',
  'Routine check-up',
];

const STEPS = ['Profile', 'Find care', 'Visit details', 'Confirmed'];

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radians = Math.PI / 180;
  const dLat = (b.lat - a.lat) * radians;
  const dLng = (b.lng - a.lng) * radians;
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

interface BookingWizardProps {
  step: number;
}

export function BookingWizard({ step: initialStep }: BookingWizardProps) {
  const router = useRouter();
  const { patientData, userCoords } = usePatient();
  const { email, isLogged } = useSession();
  const { setStep, updatePatientData, setUserCoords, recordPatientVisit, showToast } = useAppStore(
    useShallow((s) => ({
      setStep: s.setStep,
      updatePatientData: s.updatePatientData,
      setUserCoords: s.setUserCoords,
      recordPatientVisit: s.recordPatientVisit,
      showToast: s.showToast,
    }))
  );

  const currentStep = initialStep || 1;

  // Local draft status
  const [draftStatus, setDraftStatus] = useState<'Saved just now' | 'Saving...'>('Saved just now');
  const [validationError, setValidationError] = useState<string>('');

  // Step 2 state
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStatus, setMapStatus] = useState('Choose auto-detect or search an area.');
  const [mapMode, setMapMode] = useState<'map' | 'list'>('map');
  const [careFilter, setCareFilter] = useState<'all' | 'hospital' | 'clinic'>('all');
  const [locating, setLocating] = useState(false);
  const [hospitals, setHospitals] = useState<CentreListing[]>([]);

  // Step 3 state
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(
    new Set(patientData.symptomSelections || [])
  );
  const [customTags, setCustomTags] = useState<string[]>(patientData.customSymptomTags || []);
  const [customSymptomInput, setCustomSymptomInput] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState(patientData.customSymptoms || '');
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Step 4 state
  const [bookingId, setBookingId] = useState<string>('');
  const [isPaid, setIsPaid] = useState(false);
  const [paymentTxn, setPaymentTxn] = useState('TXN-SC-748921');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTab, setPaymentTab] = useState<'upi' | 'card' | 'netbanking' | 'counter'>('upi');
  const [paymentDoneView, setPaymentDoneView] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const appointmentSlots = useMemo(() => getAppointmentSlots(), []);
  const departments = useMemo(() => Array.from(new Set(CARE_TEAM.map((m) => m.department))), []);

  const departmentDoctors = useMemo(() => {
    const dept = patientData.department || departments[0];
    return CARE_TEAM.filter((m) => m.department === dept);
  }, [patientData.department, departments]);

  const currentDoctor = useMemo(() => {
    return departmentDoctors.find((m) => m.id === patientData.doctorId) || departmentDoctors[0];
  }, [departmentDoctors, patientData.doctorId]);

  const currentSlot = useMemo(() => {
    return (
      appointmentSlots.find(
        (s) => s.date === patientData.appointmentDate && s.slot === patientData.appointmentSlot
      ) || appointmentSlots[0]
    );
  }, [appointmentSlots, patientData.appointmentDate, patientData.appointmentSlot]);

  // Sync route with store step
  useEffect(() => {
    if (initialStep >= 1 && initialStep <= 4) {
      setStep(initialStep);
    }
  }, [initialStep, setStep]);

  // Initialize initial department and clinician if not set
  useEffect(() => {
    if (!patientData.department && departments.length) {
      updatePatientData('department', departments[0]);
    }
    if (!patientData.doctorId && departmentDoctors.length) {
      updatePatientData('doctorId', departmentDoctors[0].id);
      updatePatientData('doctorName', departmentDoctors[0].name);
      updatePatientData('doctorPref', departmentDoctors[0].name);
    }
    if (!patientData.appointmentSlot && appointmentSlots.length) {
      updatePatientData('appointmentDate', appointmentSlots[0].date);
      updatePatientData('appointmentSlot', appointmentSlots[0].slot);
    }
    if (!patientData.consultationType) {
      updatePatientData('consultationType', 'In-person consultation');
    }
    if (!patientData.hospital) {
      updatePatientData('hospital', 'SmartCare Community Hospital');
    }
  }, [departments, departmentDoctors, appointmentSlots, patientData, updatePatientData]);

  // Populate centres with distances based on current coordinates
  useEffect(() => {
    const baseCoords = userCoords || { lat: 17.4126, lng: 78.4482 };
    const mapped = DEFAULT_CENTRES.map((c) => ({
      ...c,
      distance: distanceKm(baseCoords, c),
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    setHospitals(mapped);
  }, [userCoords]);

  // Load payment status for step 4
  useEffect(() => {
    if (currentStep === 4) {
      const storedId = typeof window !== 'undefined' ? window.localStorage.getItem('smartcare.lastBookingId') : null;
      const recentId = bookingId || storedId || 'SC-DEMO8924';
      setBookingId(recentId);
      const paidStatus = window.localStorage.getItem(`smartcare.payment.${recentId}`) === 'paid';
      const txn = window.localStorage.getItem(`smartcare.payment_txn.${recentId}`) || 'TXN-SC-748921';
      setIsPaid(paidStatus);
      setPaymentTxn(txn);
    }
  }, [currentStep, bookingId]);

  // Mark draft saved indicator helper
  const markDraft = () => {
    setDraftStatus('Saving...');
    setTimeout(() => setDraftStatus('Saved just now'), 350);
  };

  const goToStep = (s: number) => {
    setStep(s);
    router.push(`/dashboard/patient/apply/${s}`);
  };

  // Demo fillers
  const loadDemo = () => {
    if (currentStep === 1) {
      updatePatientData('name', 'Asha Rao');
      updatePatientData('age', '32');
      updatePatientData('doctorPref', 'General consultation');
      setValidationError('');
      markDraft();
      showToast('Profile demo loaded (Asha Rao, 32)', 'info');
    } else if (currentStep === 2) {
      updatePatientData('hospital', 'SmartCare Community Hospital');
      updatePatientData('city', 'Hyderabad');
      updatePatientData('state', 'Telangana');
      updatePatientData('country', 'India');
      setValidationError('');
      markDraft();
      showToast('Care centre demo loaded (SmartCare Community Hospital)', 'info');
    } else if (currentStep === 3) {
      const s = new Set(selectedSymptoms);
      s.add('Fever');
      s.add('Routine check-up');
      setSelectedSymptoms(s);
      updatePatientData('symptomSelections', Array.from(s));
      updatePatientData('symptoms', 'Fever; Routine check-up');
      setValidationError('');
      markDraft();
      showToast('Visit demo details filled', 'info');
    }
  };

  // Step 1 Validation & Submit
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (patientData.name || '').trim();
    const age = Number(patientData.age);
    if (!name || name.length < 2) {
      setValidationError('Enter your full name using at least 2 characters.');
      return;
    }
    if (!patientData.age || !Number.isInteger(age) || age < 1 || age > 120) {
      setValidationError('Enter a whole-number age between 1 and 120.');
      return;
    }
    setValidationError('');
    goToStep(2);
  };

  // Step 2 Device Location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setMapStatus('Location not available in this browser. Search for a city instead.');
      return;
    }
    setLocating(true);
    setMapStatus('Requesting device location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserCoords({ lat, lng });
        updatePatientData('city', 'Hyderabad');
        updatePatientData('state', 'Telangana');
        updatePatientData('country', 'India');
        setLocating(false);
        setMapStatus('Location detected. Showing nearby care centres.');
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 13);
        }
      },
      () => {
        setLocating(false);
        setMapStatus('Location permission denied. Search for a city instead.');
      }
    );
  };

  // Step 2 Search Location
  const handleLocationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setValidationError('Enter a city, neighbourhood or PIN code first.');
      return;
    }
    setValidationError('');
    setMapStatus(`Finding care centres near ${searchQuery}...`);
    updatePatientData('city', searchQuery);
    setTimeout(() => {
      setMapStatus(`6 centres found near ${searchQuery}.`);
    }, 400);
  };

  // Step 2 Select Hospital
  const handleSelectHospital = (h: CentreListing) => {
    updatePatientData('hospital', h.name);
    setValidationError('');
    markDraft();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([h.lat, h.lng], 14);
    }
  };

  // Step 2 Map Initialization via CDN Leaflet
  useEffect(() => {
    if (currentStep !== 2) return;
    let active = true;

    function initMap() {
      if (!active || !mapContainerRef.current || !window.L) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }

      const centerCoords: [number, number] = userCoords
        ? [userCoords.lat, userCoords.lng]
        : [17.4126, 78.4482];

      const map = window.L.map(mapContainerRef.current, {
        center: centerCoords,
        zoom: 13,
        zoomControl: true,
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add user location pin
      const userIcon = window.L.divIcon({
        className: 'smartcare-user-marker',
        iconSize: [22, 22],
        html: '<span style="display:block;width:16px;height:16px;border-radius:50%;background:#0f5ca8;border:3px solid #fff;box-shadow:0 0 0 4px rgba(15,92,168,0.25);"></span>',
      });
      window.L.marker(centerCoords, { icon: userIcon }).bindPopup('Your location').addTo(map);

      // Add hospital markers
      markersRef.current = [];
      hospitals.forEach((h, index) => {
        const markerIcon = window.L.divIcon({
          className: 'smartcare-hospital-marker',
          iconSize: [32, 32],
          html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#0a3b69;color:#fff;font-size:12px;font-weight:800;border:2px solid #fff;box-shadow:0 3px 10px rgba(10,59,105,0.3);cursor:pointer;">${index + 1}</div>`,
        });
        const marker = window.L.marker([h.lat, h.lng], { icon: markerIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:inherit;padding:4px 2px;">
            <strong style="display:block;color:#0a3b69;font-size:13px;line-height:1.2;">${h.name}</strong>
            <span style="display:block;color:#64748b;font-size:11px;margin-top:2px;">${h.type} · ${h.openingHours}</span>
            <span style="display:block;color:#0f5ca8;font-size:11px;font-weight:700;margin-top:3px;">${(h.distance || 1.8).toFixed(1)} km straight-line</span>
          </div>
        `);
        marker.on('click', () => handleSelectHospital(h));
        markersRef.current.push({ marker, hospital: h });
      });

      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 200);
    }

    if (window.L) {
      initMap();
    } else {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => initMap();
        document.head.appendChild(script);
      }
    }

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [currentStep, userCoords, hospitals]);

  // Step 3 Symptoms toggle
  const toggleSymptom = (sym: string) => {
    const next = new Set(selectedSymptoms);
    if (next.has(sym)) next.delete(sym);
    else next.add(sym);
    setSelectedSymptoms(next);
    syncSymptoms(next, customTags, additionalNotes);
  };

  const addCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = customSymptomInput.trim();
    if (!tag) return;
    if (customTags.includes(tag)) {
      setValidationError('Custom symptom already added.');
      return;
    }
    if (customTags.length >= 8) {
      setValidationError('Maximum 8 custom symptom tags allowed.');
      return;
    }
    const next = [...customTags, tag];
    setCustomTags(next);
    setCustomSymptomInput('');
    setValidationError('');
    syncSymptoms(selectedSymptoms, next, additionalNotes);
  };

  const removeCustomTag = (tag: string) => {
    const next = customTags.filter((t) => t !== tag);
    setCustomTags(next);
    syncSymptoms(selectedSymptoms, next, additionalNotes);
  };

  const syncSymptoms = (syms: Set<string>, tags: string[], notes: string) => {
    const all = [...Array.from(syms), ...tags, notes.trim()].filter(Boolean).join('; ');
    updatePatientData('symptomSelections', Array.from(syms));
    updatePatientData('customSymptomTags', tags);
    updatePatientData('customSymptoms', notes);
    updatePatientData('symptoms', all);
    markDraft();
  };

  // Step 3 Review & Reservation
  const handleReviewStep = () => {
    if (!patientData.symptoms?.trim() && !selectedSymptoms.size && !customTags.length && !additionalNotes.trim()) {
      setValidationError('Select at least one symptom or describe your reason for visit.');
      return;
    }
    setValidationError('');
    setShowReviewModal(true);
  };

  const handleConfirmReservation = async () => {
    setShowReviewModal(false);
    try {
      const slot = currentSlot;
      const refId = await DemoDB.addPatient({
        ...patientData,
        doctorName: currentDoctor.name,
        department: patientData.department || currentDoctor.department,
        appointmentDate: slot.date,
        appointmentSlot: slot.slot,
        patientEmail: email,
        fee: 125,
        triage: 'Unassessed',
        demoMirrored: true,
      });

      const visit: PatientVisit = {
        id: refId,
        hospital: patientData.hospital || 'SmartCare Community Hospital',
        city: patientData.city || 'Hyderabad',
        reason: patientData.symptoms || 'General consultation',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: 'Booked',
        reference: refId,
        department: patientData.department,
        doctorName: currentDoctor.name,
        consultationType: patientData.consultationType,
        appointmentDate: slot.date,
        appointmentSlot: slot.slot,
      };

      recordPatientVisit(visit);
      setBookingId(refId);
      if (typeof window !== 'undefined') window.localStorage.setItem('smartcare.lastBookingId', refId);
      showToast('Care reservation confirmed!', 'success');
      goToStep(4);
    } catch {
      showToast('Booking failed. Please retry.', 'error');
    }
  };

  // Copy reference token
  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(bookingId || 'SC-DEMO8924');
      setCopiedToken(true);
      showToast('Reservation token copied!', 'success');
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  // Payment simulation actions
  const completeSimulatedPayment = () => {
    const txn = `TXN-SC-${Math.floor(100000 + Math.random() * 900000)}`;
    window.localStorage.setItem(`smartcare.payment.${bookingId}`, 'paid');
    window.localStorage.setItem(`smartcare.payment_txn.${bookingId}`, txn);
    setIsPaid(true);
    setPaymentTxn(txn);
    setPaymentDoneView(true);
    showToast('Payment settled in simulation!', 'success');
  };

  // Filtered hospital listings
  const filteredHospitals = hospitals.filter((h) => {
    if (careFilter === 'all') return true;
    return h.type.toLowerCase().includes(careFilter);
  });

  const demoButtonLabel = () => {
    if (currentStep === 1) return 'Fill profile demo';
    if (currentStep === 2) return 'Fill care demo';
    if (currentStep === 3) return patientData.symptoms ? 'Demo visit filled' : 'Fill visit demo';
    return 'Demo complete';
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    bookingId || 'SC-DEMO8924'
  )}`;

  return (
    <PatientShell subtitle="Care reservation" backHref="/dashboard/patient">
      <div className="patient-application-shell">
        <section className="compact-flow-card" data-section="patient-application">
          {/* Header & Eyebrow */}
          <div className="compact-flow-header">
            <div className="flow-header-content">
              <div className="flow-header-eyebrow">
                <span className="eyebrow eyebrow-dark">
                  <span className="eyebrow-dot"></span> Care reservation
                </span>
                <span className="step-pill">Step {currentStep} of 4</span>
              </div>
              <h1>
                {currentStep === 1 && 'Tell us a little about you'}
                {currentStep === 2 && 'Choose your care centre'}
                {currentStep === 3 && 'Visit details & clinician'}
                {currentStep === 4 && "You're on the care list"}
              </h1>
              <p>
                {currentStep === 1 && 'Quick essentials so the medical team is prepared.'}
                {currentStep === 2 && 'Locate nearby hospitals and clinics.'}
                {currentStep === 3 && 'Select clinician, preferred slot, and consultation reason.'}
                {currentStep === 4 && 'Digital appointment ticket generated. Keep this reference for check-in.'}
              </p>
            </div>
            <div className="flow-header-actions">
              <span id="draft-status" className="draft-note" role="status" aria-live="polite">
                {draftStatus}
              </span>
              <button
                id="patient-demo"
                className="btn-secondary btn-icon btn-compact demo-trigger-btn"
                type="button"
                onClick={loadDemo}
                disabled={currentStep === 4}
              >
                <Sparkles size={14} />
                <span>{demoButtonLabel()}</span>
              </button>
            </div>
          </div>

          {/* Stepper */}
          <div className="stepper-compact" aria-label="Application progress">
            {STEPS.map((label, index) => {
              const stepNum = index + 1;
              const isDone = currentStep > stepNum;
              const isActive = currentStep === stepNum;
              return (
                <div
                  key={label}
                  className={`step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                >
                  <span className="step-number">
                    {isDone ? <Check size={12} strokeWidth={3} /> : stepNum}
                  </span>
                  <span className="step-label">{label}</span>
                </div>
              );
            })}
          </div>

          {/* Inline validation alert */}
          {validationError && (
            <div className="inline-error p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <Info size={14} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: Profile */}
          {currentStep === 1 && (
            <form onSubmit={handleProfileSubmit} noValidate>
              <div className="form-grid profile-grid">
                <div className="field">
                  <label htmlFor="patient-name">
                    Full name <span>*</span>
                  </label>
                  <input
                    id="patient-name"
                    autoComplete="name"
                    minLength={2}
                    maxLength={80}
                    value={patientData.name || ''}
                    onChange={(e) => {
                      setValidationError('');
                      updatePatientData('name', e.target.value);
                      markDraft();
                    }}
                    placeholder="e.g. Asha Rao"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="patient-age">
                    Age <span>*</span>
                  </label>
                  <input
                    id="patient-age"
                    type="number"
                    min={1}
                    max={120}
                    step={1}
                    inputMode="numeric"
                    value={patientData.age || ''}
                    onChange={(e) => {
                      setValidationError('');
                      updatePatientData('age', e.target.value);
                      markDraft();
                    }}
                    placeholder="e.g. 32"
                    required
                  />
                </div>
                <fieldset className="field full">
                  <legend>
                    Preferred care type <span>*</span>
                  </legend>
                  <div className="choice-grid compact-choice-grid">
                    {[
                      { label: 'General consultation', icon: Stethoscope },
                      { label: "Women's health", icon: Heart },
                      { label: 'Child care', icon: Baby },
                    ].map(({ label, icon: IconComponent }, idx) => (
                      <div className="choice" key={label}>
                        <input
                          id={`pref-${idx}`}
                          type="radio"
                          name="pref"
                          value={label}
                          checked={(patientData.doctorPref || 'General consultation') === label}
                          onChange={(e) => {
                            setValidationError('');
                            updatePatientData('doctorPref', e.target.value);
                            markDraft();
                          }}
                        />
                        <label htmlFor={`pref-${idx}`}>
                          <span className="choice-icon">
                            <IconComponent size={16} />
                          </span>
                          <span className="choice-label-text">{label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <span className="hint">Select care category. You can modify this at the care centre.</span>
                </fieldset>
              </div>
              <div className="flow-actions compact-flow-actions">
                <span className="status-note">Required fields marked with *</span>
                <button id="profile-next" className="btn-primary btn-icon" type="submit">
                  Continue to centre search <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Choose Care Centre */}
          {currentStep === 2 && (
            <div className="step-location-shell">
              <div className="location-search-header">
                <form onSubmit={handleLocationSearch} className="location-unified-bar">
                  <span className="search-bar-icon">
                    <Search size={16} />
                  </span>
                  <input
                    id="location-query"
                    type="search"
                    autoComplete="postal-code"
                    maxLength={80}
                    placeholder="Search city, area, or PIN code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="btn-secondary btn-icon btn-compact" type="submit">
                    <Search size={14} /> <span>Search</span>
                  </button>
                  <button
                    id="use-location"
                    className="btn-primary btn-icon btn-compact"
                    type="button"
                    title="Detect device location"
                    onClick={handleDetectLocation}
                    disabled={locating}
                  >
                    <LocateFixed size={15} />{' '}
                    <span>{locating ? 'Detecting...' : 'Auto-detect GPS'}</span>
                  </button>
                </form>

                <div className="map-toolbar compact-map-toolbar">
                  <div className="map-toolbar-info">
                    <span id="map-status" className="status-note" role="status" aria-live="polite">
                      {mapStatus}
                    </span>
                  </div>
                  <div className="map-toolbar-actions">
                    <button
                      id="map-recenter"
                      className="text-link text-link-dark btn-icon"
                      type="button"
                      onClick={() => {
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.setView([17.4126, 78.4482], 13);
                        }
                      }}
                    >
                      <Crosshair size={14} /> Recenter
                    </button>
                    <div className="map-view-toggle" role="group" aria-label="Map view">
                      <button
                        id="show-map"
                        className={mapMode === 'map' ? 'active' : ''}
                        type="button"
                        onClick={() => setMapMode('map')}
                      >
                        <MapIcon size={13} /> Map
                      </button>
                      <button
                        id="show-list"
                        className={mapMode === 'list' ? 'active' : ''}
                        type="button"
                        onClick={() => setMapMode('list')}
                      >
                        <ListIcon size={13} /> List
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Layout */}
              <div
                className={`map-layout section-map compact-map-layout ${
                  mapMode === 'list' ? 'map-show-list' : 'map-show-map'
                }`}
                data-section="care-map"
              >
                <div className="map-panel">
                  <div className="map-wrap compact-map-wrap">
                    <div
                      id="hospital-map"
                      ref={mapContainerRef}
                      aria-label="Map of nearby care centres"
                      style={{ height: '380px', width: '100%' }}
                    />
                    <div className="map-overlay">
                      <MapPin size={13} /> Care map
                    </div>
                  </div>
                </div>

                <aside className="hospital-results">
                  <div className="results-heading">
                    <div>
                      <h2>Nearby care centres</h2>
                      <p id="results-summary" aria-live="polite">
                        {filteredHospitals.length} centres available
                      </p>
                    </div>
                    <label className="filter-control" htmlFor="care-filter">
                      <span>Filter</span>
                      <select
                        id="care-filter"
                        value={careFilter}
                        onChange={(e) => setCareFilter(e.target.value as any)}
                      >
                        <option value="all">All care</option>
                        <option value="hospital">Hospitals</option>
                        <option value="clinic">Clinics</option>
                      </select>
                    </label>
                  </div>

                  <div id="hospital-list" className="hospital-list">
                    {filteredHospitals.map((hospital, index) => {
                      const isSelected = patientData.hospital === hospital.name;
                      const isPublicListing = hospital.source === 'OpenStreetMap';
                      return (
                        <article
                          key={hospital.id}
                          className={`hospital-option ${isSelected ? 'selected' : ''}`}
                        >
                          <button
                            className="hospital-select-button"
                            type="button"
                            data-hospital-id={hospital.id}
                            aria-pressed={isSelected}
                            onClick={() => handleSelectHospital(hospital)}
                          >
                            <span className="hospital-option-header">
                              <span>
                                <strong>
                                  <span className="hospital-badge-num">{index + 1}</span>
                                  {hospital.name}
                                </strong>
                                <small>
                                  {hospital.type} · {hospital.openingHours}
                                </small>
                              </span>
                              <span className="hospital-distance">
                                {(hospital.distance || 1.8).toFixed(1)} km
                              </span>
                            </span>
                          </button>
                          <div className="hospital-card-meta">
                            <span className="hospital-tag">
                              {isPublicListing ? (
                                <MapPin size={11} className="inline mr-1" />
                              ) : (
                                <FlaskConical size={11} className="inline mr-1" />
                              )}
                              {isPublicListing ? 'Public listing' : 'Demo centre'}
                            </span>
                            {isPublicListing && (
                              <a
                                className="hospital-ext-nav"
                                href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Navigation size={11} className="inline mr-1" /> Directions
                              </a>
                            )}
                            {isSelected && (
                              <span className="badge-selected">
                                <Check size={11} className="inline mr-1" /> Selected
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </aside>
              </div>

              {/* Selected Hospital Banner */}
              {patientData.hospital && (
                <div id="selected-hospital-banner" className="selected-hospital-banner">
                  <div className="selected-banner-copy">
                    <CheckCircle2 size={16} className="text-teal-600" />
                    <span>
                      Selected: <strong>{patientData.hospital}</strong>
                    </span>
                  </div>
                  <span className="selected-banner-hint">Ready to proceed</span>
                </div>
              )}

              {/* Step 2 Actions */}
              <div className="flow-actions compact-flow-actions">
                <button
                  id="location-back"
                  className="btn-secondary btn-icon"
                  type="button"
                  onClick={() => goToStep(1)}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  id="location-next"
                  className="btn-primary btn-icon"
                  type="button"
                  disabled={!patientData.hospital}
                  onClick={() => goToStep(3)}
                >
                  Continue with selected centre <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Visit details & clinician */}
          {currentStep === 3 && (
            <div>
              {/* Safety strip */}
              <div className="care-safety-strip" role="note">
                <span className="safety-icon">
                  <ShieldAlert size={15} />
                </span>
                <span className="safety-text">
                  Demo queue booking · For acute emergencies, call local emergency services immediately.
                </span>
                <span className="demo-badge">Presentation mode</span>
              </div>

              <div className="review-grid step3-review-grid">
                <div className="step3-fields">
                  <section className="care-selection-section" aria-labelledby="care-team-title">
                    <div className="section-heading-compact">
                      <h2 id="care-team-title" className="font-bold text-sm text-[var(--teal-dark)] mb-3">
                        Clinician &amp; appointment schedule
                      </h2>
                    </div>
                    <div className="care-selection-grid compact-care-grid">
                      <div className="field">
                        <label htmlFor="visit-department">
                          Department <span>*</span>
                        </label>
                        <select
                          id="visit-department"
                          value={patientData.department || departments[0]}
                          onChange={(e) => {
                            updatePatientData('department', e.target.value);
                            markDraft();
                          }}
                        >
                          {departments.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label htmlFor="visit-doctor">
                          Clinician <span>*</span>
                        </label>
                        <select
                          id="visit-doctor"
                          value={patientData.doctorId || currentDoctor?.id}
                          onChange={(e) => {
                            const found = CARE_TEAM.find((m) => m.id === e.target.value);
                            if (found) {
                              updatePatientData('doctorId', found.id);
                              updatePatientData('doctorName', found.name);
                              updatePatientData('doctorPref', found.name);
                              markDraft();
                            }
                          }}
                        >
                          {departmentDoctors.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} - {m.specialty}
                            </option>
                          ))}
                        </select>
                        <span id="doctor-availability" className="hint text-[11px] text-[var(--muted)] mt-1">
                          {currentDoctor?.room}. {currentDoctor?.availability}.
                        </span>
                      </div>

                      <div className="field">
                        <label htmlFor="consultation-type">
                          Consultation type <span>*</span>
                        </label>
                        <select
                          id="consultation-type"
                          value={patientData.consultationType || 'In-person consultation'}
                          onChange={(e) => {
                            updatePatientData('consultationType', e.target.value);
                            markDraft();
                          }}
                        >
                          <option>In-person consultation</option>
                          <option>Follow-up consultation</option>
                          <option>Join walk-in queue</option>
                        </select>
                      </div>

                      <div className="field">
                        <label htmlFor="appointment-slot">
                          Available slot <span>*</span>
                        </label>
                        <select
                          id="appointment-slot"
                          value={currentSlot?.value}
                          onChange={(e) => {
                            const slot = appointmentSlots.find((s) => s.value === e.target.value);
                            if (slot) {
                              updatePatientData('appointmentDate', slot.date);
                              updatePatientData('appointmentSlot', slot.slot);
                              markDraft();
                            }
                          }}
                        >
                          {appointmentSlots.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Reason for visit & Symptoms */}
                  <div className="field symptom-search-field mt-4">
                    <fieldset className="symptom-picker">
                      <legend className="font-bold text-xs text-[var(--teal-dark)] mb-2 uppercase tracking-wide">
                        Reason for visit / symptoms <span>*</span>
                      </legend>
                      <div className="symptom-suggestions flex flex-wrap gap-1.5" role="group">
                        {COMMON_SYMPTOMS.map((sym) => {
                          const isSelected = selectedSymptoms.has(sym);
                          return (
                            <button
                              key={sym}
                              type="button"
                              className={`symptom-suggestion ${isSelected ? 'active' : ''}`}
                              onClick={() => toggleSymptom(sym)}
                              aria-pressed={isSelected}
                            >
                              {isSelected ? <Check size={13} /> : <Plus size={13} />}
                              <span>{sym}</span>
                            </button>
                          );
                        })}
                      </div>

                      <form onSubmit={addCustomTag} className="compact-symptom-form">
                        <input
                          id="symptom-search"
                          type="search"
                          maxLength={60}
                          autoComplete="off"
                          placeholder="Add custom symptom..."
                          value={customSymptomInput}
                          onChange={(e) => setCustomSymptomInput(e.target.value)}
                        />
                        <button
                          id="add-custom-symptom"
                          className="btn-secondary btn-icon btn-compact"
                          type="submit"
                          disabled={!customSymptomInput.trim()}
                        >
                          <Plus size={14} /> Add
                        </button>
                      </form>

                      {/* Custom Tags */}
                      {customTags.length > 0 && (
                        <div id="custom-symptom-tags" className="custom-symptom-tags mt-2 flex flex-wrap gap-1.5">
                          {customTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              className="custom-symptom-tag"
                              onClick={() => removeCustomTag(tag)}
                              aria-label={`Remove custom symptom ${tag}`}
                            >
                              <span>{tag}</span>
                              <X size={13} />
                            </button>
                          ))}
                        </div>
                      )}
                    </fieldset>
                  </div>

                  {/* Additional Notes */}
                  <div className="field symptom-custom-field mt-3">
                    <label htmlFor="custom-symptoms" className="flex justify-between items-center text-xs text-[var(--muted)] mb-1">
                      <span>Additional notes <small>(optional)</small></span>
                      <span id="symptom-count" className="hint symptom-count">
                        {additionalNotes.length}/300
                      </span>
                    </label>
                    <textarea
                      id="custom-symptoms"
                      rows={2}
                      maxLength={300}
                      placeholder="When did symptoms start or any context for the care team?"
                      value={additionalNotes}
                      onChange={(e) => {
                        setAdditionalNotes(e.target.value);
                        syncSymptoms(selectedSymptoms, customTags, e.target.value);
                      }}
                    />
                  </div>
                </div>

                {/* Right Column: Live Booking Summary Card */}
                <aside className="step3-aside">
                  <section className="compact-summary-card" aria-labelledby="booking-summary-title">
                    <div className="summary-card-header">
                      <h2 id="booking-summary-title">
                        <ClipboardList size={15} /> Booking summary
                      </h2>
                      <span className="step-badge-mini">Step 3 of 4</span>
                    </div>
                    <div className="summary-rows-group">
                      <div className="summary-row">
                        <span>Patient</span>
                        <strong>
                          {patientData.name || 'Patient'}, {patientData.age || 32}
                        </strong>
                      </div>
                      <div className="summary-row">
                        <span>Centre</span>
                        <strong>{patientData.hospital || 'SmartCare Community Hospital'}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Department</span>
                        <strong>{patientData.department || 'General medicine'}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Clinician</span>
                        <strong>{currentDoctor?.name || 'Assigned clinician'}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Consultation</span>
                        <strong>{patientData.consultationType || 'In-person consultation'}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Slot</span>
                        <strong>{currentSlot?.label}</strong>
                      </div>
                    </div>
                    <div className="summary-fee-strip">
                      <div>
                        <small>Consultation fee</small>
                        <strong id="fee-estimate">₹125</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <small>Queue window</small>
                        <span className="queue-window-badge">Priority queue</span>
                      </div>
                    </div>
                  </section>
                </aside>
              </div>

              {/* Actions */}
              <div className="flow-actions compact-flow-actions">
                <button
                  id="details-back"
                  className="btn-secondary btn-icon"
                  type="button"
                  onClick={() => goToStep(2)}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  id="details-next"
                  className="btn-primary btn-icon"
                  type="button"
                  onClick={handleReviewStep}
                >
                  Review &amp; confirm booking <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Confirmation & Boarding Pass */}
          {currentStep === 4 && (
            <div className="confirmation-container">
              <div className="confirmation-hero-bar">
                <div className="conf-hero-icon">
                  <CheckCircle2 size={24} />
                </div>
                <div className="conf-hero-text">
                  <span className="eyebrow eyebrow-dark">
                    <span className="eyebrow-dot"></span> Reservation confirmed
                  </span>
                  <h1>You're on the care list</h1>
                  <p>Digital appointment ticket generated. Keep this reference for check-in.</p>
                </div>
              </div>

              <div className="confirmation-layout-grid">
                {/* Boarding Pass */}
                <section className="appointment-pass-card" aria-label="Appointment boarding pass">
                  <div className="pass-header">
                    <div>
                      <span className="pass-tag">
                        <HospitalIcon size={13} /> Care centre
                      </span>
                      <h2 className="pass-hospital">
                        {patientData.hospital || 'SmartCare Community Hospital'}
                      </h2>
                      <small className="pass-dept">
                        {patientData.department || 'General medicine'}
                      </small>
                    </div>
                    <div id="pass-payment-badge-mount">
                      <span className={`payment-status-badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}`}>
                        {isPaid ? <Check size={12} strokeWidth={3} /> : <Clock size={12} />}
                        <span>{isPaid ? 'Fee Paid (₹125)' : 'Payment pending (₹125)'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="pass-body">
                    <div className="pass-field">
                      <small>Patient name</small>
                      <strong>{patientData.name || 'Patient'}</strong>
                    </div>
                    <div className="pass-field">
                      <small>Consulting clinician</small>
                      <strong>{currentDoctor?.name || 'Assigned Clinician'}</strong>
                    </div>
                    <div className="pass-field">
                      <small>Consultation type</small>
                      <strong>{patientData.consultationType || 'In-person consultation'}</strong>
                    </div>
                    <div className="pass-field">
                      <small>Scheduled slot</small>
                      <strong>{currentSlot?.label}</strong>
                    </div>
                  </div>

                  {/* Pass Tear Line */}
                  <div className="pass-tear-line">
                    <span className="notch notch-left"></span>
                    <span className="dashed-line"></span>
                    <span className="notch notch-right"></span>
                  </div>

                  {/* Pass QR Strip */}
                  <div className="pass-qr-strip">
                    <img
                      src={qrImageUrl}
                      alt="Check-in QR Code"
                      className="pass-qr-img"
                    />
                    <div className="pass-qr-details">
                      <span className="pass-qr-label">
                        <QrCode size={13} /> Scan at hospital counter
                      </span>
                      <div
                        className={`token-card compact-token-card ${copiedToken ? 'copied' : ''}`}
                        role="button"
                        tabIndex={0}
                        title="Click to copy reference"
                        onClick={copyToken}
                      >
                        <div>
                          <small>Token Reference String</small>
                          <strong>{bookingId || 'SC-DEMO8924'}</strong>
                        </div>
                        <Copy size={16} />
                      </div>
                      <small className="copy-hint-text">
                        {copiedToken ? 'Copied to clipboard!' : 'Click token to copy'}
                      </small>
                    </div>
                  </div>
                </section>

                {/* Next Steps & Actions */}
                <section className="confirmation-next-section">
                  <div className="compact-steps-card">
                    <h3>
                      <Info size={16} /> Next steps
                    </h3>
                    <ul className="next-steps-list">
                      <li>
                        <strong>Check live queue:</strong>
                        <span>View live waiting room numbers on your patient dashboard.</span>
                      </li>
                      <li>
                        <strong>Hospital scan demo:</strong>
                        <span>
                          Open the Hospital Portal and scan reference <code>{bookingId || 'SC-DEMO8924'}</code> to simulate check-in.
                        </span>
                      </li>
                      <li>
                        <strong>Consultation fee:</strong>
                        <span>Simulate online payment or settle at the hospital desk.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="confirmation-action-buttons">
                    <button
                      id="btn-simulate-payment"
                      className={`btn-primary btn-payment-action ${isPaid ? 'btn-paid-state' : ''}`}
                      type="button"
                      onClick={() => {
                        setPaymentDoneView(isPaid);
                        setShowPaymentModal(true);
                      }}
                    >
                      {isPaid ? <Check size={16} /> : <CreditCard size={16} />}
                      <span>
                        {isPaid
                          ? `Payment done ✓ (Ref: ${paymentTxn})`
                          : 'Simulate "Payment Done" portal (₹125)'}
                      </span>
                    </button>

                    <button
                      id="btn-book-another"
                      className="btn-secondary btn-icon"
                      type="button"
                      onClick={() => {
                        updatePatientData('symptoms', '');
                        updatePatientData('symptomSelections', []);
                        updatePatientData('customSymptomTags', []);
                        updatePatientData('customSymptoms', '');
                        goToStep(1);
                      }}
                    >
                      <CalendarPlus size={16} /> <span>Book another appointment</span>
                    </button>

                    <Link
                      id="btn-view-dashboard"
                      href="/dashboard/patient"
                      className="btn-secondary btn-icon"
                    >
                      <LayoutDashboard size={16} /> <span>View my patient dashboard</span>
                    </Link>

                    <Link
                      id="btn-test-doctor"
                      href="/dashboard/hospital"
                      className="btn-secondary btn-icon"
                    >
                      <Stethoscope size={16} /> <span>Test scanning as hospital</span>
                    </Link>
                  </div>
                </section>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Review Modal Dialog */}
      {showReviewModal && (
        <div className="modal-backdrop" onClick={() => setShowReviewModal(false)}>
          <section
            className="modal-card booking-review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-review-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2 id="booking-review-title">Confirm booking details</h2>
                <p>Review information before adding this visit to queue.</p>
              </div>
              <button
                className="btn-ghost modal-close-button"
                type="button"
                onClick={() => setShowReviewModal(false)}
                aria-label="Close booking review"
              >
                <X size={18} />
              </button>
            </div>
            <div className="booking-review-list">
              <div className="summary-row">
                <span>Patient</span>
                <strong>
                  {patientData.name}, {patientData.age}
                </strong>
              </div>
              <div className="summary-row">
                <span>Care centre</span>
                <strong>{patientData.hospital}</strong>
              </div>
              <div className="summary-row">
                <span>Department</span>
                <strong>{patientData.department}</strong>
              </div>
              <div className="summary-row">
                <span>Clinician</span>
                <strong>{currentDoctor?.name}</strong>
              </div>
              <div className="summary-row">
                <span>Consultation</span>
                <strong>{patientData.consultationType}</strong>
              </div>
              <div className="summary-row">
                <span>Time</span>
                <strong>{currentSlot?.label}</strong>
              </div>
              <div className="summary-row summary-row-stacked">
                <span>Reason for visit</span>
                <strong>{patientData.symptoms || 'General consultation'}</strong>
              </div>
              <div className="demo-routing-note compact flex items-center gap-2 p-2 bg-blue-50 text-blue-800 text-xs rounded mt-2">
                <Sparkles size={14} className="shrink-0" />
                <span>Mirrored in SmartCare Community Hospital workspace.</span>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setShowReviewModal(false)}
              >
                Edit details
              </button>
              <button
                className="btn-primary btn-icon"
                id="confirm-reservation"
                type="button"
                onClick={handleConfirmReservation}
              >
                Confirm reservation <Check size={16} />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {showPaymentModal && (
        <div
          className="modal-backdrop payment-modal-backdrop"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="modal-card payment-gateway-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-modal-header">
              <div className="gateway-brand">
                <span className="gateway-logo">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <h3 id="payment-modal-title">SmartCare Pay</h3>
                  <small>Simulated Secure Healthcare Gateway</small>
                </div>
              </div>
              <button
                className="btn-ghost modal-close-button"
                type="button"
                onClick={() => setShowPaymentModal(false)}
                aria-label="Close payment modal"
              >
                <X size={18} />
              </button>
            </div>

            <div id="payment-modal-body" className="payment-modal-body">
              {paymentDoneView ? (
                /* Paid Receipt View */
                <div className="receipt-success-view">
                  <div className="receipt-success-icon">
                    <CheckCircle2 size={48} className="text-green-600" />
                  </div>
                  <h2>Payment Done Successfully</h2>
                  <p className="receipt-subtitle">Consultation fee has been verified and settled.</p>

                  <div className="receipt-card">
                    <div className="receipt-row">
                      <span>Status</span>
                      <strong className="badge-success-inline">
                        <Check size={12} strokeWidth={3} /> Paid / Settled
                      </strong>
                    </div>
                    <div className="receipt-row">
                      <span>Transaction ID</span>
                      <strong>
                        <code>{paymentTxn}</code>
                      </strong>
                    </div>
                    <div className="receipt-row">
                      <span>Amount Paid</span>
                      <strong>₹125.00</strong>
                    </div>
                    <div className="receipt-row">
                      <span>Patient</span>
                      <strong>{patientData.name || 'Asha Rao'}</strong>
                    </div>
                    <div className="receipt-row">
                      <span>Clinician</span>
                      <strong>{currentDoctor?.name}</strong>
                    </div>
                    <div className="receipt-row">
                      <span>Hospital</span>
                      <strong>{patientData.hospital || 'SmartCare Community Hospital'}</strong>
                    </div>
                    <div className="receipt-row">
                      <span>Booking Reference</span>
                      <strong>{bookingId || 'SC-DEMO8924'}</strong>
                    </div>
                    <div className="receipt-row">
                      <span>Date &amp; Time</span>
                      <strong>
                        {new Date().toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>
                    </div>
                  </div>

                  <div className="receipt-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setShowPaymentModal(false)}
                    >
                      Return to Boarding Pass
                    </button>
                  </div>
                </div>
              ) : (
                /* Payment Checkout */
                <div>
                  <div className="checkout-summary-box">
                    <div className="checkout-row">
                      <span>Service</span>
                      <strong>Doctor Consultation ({currentDoctor?.name})</strong>
                    </div>
                    <div className="checkout-row">
                      <span>Centre</span>
                      <strong>{patientData.hospital || 'SmartCare Community Hospital'}</strong>
                    </div>
                    <div className="checkout-row">
                      <span>Patient</span>
                      <strong>
                        {patientData.name || 'Patient'} (Ref: {bookingId || 'SC-DEMO8924'})
                      </strong>
                    </div>
                    <div className="checkout-total-row">
                      <span>Total Consultation Fee</span>
                      <strong className="checkout-amount">₹125.00</strong>
                    </div>
                  </div>

                  <div className="payment-methods-tabs" role="tablist">
                    <button
                      className={`pm-tab ${paymentTab === 'upi' ? 'active' : ''}`}
                      type="button"
                      onClick={() => setPaymentTab('upi')}
                    >
                      <Smartphone size={14} /> UPI / QR
                    </button>
                    <button
                      className={`pm-tab ${paymentTab === 'card' ? 'active' : ''}`}
                      type="button"
                      onClick={() => setPaymentTab('card')}
                    >
                      <CreditCard size={14} /> Card
                    </button>
                    <button
                      className={`pm-tab ${paymentTab === 'netbanking' ? 'active' : ''}`}
                      type="button"
                      onClick={() => setPaymentTab('netbanking')}
                    >
                      <Building size={14} /> NetBanking
                    </button>
                    <button
                      className={`pm-tab ${paymentTab === 'counter' ? 'active' : ''}`}
                      type="button"
                      onClick={() => setPaymentTab('counter')}
                    >
                      <Wallet size={14} /> At Counter
                    </button>
                  </div>

                  <div id="pm-tab-content" className="pm-tab-content">
                    {paymentTab === 'upi' && (
                      <div className="upi-mock-box">
                        <div className="mock-qr-wrap">
                          <div className="mock-qr-code">
                            <QrCode size={56} className="text-[#0a3b69]" />
                          </div>
                          <small>Scan with any UPI app</small>
                        </div>
                        <div className="upi-apps-row">
                          <span className="upi-chip">GPay</span>
                          <span className="upi-chip">PhonePe</span>
                          <span className="upi-chip">Paytm</span>
                          <span className="upi-chip">BHIM</span>
                        </div>
                        <div className="field" style={{ marginTop: '.75rem' }}>
                          <label htmlFor="mock-upi-id">Or enter simulated UPI ID</label>
                          <input
                            id="mock-upi-id"
                            value={`${(patientData.name || 'patient')
                              .toLowerCase()
                              .replace(/[^a-z0-9]/g, '')}@okhdfcbank`}
                            readOnly
                          />
                        </div>
                      </div>
                    )}

                    {paymentTab === 'card' && (
                      <div className="space-y-3 p-3 bg-gray-50 rounded-lg text-xs">
                        <div>
                          <label className="font-semibold block mb-1 text-gray-700">Card Number</label>
                          <input
                            type="text"
                            value="4532 •••• •••• 8921"
                            readOnly
                            className="w-full p-2 border rounded font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="font-semibold block mb-1 text-gray-700">Expiry</label>
                            <input type="text" value="08/29" readOnly className="w-full p-2 border rounded font-mono" />
                          </div>
                          <div>
                            <label className="font-semibold block mb-1 text-gray-700">CVV</label>
                            <input type="text" value="•••" readOnly className="w-full p-2 border rounded font-mono" />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentTab === 'netbanking' && (
                      <div className="netbanking-grid">
                        {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map((bank, i) => (
                          <div key={bank} className={`nb-bank ${i === 0 ? 'active' : ''}`}>
                            {bank}
                          </div>
                        ))}
                      </div>
                    )}

                    {paymentTab === 'counter' && (
                      <div className="counter-pay-box">
                        <Wallet size={36} className="mx-auto text-[var(--teal)] mb-2" />
                        <strong>Pay in cash or card at the counter</strong>
                        <p>A reference token will be reserved for you. Settle ₹125 upon reaching OPD reception.</p>
                      </div>
                    )}
                  </div>

                  <div className="payment-modal-footer">
                    <div className="security-badge">
                      <Lock size={12} />
                      <span>256-bit Simulated Sandbox Protection</span>
                    </div>
                    <button
                      id="btn-process-payment"
                      className="btn-primary btn-process-payment"
                      type="button"
                      onClick={completeSimulatedPayment}
                    >
                      <Check size={16} /> Complete Simulated Payment (₹125)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PatientShell>
  );
}

function HospitalIcon({ size = 16 }: { size?: number }) {
  return <Building size={size} />;
}
