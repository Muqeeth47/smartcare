'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, usePatient, useAppStore } from '@/lib/store/app-store';
import { PatientShell } from '@/components/layout/Shell';
import { DemoDB } from '@/lib/db/demo-db';
import {
  Droplets,
  HeartHandshake,
  MapPin,
  Locate,
  Search,
  SearchX,
  Phone,
  ChevronRight,
  Hand,
  PackageCheck,
  Send,
  Scale,
  ExternalLink,
  Info,
  Layers,
  ClipboardList,
  Printer,
  X,
  ShieldCheck,
} from 'lucide-react';
import type { DonationPost } from '@smartcare/types';

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
const ORGANS = ['Kidney', 'Liver', 'Heart', 'Cornea', 'Lung', 'Pancreas'];

interface Centre {
  name: string;
  area: string;
  lat: number;
  lng: number;
  type: 'blood' | 'organ';
  hours?: string;
  note?: string;
  distance?: string;
}

const DEMO_CENTRES_MAP: Centre[] = [
  { name: 'SmartCare Community Hospital Blood Bank', area: 'Banjara Hills', lat: 17.4126, lng: 78.4482, type: 'blood', hours: '09:00–17:00', note: 'All common blood groups', distance: '1.2 km' },
  { name: 'Red Cross Donation Centre', area: 'Secunderabad', lat: 17.4399, lng: 78.4983, type: 'blood', hours: '10:00–18:00', note: 'Call ahead for stock', distance: '3.8 km' },
  { name: 'CityCare Blood Services', area: 'Kukatpally', lat: 17.4849, lng: 78.3956, type: 'blood', hours: '08:00–16:00', note: 'Bring photo ID', distance: '5.4 km' },
  { name: 'Apollo Organ Coordination', area: 'Jubilee Hills', lat: 17.4239, lng: 78.4101, type: 'organ', hours: '24/7 Helpline', note: 'Transplant coordinator on duty', distance: '2.5 km' },
  { name: 'NOTTO Hyderabad Node', area: 'Begumpet', lat: 17.4437, lng: 78.4637, type: 'organ', hours: '09:30–18:00', note: 'Regional registry center', distance: '4.1 km' },
];

