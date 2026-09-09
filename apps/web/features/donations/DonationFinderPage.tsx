'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store/app-store';
import { Topbar } from '@/components/layout/Topbar';
import { Footer } from '@/components/layout/Shell';
import {
  HeartPulse,
  Droplets,
  HeartHandshake,
  MapPin,
  Locate,
  Navigation,
  Search,
  SearchX,
  Phone,
  ChevronRight,
  ShieldCheck,
  Scale,
  ExternalLink,
  Info,
  Loader2,
  ArrowRight,
  Layers,
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DEMO_BLOOD_CENTRES = [
  {
    id: 'blood-demo-1',
    name: 'SmartCare Community Hospital Blood Bank',
    area: 'Banjara Hills, Hyderabad',
    lat: 17.4126,
    lng: 78.4482,
    city: 'hyderabad',
    supported_groups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    hours: 'Open today · 09:00–17:00',
    note: 'Supports all common blood groups.',
    distance: '1.2 km',
  },
  {
    id: 'blood-demo-2',
    name: 'Red Cross Donation Centre',
    area: 'Secunderabad, Hyderabad',
    lat: 17.4399,
    lng: 78.4983,
    city: 'hyderabad',
    supported_groups: ['A+', 'B+', 'AB+', 'O+'],
    hours: 'Open today · 10:00–18:00',
    note: 'Call ahead for group-specific availability.',
    distance: '3.8 km',
  },
  {
    id: 'blood-demo-3',
    name: 'CityCare Blood Services',
    area: 'Kukatpally, Hyderabad',
    lat: 17.4849,
    lng: 78.3956,
    city: 'hyderabad',
    supported_groups: ['A-', 'B-', 'AB-', 'O-'],
    hours: 'Open today · 08:00–16:00',
    note: 'Bring a valid photo ID for screening.',
    distance: '5.4 km',
  },
];

export function DonationFinderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'blood' | 'organ'>(
    tabParam === 'organ' ? 'organ' : 'blood'
  );

  const handleTabChange = (tab: 'blood' | 'organ') => {
    setActiveTab(tab);
    setOrganMessage(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/donate?${params.toString()}`, { scroll: false });
  };

  const { showToast } = useAppStore();

  const [selectedGroup, setSelectedGroup] = useState<string>('O+');
  const [cityInput, setCityInput] = useState<string>('Hyderabad');
  const [locating, setLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);
  const [centres, setCentres] = useState(DEMO_BLOOD_CENTRES);

  // Organ form state
  const [organName, setOrganName] = useState('');
  const [organCity, setOrganCity] = useState('');
  const [organPref, setOrganPref] = useState('Learn about donation');
  const [organConsent, setOrganConsent] = useState(false);
  const [organMessage, setOrganMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Mobile toggle between list and map
  const [showMapMobile, setShowMapMobile] = useState(false);

  // Leaflet open-source map integration
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let active = true;

    function initLeaflet() {
      if (!active || !mapContainerRef.current || !window.L) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = window.L.map(mapContainerRef.current, {
        center: [17.4399, 78.4637],
        zoom: 12,
        zoomControl: true,
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      markersRef.current = [];

      centres.forEach((c) => {
        if (!c.lat || !c.lng) return;
        const icon = window.L.divIcon({
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
          html: '<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#0f5ca8;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 12px rgba(10,59,105,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:7px;height:7px;border-radius:50%;background:#fff;"></div></div>',
        });

        const marker = window.L.marker([c.lat, c.lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:inherit;padding:4px 2px;">
            <strong style="display:block;color:#0a3b69;font-size:13px;">${c.name}</strong>
            <span style="display:block;color:#64748b;font-size:11px;margin-top:2px;">${c.area}</span>
            <span style="display:inline-block;margin-top:4px;padding:2px 6px;border-radius:4px;background:#eaf4fd;color:#0f5ca8;font-size:10px;font-weight:700;">OpenStreetMap Verified</span>
          </div>
        `);
        markersRef.current.push({ marker, centre: c });
      });

      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 250);
    }

    if (window.L) {
      initLeaflet();
    } else {
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const existingScript = document.querySelector<HTMLScriptElement>('#leaflet-js');
      if (existingScript) {
        existingScript.addEventListener('load', () => initLeaflet());
      } else {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initLeaflet();
        document.head.appendChild(script);
      }
    }

    return () => {
      active = false;
    };
  }, [centres]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not available on this browser.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setCityInput('Hyderabad');
        setLocationLabel(`Device Location (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`);
        showToast('Using device coordinates', 'info');
      },
      () => {
        setLocating(false);
        showToast('Could not fetch location. Please enter city manually.', 'error');
      }
    );
  };

  const handleSearch = () => {
    if (!selectedGroup) {
      showToast('Please select a blood group.', 'error');
      return;
    }
    if (!cityInput.trim()) {
      showToast('Please enter a city or PIN code.', 'error');
      return;
    }

    setSearching(true);
    setTimeout(() => {
      const q = cityInput.toLowerCase().trim();
      const filtered = DEMO_BLOOD_CENTRES.filter(
        (c) =>
          c.supported_groups.includes(selectedGroup) &&
          (c.city.includes(q) || c.area.toLowerCase().includes(q) || q.includes('500') || q.includes('hyderabad'))
      );
      setCentres(filtered);
      setHasSearched(true);
      setSearching(false);
    }, 400);
  };

  const handleOrganSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organName || !organCity || !organConsent) {
      setOrganMessage({ text: 'Add your name, location, and confirm the demo notice.', type: 'error' });
      return;
    }
    setOrganMessage({
      text: 'Demo interest saved. A future care team flow can connect you with official guidance.',
      type: 'success',
    });
    showToast('Donation interest saved for this demo.', 'success');
  };

  return (
    <div className="min-h-dvh bg-[var(--surface-sunken)] flex flex-col">
      {/* Community topbar matching original donation.js */}
      <Topbar variant="landing" />

      {/* Main split finder container */}
      <div className="flex-1 max-w-[1240px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SEARCH & RESULTS PANEL (7 cols) */}
        <aside className="lg:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            {/* Intro & Tab Switch */}
            <div className="mb-6">
              <div className="w-full sm:w-auto inline-flex bg-[var(--surface-sunken)] border border-[var(--line)] rounded-full p-1 gap-1 mb-3">
                <button
                  type="button"
                  onClick={() => handleTabChange('blood')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                    activeTab === 'blood' ? 'bg-[#0a3b69] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[#0a3b69]'
                  }`}
                >
                  <Droplets size={14} /> Blood
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('organ')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                    activeTab === 'organ' ? 'bg-[#0a3b69] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[#0a3b69]'
                  }`}
                >
                  <HeartHandshake size={14} /> Organ
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a3b69] tracking-tight">
                {activeTab === 'blood' ? (
                  <>Find blood <span className="text-[#0f5ca8]">donation support.</span></>
                ) : (
                  <>Organ donation <span className="text-[#0f5ca8]">interest.</span></>
                )}
              </h1>
            </div>

            {/* BLOOD TAB CONTENT */}
            {activeTab === 'blood' && (
              <div className="space-y-5">
                {/* Blood group grid */}
                <fieldset>
                  <legend className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2">
                    Select blood group
                  </legend>
                  <div className="grid grid-cols-4 gap-2">
                    {BLOOD_GROUPS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGroup(g)}
                        className={`nd-bg-btn h-11 rounded-xl text-sm font-extrabold border transition-all cursor-pointer ${
                          selectedGroup === g
                            ? 'active bg-[#0a3b69] text-white border-[#0a3b69] shadow-sm'
                            : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] hover:bg-[var(--mint)] hover:text-[var(--teal)]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* City search & geolocation */}
                <div>
                  <label htmlFor="nd-blood-city" className="block text-xs font-bold text-[var(--text)] mb-1">
                    City or PIN code
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <MapPin size={15} className="absolute left-3 top-3 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        id="nd-blood-city"
                        type="text"
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        placeholder="e.g. Hyderabad or 500034"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleLocate}
                      disabled={locating}
                      title="Use my location"
                      className="w-10 h-10 rounded-xl border border-[var(--line)] bg-white flex items-center justify-center text-[#0a3b69] hover:bg-[#f0f7fc] transition-colors shrink-0"
                    >
                      {locating ? <Loader2 size={16} className="animate-spin" /> : <Locate size={16} />}
                    </button>
                  </div>
                  {locationLabel && (
                    <div className="flex items-center gap-1 text-[0.7rem] text-[#0f5ca8] mt-1 font-semibold">
                      <Navigation size={10} />
                      <span>{locationLabel}</span>
                      <button
                        type="button"
                        onClick={() => { setLocationLabel(''); setCityInput(''); }}
                        className="underline ml-1"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching}
                  className="w-full btn-primary flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-extrabold text-white shadow-sm transition-all"
                  style={{ background: 'var(--teal)' }}
                >
                  {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  <span>Find donation centres</span>
                </button>

                {/* Results Header */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--line)]">
                  <h2 className="text-xs font-extrabold text-[#0a3b69] flex items-center gap-1.5 uppercase tracking-wider">
                    <Droplets size={14} /> Results ({centres.length})
                  </h2>
                  <span className="text-[0.7rem] text-[var(--text-muted)]">Showing demo results for {cityInput}</span>
                </div>

                {/* Results scroll list */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {centres.length === 0 ? (
                    <div className="text-center py-8 p-4 bg-[#f8fafc] border border-[var(--line)] rounded-xl text-[var(--text-muted)]">
                      <SearchX size={28} className="mx-auto mb-2 text-[var(--text-dim)]" />
                      <h3 className="text-xs font-bold text-[var(--text)]">No centres found</h3>
                      <p className="text-[0.75rem] mt-1">No demo centre matched "{cityInput}" for group {selectedGroup}. Try a nearby city or different blood group.</p>
                    </div>
                  ) : (
                    centres.map((c) => (
                      <div key={c.id} className="p-3.5 bg-white border border-[var(--line)] rounded-xl hover:border-[#0f5ca8]/40 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                              {selectedGroup}
                            </div>
                            <div>
                              <strong className="text-xs font-bold text-[#0a3b69] block">{c.name}</strong>
                              <span className="text-[0.75rem] text-[var(--text-muted)] block mt-0.5">{c.area} · {c.hours}</span>
                              <small className="text-[0.7rem] text-[var(--text-dim)] block mt-0.5">{c.note}</small>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[0.7rem] font-bold text-[#0f5ca8] flex items-center gap-1 justify-end">
                              <MapPin size={11} /> {c.distance}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-[var(--line)] flex justify-end">
                          <button
                            type="button"
                            onClick={() => showToast(`${c.name} accepts blood donation enquiries.`, 'info')}
                            className="flex items-center gap-1 text-[0.7rem] font-bold text-[#0f5ca8] hover:underline"
                          >
                            <Phone size={11} /> Contact centre <ChevronRight size={11} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Before you donate aside */}
                <div className="p-4 bg-[#f0f7fc] border border-[#c2dcf3] rounded-xl flex items-start gap-3 text-xs text-[#0a3b69]">
                  <ShieldCheck size={18} className="shrink-0 mt-0.5 text-[#0f5ca8]" />
                  <div>
                    <strong className="block font-bold">Before you donate</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-[0.75rem] text-[var(--text-muted)]">
                      <li>Use official screening and eligibility guidance.</li>
                      <li>Bring valid identification where required.</li>
                      <li>Do not share confidential health data in this demo.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ORGAN TAB CONTENT */}
            {activeTab === 'organ' && (
              <div className="space-y-5">
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Record a non-binding demo interest so a care team can explain official next steps.
                </p>

                <form onSubmit={handleOrganSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">
                      Your name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={organName}
                      onChange={(e) => setOrganName(e.target.value)}
                      placeholder="e.g. Asha Rao"
                      className="w-full p-2.5 rounded-xl border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">
                      City or state <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={organCity}
                      onChange={(e) => setOrganCity(e.target.value)}
                      placeholder="e.g. Hyderabad"
                      className="w-full p-2.5 rounded-xl border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] mb-1">Interest</label>
                    <select
                      value={organPref}
                      onChange={(e) => setOrganPref(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[var(--line)] text-xs bg-[var(--surface)] focus:border-[#0f5ca8] focus:outline-none"
                    >
                      <option>Learn about donation</option>
                      <option>Register interest with a care team</option>
                      <option>Support a family conversation</option>
                    </select>
                  </div>

                  <label className="flex items-start gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={organConsent}
                      onChange={(e) => setOrganConsent(e.target.checked)}
                      required
                      className="mt-0.5 rounded border-[var(--line)] text-[#0f5ca8]"
                    />
                    <span>I understand this demo is not a legal donor registration or consent form.</span>
                  </label>

                  <button
                    type="submit"
                    className="w-full btn-primary flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-extrabold text-white shadow-sm transition-all"
                    style={{ background: 'var(--teal)' }}
                  >
                    <HeartHandshake size={16} /> Save demo interest
                  </button>
                </form>

                {organMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs ${
                      organMessage.type === 'success'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                  >
                    {organMessage.text}
                  </div>
                )}

                {/* Organ aside */}
                <div className="p-4 bg-[#f0f7fc] border border-[#c2dcf3] rounded-xl flex items-start gap-3 text-xs text-[#0a3b69]">
                  <Scale size={18} className="shrink-0 mt-0.5 text-[#0f5ca8]" />
                  <div>
                    <strong className="block font-bold">Important distinction</strong>
                    <p className="text-[0.75rem] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      Legal organ donation registration depends on your country, official registry, family process, and clinical guidance.
                    </p>
                    <a
                      href="https://notto.mohfw.gov.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-[#0f5ca8] hover:underline mt-1"
                    >
                      Visit India's official NOTTO site <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom disclaimer */}
          <div className="mt-6 pt-3 border-t border-[var(--line)] flex items-center gap-2 text-[0.7rem] text-[var(--text-dim)]">
            <Info size={13} className="shrink-0" />
            <span>This is a prototype demonstration. All data shown does not represent legal or actual clinical donation pledges.</span>
          </div>
        </aside>

        {/* RIGHT VISUAL MAP AREA (5 cols) with OpenStreetMap Leaflet */}
        <section className="lg:col-span-5 flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-md overflow-hidden min-h-[480px]">
          {/* Map Top Bar */}
          <div className="px-4 py-3 bg-[var(--surface)] border-b border-[var(--line)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-[#0a3b69]">
              <MapPin size={15} className="text-[#0f5ca8]" />
              <span>OpenStreetMap Live Blood & Organ Network</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eaf4fd] text-[#0f5ca8]">
              {centres.length} centres mapped
            </span>
          </div>

          {/* Map Canvas */}
          <div className="relative flex-1 w-full min-h-[380px]">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
          </div>

          {/* Map Bottom Attribution & Quick Info */}
          <div className="px-4 py-2.5 bg-[#f8fbfe] border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Free, open-source cartography (OpenStreetMap contributors)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([17.4399, 78.4637], 12);
                }
              }}
              className="text-[#0f5ca8] font-semibold hover:underline"
            >
              Reset view
            </button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