export function PatientDonationsFinder() {
  const { email } = useSession();
  const { patientData } = usePatient();
  const { showToast } = useAppStore();

  const patientName = patientData.name || (email === 'patient@smartcare.demo' ? 'Asha Rao' : email.split('@')[0].replace(/[._-]/g, ' '));

  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') || searchParams.get('tab');
  const modeParam = searchParams.get('mode');

  const [donationType, setDonationType] = useState<'blood' | 'organ'>(
    typeParam === 'organ' ? 'organ' : 'blood'
  );
  const [mode, setMode] = useState<'give' | 'receive'>(
    modeParam === 'receive' ? 'receive' : 'give'
  );

  const handleTypeChange = (newType: 'blood' | 'organ') => {
    setDonationType(newType);
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', newType);
    router.replace(`/dashboard/patient/donations?${params.toString()}`, { scroll: false });
  };

  const handleModeChange = (newMode: 'give' | 'receive') => {
    setMode(newMode);
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', newMode);
    router.replace(`/dashboard/patient/donations?${params.toString()}`, { scroll: false });
  };

  const [selectedGroup, setSelectedGroup] = useState<string>('B+');
  const [cityInput, setCityInput] = useState<string>(patientData.city || 'Hyderabad');
  const [searchExecuted, setSearchExecuted] = useState<boolean>(true);
  const [selectedCentre, setSelectedCentre] = useState<string | null>(null);

  // Form states
  const [donorName, setDonorName] = useState(patientName);
  const [donorGroup, setDonorGroup] = useState('B+');
  const [donorUrgency, setDonorUrgency] = useState('Routine');
  const [donorConsent, setDonorConsent] = useState(false);

  // Organ form states
  const [organName, setOrganName] = useState(patientName);
  const [organChosen, setOrganChosen] = useState('Kidney');
  const [organCity, setOrganCity] = useState('Hyderabad');
  const [organConsent, setOrganConsent] = useState(false);
  const [organUrgency, setOrganUrgency] = useState('Routine');

  // Registrations state
  const [myRegistrations, setMyRegistrations] = useState<DonationPost[]>([]);

  // Donor Honor Roll Card Modal state
  const [donorCardModal, setDonorCardModal] = useState<{
    name: string;
    type: 'blood' | 'organ';
    group: string;
    city: string;
    donorId: string;
    dateStr: string;
  } | null>(null);

  const openDonorHonorCard = (pledge: { name: string; type: 'blood' | 'organ'; group: string; city: string }) => {
    const donorId = 'SCD-' + Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    setDonorCardModal({
      name: pledge.name || patientName,
      type: pledge.type,
      group: pledge.group,
      city: pledge.city || cityInput || 'Hyderabad',
      donorId,
      dateStr,
    });
  };

  // Leaflet map container ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Filtered centres
  const filteredCentres = DEMO_CENTRES_MAP.filter((c) => c.type === donationType);

  // Load patient registrations from DemoDB
  useEffect(() => {
    const data = DemoDB.getDonationsData();
    setMyRegistrations(data.patientPosts.filter((p) => p.type === donationType));
  }, [donationType]);

  // Dynamically load Leaflet and initialize map
  useEffect(() => {
    let active = true;

    function initLeafletMap() {
      if (!active || !mapContainerRef.current || !window.L) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }

      const map = window.L.map(mapContainerRef.current, {
        center: [17.4399, 78.4637],
        zoom: 12,
        zoomControl: true,
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add markers
      markersRef.current = [];
      DEMO_CENTRES_MAP.forEach((c) => {
        const isBlood = c.type === 'blood';
        const customIcon = window.L.divIcon({
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
          html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:${isBlood ? '#0f5ca8' : '#0a3b69'};transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 12px rgba(10,59,105,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:7px;height:7px;border-radius:50%;background:#fff;"></div></div>`,
        });

        const marker = window.L.marker([c.lat, c.lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:inherit;padding:4px 2px;">
            <strong style="display:block;color:#0a3b69;font-size:13px;line-height:1.2;">${c.name}</strong>
            <span style="display:block;color:#64748b;font-size:11px;margin-top:2px;">${c.area}</span>
            <span style="display:inline-block;margin-top:4px;padding:2px 6px;border-radius:4px;background:#eaf4fd;color:#0f5ca8;font-size:10px;font-weight:700;">
              ${c.type === 'blood' ? 'Blood Bank' : 'Organ Center'}
            </span>
          </div>
        `);

        markersRef.current.push({ marker, centre: c });
      });

      // Filter visible markers by donationType
      updateMarkerVisibility(donationType);

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }

    function updateMarkerVisibility(type: string) {
      if (!mapInstanceRef.current) return;
      markersRef.current.forEach(({ marker, centre }) => {
        if (centre.type === type) {
          if (!mapInstanceRef.current.hasLayer(marker)) marker.addTo(mapInstanceRef.current);
        } else {
          if (mapInstanceRef.current.hasLayer(marker)) mapInstanceRef.current.removeLayer(marker);
        }
      });
    }

    // Check if Leaflet is already loaded
    if (window.L) {
      initLeafletMap();
    } else {
      // Inject Leaflet CSS
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      // Inject Leaflet JS
      if (!document.querySelector('#leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initLeafletMap();
        document.head.appendChild(script);
      } else {
        const existingScript = document.querySelector('#leaflet-js') as HTMLScriptElement;
        existingScript.addEventListener('load', () => initLeafletMap());
      }
    }

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker visibility when donationType changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersRef.current.length) return;
    markersRef.current.forEach(({ marker, centre }) => {
      if (centre.type === donationType) {
        if (!mapInstanceRef.current.hasLayer(marker)) marker.addTo(mapInstanceRef.current);
      } else {
        if (mapInstanceRef.current.hasLayer(marker)) mapInstanceRef.current.removeLayer(marker);
      }
    });
  }, [donationType]);

  const handleCentreSelect = (centre: Centre) => {
    setSelectedCentre(centre.name);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([centre.lat, centre.lng], 15, { duration: 0.8 });
      const target = markersRef.current.find((m) => m.centre.name === centre.name);
      if (target) target.marker.openPopup();
    }
  };

  const handleLocateGPS = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'info');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCityInput('Hyderabad (Nearby GPS)');
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 14);
        }
        showToast('Location updated to device GPS', 'success');
      },
      () => {
        showToast('Unable to access device location. Using default Hyderabad.', 'info');
      }
    );
  };

  const handleBloodRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newPost: DonationPost = {
      id: `post-${Date.now()}`,
      author: donorName,
      name: donorName,
      group: donorGroup,
      city: cityInput,
      type: 'blood',
      mode: mode === 'give' ? 'give' : 'receive',
      urgency: donorUrgency,
      created_at: new Date().toISOString(),
      status: 'Active',
    };
    DemoDB.addPatientPost(newPost);
    setMyRegistrations((prev) => [newPost, ...prev]);
    showToast(mode === 'give' ? 'Donor registration saved to your profile' : 'Blood request published to community', 'success');
    if (mode === 'give') {
      openDonorHonorCard({
        name: donorName,
        type: 'blood',
        group: donorGroup,
        city: cityInput || 'Hyderabad',
      });
    }
  };

  const handleOrganSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPost: DonationPost = {
      id: `organ-${Date.now()}`,
      author: organName,
      name: organName,
      group: organChosen,
      city: organCity,
      type: 'organ',
      mode: mode === 'give' ? 'give' : 'receive',
      urgency: organUrgency,
      created_at: new Date().toISOString(),
      status: 'Active',
    };
    DemoDB.addPatientPost(newPost);
    setMyRegistrations((prev) => [newPost, ...prev]);
    showToast(mode === 'give' ? 'Organ donation interest noted' : 'Organ guidance request submitted', 'success');
    if (mode === 'give') {
      openDonorHonorCard({
        name: organName,
        type: 'organ',
        group: organChosen,
        city: organCity || 'Hyderabad',
      });
    }
  };

  return (
    <PatientShell subtitle="Donations & Blood Bank" backHref="/dashboard/patient" className="pd-workspace-content">
      <div className="nd-finder-shell border border-[var(--line)] rounded-2xl overflow-hidden bg-[var(--surface)] shadow-sm">
        {/* LEFT PANEL */}
        <aside className="nd-finder-panel flex flex-col min-h-0 bg-[var(--surface)] border-r border-[var(--line)]">
          {/* Header Intro */}
          <div className="nd-finder-intro p-5 pb-3">
            <div className="eyebrow eyebrow-dark mb-1">
              <span className="eyebrow-dot" /> Community &amp; Hospital
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a3b69]">
              Give or receive,<br />
              <span className="text-[#0f5ca8]">{patientName}.</span>
            </h1>

            {/* Type Switch (Blood / Organ) */}
            <div className="nd-type-switch mt-3 grid grid-cols-2 gap-1.5" role="tablist" aria-label="Donation type">
              <button
                type="button"
                className={`nd-type-btn min-h-[44px] cursor-pointer ${donationType === 'blood' ? 'active' : ''}`}
                onClick={() => handleTypeChange('blood')}
              >
                <Droplets size={15} /> Blood
              </button>
              <button
                type="button"
                className={`nd-type-btn min-h-[44px] cursor-pointer ${donationType === 'organ' ? 'active' : ''}`}
                onClick={() => handleTypeChange('organ')}
              >
                <HeartHandshake size={15} /> Organ
              </button>
            </div>

            {/* Mode tabs (Give / Receive) */}
            <div className="pd-mode-tabs grid grid-cols-2 gap-2 mt-2" role="tablist" aria-label="Give or receive">
              <button
                type="button"
                onClick={() => handleModeChange('give')}
                className={`flex items-center justify-center gap-1.5 min-h-[44px] px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'give'
                    ? 'bg-[#0f5ca8] text-white shadow-sm'
                    : 'bg-[var(--mint)] text-[#0a3b69] hover:bg-[#cbe3f7]'
                }`}
              >
                <HeartHandshake size={14} /> I want to give
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('receive')}
                className={`flex items-center justify-center gap-1.5 min-h-[44px] px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'receive'
                    ? 'bg-[#0f5ca8] text-white shadow-sm'
                    : 'bg-[var(--mint)] text-[#0a3b69] hover:bg-[#cbe3f7]'
                }`}
              >
                <Hand size={14} /> I need a donation
              </button>
            </div>
          </div>

          {/* BLOOD TAB CONTENT */}
          {donationType === 'blood' && (
            <div className="nd-tab-panel active flex-1 flex flex-col min-h-0 overflow-y-auto">
              <div className="nd-search-controls px-5 py-3 border-b border-[var(--line)]">
                {/* 8-button blood selector */}
                <fieldset className="nd-blood-selector mb-3">
                  <legend className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Select blood group
                  </legend>
                  <div className="nd-blood-grid grid grid-cols-4 gap-1.5">
                    {BLOOD_GROUPS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGroup(g)}
                        className={`nd-bg-btn h-10 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                          selectedGroup === g
                            ? 'active bg-[#0f5ca8] border-[#0f5ca8] text-white shadow-sm'
                            : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] hover:bg-[var(--mint)] hover:text-[var(--teal)]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* City Search + GPS */}
                <div className="nd-field mb-3">
                  <label className="block text-[0.72rem] font-bold text-[var(--text-muted)] mb-1">
                    City or Area
                  </label>
                  <div className="nd-input-row flex gap-2">
                    <div className="nd-select-wrap flex-1 flex items-center gap-2 px-3 border border-[var(--line)] rounded-lg bg-[var(--surface)]">
                      <MapPin size={14} className="text-[var(--text-muted)] shrink-0" />
                      <input
                        type="text"
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        placeholder="e.g. Hyderabad"
                        className="w-full text-xs font-semibold py-2 outline-none bg-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleLocateGPS}
                      title="Use device location"
                      className="w-10 h-10 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[#0f5ca8] flex items-center justify-center hover:bg-[var(--mint)] transition-colors"
                    >
                      <Locate size={16} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSearchExecuted(true)}
                  className="w-full h-10 rounded-xl bg-[#0f5ca8] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#0a3b69] transition-all shadow-sm"
                >
                  <Search size={15} /> Find {mode === 'give' ? 'donation centres' : 'blood availability'}
                </button>
              </div>

              {/* Results list */}
              <div className="nd-results-header flex items-center justify-between px-5 py-2.5 bg-[#f8fafc] border-b border-[var(--line)]">
                <h2 className="text-xs font-extrabold text-[#0a3b69] flex items-center gap-1.5 uppercase tracking-wider">
                  <Droplets size={14} /> Results <span className="nd-count ml-1">{filteredCentres.length}</span>
                </h2>
                <span className="text-[0.68rem] text-[var(--text-muted)]">Showing centres for {selectedGroup}</span>
              </div>

              <div className="nd-results-scroll flex-1 overflow-y-auto divide-y divide-[var(--line)]">
                {filteredCentres.map((c) => (
                  <div
                    key={c.name}
                    className={`nd-result-row p-3 hover:bg-[var(--mint)]/40 transition-colors ${
                      selectedCentre === c.name ? 'bg-[var(--mint)] border-l-4 border-[#0f5ca8]' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleCentreSelect(c)}
                      className="nd-result-select w-full flex items-start gap-3 text-left"
                    >
                      <div className="nd-blood-avatar w-10 h-10 rounded-lg bg-[var(--mint)] text-[#0a3b69] font-black text-xs flex items-center justify-center shrink-0 border border-[#b8d6f1]">
                        {selectedGroup}
                      </div>
                      <div className="nd-result-info flex-1 min-w-0">
                        <strong className="block text-xs font-bold text-[#0a3b69] truncate">{c.name}</strong>
                        <span className="block text-[0.72rem] text-[var(--text-muted)] mt-0.5">{c.area} · {c.hours}</span>
                        {c.note && <small className="block text-[0.68rem] text-[var(--text-dim)] mt-0.5">{c.note}</small>}
                      </div>
                      <div className="text-right shrink-0 text-[0.7rem] font-bold text-[#0f5ca8] flex items-center gap-1">
                        <MapPin size={11} /> {c.distance}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (mode === 'give') {
                          openDonorHonorCard({
                            name: patientName,
                            type: donationType,
                            group: donationType === 'blood' ? selectedGroup : 'All Tissues & Organs',
                            city: c.name,
                          });
                          showToast(`Pledged donation to ${c.name}. Recognition certificate generated!`, 'success');
                        } else {
                          showToast(`Demo request recorded for ${c.name}.`, 'info');
                        }
                      }}
                      className="nd-request-btn mt-2 flex items-center gap-1 text-[0.72rem] font-bold text-[#0f5ca8] hover:underline"
                    >
                      {mode === 'give' ? 'Pledge donation' : 'Request units'} <ChevronRight size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* My active registrations */}
              {myRegistrations.length > 0 && (
                <div className="pd-my-posts p-4 border-t border-[var(--line)] bg-[#f8fbfe]">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0a3b69] mb-2">
                    <ClipboardList size={14} /> Your active registrations
                  </div>
                  <div className="space-y-2">
                    {myRegistrations.map((p) => (
                      <div key={p.id} className="p-2.5 bg-[var(--surface)] border border-[var(--line)] rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-[#0a3b69] font-bold">{p.name} ({p.group})</strong>
                          <span className="block text-[0.7rem] text-[var(--text-muted)]">{p.mode === 'give' ? 'Donor' : 'Request'} · {p.city}</span>
                        </div>
                        <span className="text-[0.65rem] font-extrabold px-2 py-0.5 rounded bg-green-100 text-green-700">Listed</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Donor Form */}
              <div className="nd-panel-aside p-4 border-t border-[var(--line)] bg-[var(--surface-sunken)]">
                <strong className="block text-xs font-bold text-[#0a3b69] mb-2">
                  {mode === 'give' ? 'Register as blood donor' : 'Submit emergency blood request'}
                </strong>
                <form onSubmit={handleBloodRegister} className="space-y-2">
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Your name"
                    className="w-full text-xs p-2 rounded-lg border border-[var(--line)] bg-[var(--surface)]"
                  />
                  <div className="flex gap-2">
                    <select
                      value={donorGroup}
                      onChange={(e) => setDonorGroup(e.target.value)}
                      className="flex-1 text-xs p-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] font-bold"
                    >
                      {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    {mode === 'receive' && (
                      <select
                        value={donorUrgency}
                        onChange={(e) => setDonorUrgency(e.target.value)}
                        className="flex-1 text-xs p-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] font-bold"
                      >
                        <option value="Routine">Routine</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Emergency">Emergency</option>
                      </select>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full h-9 rounded-lg bg-[#0f5ca8] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Send size={13} /> {mode === 'give' ? 'Save donor profile' : 'Broadcast request'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ORGAN TAB CONTENT */}
          {donationType === 'organ' && (
            <div className="nd-tab-panel active flex-1 flex flex-col min-h-0 overflow-y-auto p-5 space-y-4">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {mode === 'give'
                  ? 'Record a non-binding organ donation interest for a care team to follow up on.'
                  : 'Record a demo organ guidance request to explore the coordinator workflow.'}
              </p>

              <form onSubmit={handleOrganSubmit} className="space-y-3">
                <div>
                  <label className="block text-[0.72rem] font-bold text-[var(--text)] mb-1">Full name *</label>
                  <input
                    type="text"
                    required
                    value={organName}
                    onChange={(e) => setOrganName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)]"
                  />
                </div>
                <div>
                  <label className="block text-[0.72rem] font-bold text-[var(--text)] mb-1">
                    {mode === 'give' ? 'Organ of interest' : 'Organ guidance needed'}
                  </label>
                  <select
                    value={organChosen}
                    onChange={(e) => setOrganChosen(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] font-bold"
                  >
                    {ORGANS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[0.72rem] font-bold text-[var(--text)] mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={organCity}
                    onChange={(e) => setOrganCity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)]"
                  />
                </div>
                <label className="flex items-start gap-2 text-[0.72rem] text-[var(--text-muted)] cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={organConsent}
                    onChange={(e) => setOrganConsent(e.target.checked)}
                    className="mt-0.5 rounded text-[#0f5ca8]"
                  />
                  <span>I understand this is a prototype and not legal registry registration.</span>
                </label>
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-[#0f5ca8] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <HeartHandshake size={15} /> {mode === 'give' ? 'Save organ interest' : 'Save guidance request'}
                </button>
              </form>

              {/* NOTTO Aside */}
              <div className="p-3.5 bg-[#f0f7fc] border border-[#c2dcf3] rounded-xl text-xs text-[#0a3b69]">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Scale size={15} className="text-[#0f5ca8]" /> Important distinction
                </div>
                <p className="text-[0.72rem] text-[var(--text-muted)] leading-relaxed">
                  Official organ donation registration in India is managed via NOTTO (National Organ &amp; Tissue Transplant Organisation).
                </p>
                <a
                  href="https://notto.mohfw.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-[#0f5ca8] hover:underline mt-2"
                >
                  Visit official NOTTO portal <ExternalLink size={11} />
                </a>
              </div>
            </div>
          )}

          {/* Disclaimer bottom */}
          <div className="nd-panel-bottom p-3.5 border-t border-[var(--line)] bg-[var(--surface)] flex items-center gap-2 text-[0.68rem] text-[var(--text-dim)]">
            <Info size={13} className="shrink-0 text-[var(--teal)]" />
            <span>Demo environment: no real coordinators or official registries contacted.</span>
          </div>
        </aside>

        {/* RIGHT MAP (Interactive Leaflet Canvas) */}
        <div className="nd-finder-map relative min-h-[420px] bg-[#eaf3fa] overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-0" />

          {/* Map Legend */}
          <div className="nd-map-legend absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-[var(--surface)]/95 backdrop-blur-xs border border-[var(--line)] rounded-lg px-3 py-1.5 text-[0.72rem] shadow-sm text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[#0f5ca8] inline-block" /> Blood Bank
            <span className="w-2 h-2 rounded-full bg-[#0a3b69] inline-block ml-2" /> Organ Center
          </div>
        </div>
      </div>

      {/* ── Digital Donor Honor Roll Card Modal ── */}
      {donorCardModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity"
          role="dialog"
          aria-modal="true"
          onClick={() => setDonorCardModal(null)}
        >
          <div
            className="w-full sm:max-w-[480px] bg-[var(--surface)] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl border border-[var(--line)] animate-in fade-in max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card Hero Graphic */}
            <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-600 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setDonorCardModal(null)}
                aria-label="Close card"
                className="absolute top-4 right-4 flex items-center justify-center min-w-[36px] min-h-[36px] rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                  {donorCardModal.type === 'blood' ? <Droplets size={22} /> : <HeartHandshake size={22} />}
                </span>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-teal-200 block">
                    Official Donor Recognition Card
                  </span>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    SmartCare Donor Honor Roll
                  </h3>
                </div>
              </div>

              {/* Certificate Inner Frame */}
              <div className="bg-black/20 p-4 rounded-xl border border-white/15 backdrop-blur-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <small className="text-[10px] text-teal-200 uppercase font-bold block">
                      Honorary Donor
                    </small>
                    <strong className="text-base sm:text-lg font-extrabold text-white tracking-wide block">
                      {donorCardModal.name}
                    </strong>
                  </div>
                  <div className="text-right">
                    <small className="text-[10px] text-teal-200 uppercase font-bold block">
                      {donorCardModal.type === 'blood' ? 'Blood Group' : 'Pledged'}
                    </small>
                    <strong className="text-lg sm:text-xl font-black text-amber-300 block">
                      {donorCardModal.group}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-teal-100 border-t border-white/15 pt-2.5 flex-wrap gap-2">
                  <span>Ref: <strong className="font-mono text-white">{donorCardModal.donorId}</strong></span>
                  <span>City: <strong className="text-white">{donorCardModal.city}</strong></span>
                  <span>Date: <strong className="text-white">{donorCardModal.dateStr}</strong></span>
                </div>
              </div>
            </div>

            {/* Card Body & Notice */}
            <div className="p-5 space-y-4 bg-[var(--surface)]">
              <div className="flex items-start gap-3 p-3.5 bg-[var(--surface-sunken)] rounded-xl border border-[var(--line)] text-xs text-[var(--muted)] leading-relaxed">
                <ShieldCheck size={20} className="text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--ink)] block font-bold mb-0.5">
                    Thank you for pledging care to our community!
                  </strong>
                  Registered in the SmartCare Community Donor Pool. You may show this digital recognition certificate at any partner hospital blood bank or coordination desk.
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-sunken)] text-xs font-bold text-[var(--ink)] transition-colors min-h-[44px]"
                >
                  <Printer size={15} /> Print Card
                </button>
                <button
                  type="button"
                  onClick={() => setDonorCardModal(null)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors min-h-[44px] shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PatientShell>
  );
}

declare global {
  interface Window {
    L: any;
  }
}
