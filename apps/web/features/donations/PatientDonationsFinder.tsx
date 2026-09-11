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
  Phone,
  ChevronRight,
  Hand,
  Send,
  Scale,
  ExternalLink,
  Info,
  ClipboardList,
  Printer,
  X,
  ShieldCheck,
  Trash2,
  Mail,
  Share2,
  CheckCircle2,
  User,
  Clock,
  Sparkles,
  AlertCircle,
  Hospital as HospitalIcon,
} from 'lucide-react';
import type { PatientDonationPost } from '@smartcare/types';

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
const ORGANS = ['Kidney', 'Liver', 'Heart', 'Cornea', 'Lung', 'Pancreas'];

interface Centre {
  name: string;
  area: string;
  lat: number;
  lng: number;
  type: 'blood' | 'organ';
  phone: string;
  hours?: string;
  note?: string;
  distance?: string;
}

const DEMO_CENTRES_MAP: Centre[] = [
  { name: 'SmartCare Community Hospital Blood Bank', area: 'Banjara Hills', lat: 17.4126, lng: 78.4482, type: 'blood', phone: '+91 40 2345 6789', hours: '09:00–17:00', note: 'All common blood groups', distance: '1.2 km' },
  { name: 'Red Cross Donation Centre', area: 'Secunderabad', lat: 17.4399, lng: 78.4983, type: 'blood', phone: '+91 40 2780 1234', hours: '10:00–18:00', note: 'Call ahead for stock', distance: '3.8 km' },
  { name: 'CityCare Blood Services', area: 'Kukatpally', lat: 17.4849, lng: 78.3956, type: 'blood', phone: '+91 40 4567 8901', hours: '08:00–16:00', note: 'Bring photo ID', distance: '5.4 km' },
  { name: 'Apollo Organ Coordination', area: 'Jubilee Hills', lat: 17.4239, lng: 78.4101, type: 'organ', phone: '+91 40 2360 7777', hours: '24/7 Helpline', note: 'Transplant coordinator on duty', distance: '2.5 km' },
  { name: 'NOTTO Hyderabad Node', area: 'Begumpet', lat: 17.4437, lng: 78.4637, type: 'organ', phone: '+91 40 2776 5432', hours: '09:30–18:00', note: 'Regional registry center', distance: '4.1 km' },
];

interface ContactInfoModalState {
  name: string;
  phone: string;
  email?: string;
  group: string;
  type: 'blood' | 'organ';
  city: string;
  notes?: string;
  isMyPost?: boolean;
  postId?: string;
  urgency?: string;
  dateStr?: string;
}

export function PatientDonationsFinder() {
  const { email } = useSession();
  const { patientData } = usePatient();
  const { showToast } = useAppStore();

  const patientName = patientData.name || (email === 'patient@smartcare.demo' ? 'Asha Rao' : email ? email.split('@')[0].replace(/[._-]/g, ' ') : 'Asha Rao');
  const patientPhone = (patientData as any)?.phone || '+91 98490 54321';

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
  const [userLocationCoords, setUserLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCentre, setSelectedCentre] = useState<string | null>(null);

  // Form states for Blood Donation Registration
  const [donorName, setDonorName] = useState(patientName);
  const [donorGroup, setDonorGroup] = useState('B+');
  const [donorPhone, setDonorPhone] = useState(patientPhone);
  const [donorNotes, setDonorNotes] = useState('Available to donate on call');
  const [donorUrgency, setDonorUrgency] = useState('Routine');

  // Form states for Organ Registration
  const [organName, setOrganName] = useState(patientName);
  const [organChosen, setOrganChosen] = useState('Kidney');
  const [organPhone, setOrganPhone] = useState(patientPhone);
  const [organCity, setOrganCity] = useState('Hyderabad');
  const [organConsent, setOrganConsent] = useState(false);
  const [organUrgency, setOrganUrgency] = useState('Routine');

  // All community posts & patient's active registrations
  const [allCommunityPosts, setAllCommunityPosts] = useState<PatientDonationPost[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<PatientDonationPost[]>([]);

  // Small Window: Contact Info Modal State
  const [contactModal, setContactModal] = useState<ContactInfoModalState | null>(null);

  // Donor Certificate Honor Card Modal
  const [donorCardModal, setDonorCardModal] = useState<{
    name: string;
    type: 'blood' | 'organ';
    group: string;
    city: string;
    donorId: string;
    dateStr: string;
  } | null>(null);

  // Leaflet map container refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  // Filtered centres
  const filteredCentres = DEMO_CENTRES_MAP.filter((c) => c.type === donationType);

  // Load patient registrations and community posts from DemoDB
  const refreshPosts = () => {
    const data = DemoDB.getDonationsData();
    const posts = data.patientPosts || [];
    setAllCommunityPosts(posts.filter((p) => p.type === donationType));
    setMyRegistrations(
      posts.filter(
        (p) =>
          p.type === donationType &&
          (p.author === patientName || p.author === email || p.name === patientName || p.name === 'Asha Rao')
      )
    );
  };

  useEffect(() => {
    refreshPosts();
    const handleDeleted = () => refreshPosts();
    window.addEventListener('smartcare:donation-post-deleted', handleDeleted);
    return () => window.removeEventListener('smartcare:donation-post-deleted', handleDeleted);
  }, [donationType, patientName, email]);

  // Real Geolocation on page boot
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocationCoords({ lat, lng });
          setCityInput(`Current GPS Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`);

          if (mapInstanceRef.current && window.L) {
            mapInstanceRef.current.flyTo([lat, lng], 13);
            if (!userMarkerRef.current) {
              const userIcon = window.L.divIcon({
                className: '',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
                html: `<div style="width:24px;height:24px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 14px rgba(37,99,235,0.85);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:50%;background:#fff;"></div></div>`,
              });
              userMarkerRef.current = window.L.marker([lat, lng], { icon: userIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup('<strong style="color:#1e3a8a">Your Current Location</strong>');
            } else {
              userMarkerRef.current.setLatLng([lat, lng]);
            }
          }
        },
        () => {
          // Fallback if permission not granted
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    }
  }, []);

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

      const initialCenter: [number, number] = userLocationCoords
        ? [userLocationCoords.lat, userLocationCoords.lng]
        : [17.4399, 78.4637];

      const map = window.L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 12,
        zoomControl: true,
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add centre markers
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
            <div style="margin-top:6px;font-size:11px;font-weight:bold;color:#0f5ca8;">${c.phone}</div>
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

    if (window.L) {
      initLeafletMap();
    } else {
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.onerror = () => {};
        document.head.appendChild(link);
      }
      if (!document.querySelector('#leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initLeafletMap();
        script.onerror = () => {
          console.warn('Leaflet offline or unavailable, fallback active');
        };
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
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocationCoords({ lat, lng });
        setCityInput(`Current Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 14);
        }
        showToast('Location updated to device GPS coordinates', 'success');
      },
      () => {
        showToast('Unable to access device location. Using default Hyderabad.', 'info');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // ── Register as Blood Donor ("I want to give") ─────────────────────────────
  const handleBloodRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newPost: PatientDonationPost = {
      id: `p-don-${Date.now()}`,
      author: patientName,
      name: donorName.trim() || patientName,
      group: donorGroup,
      phone: donorPhone.trim() || '+91 98490 54321',
      email: email || 'patient@smartcare.demo',
      notes: donorNotes.trim() || 'Available for immediate blood donation on call',
      city: cityInput || 'Hyderabad',
      type: 'blood',
      mode: mode === 'give' ? 'give' : 'receive',
      urgency: donorUrgency,
      created_at: new Date().toISOString(),
      date: 'Just now',
      status: 'Available',
    };

    DemoDB.addPatientPost(newPost);
    refreshPosts();
    showToast(
      mode === 'give'
        ? 'Thank you! You are now listed as an active blood donor.'
        : 'Emergency blood request broadcast to network.',
      'success'
    );

    // OPEN SMALL WINDOW WITH PERSON'S CONTACT INFO
    setContactModal({
      name: newPost.name,
      phone: newPost.phone || '+91 98490 54321',
      email: newPost.email,
      group: newPost.group,
      type: 'blood',
      city: newPost.city,
      notes: newPost.notes,
      isMyPost: true,
      postId: newPost.id,
      urgency: newPost.urgency,
      dateStr: 'Just now',
    });
  };

  // ── Register Organ Interest ────────────────────────────────────────────────
  const handleOrganSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPost: PatientDonationPost = {
      id: `organ-${Date.now()}`,
      author: patientName,
      name: organName.trim() || patientName,
      group: organChosen,
      phone: organPhone.trim() || '+91 98490 54321',
      email: email || 'patient@smartcare.demo',
      city: organCity || 'Hyderabad',
      type: 'organ',
      mode: mode === 'give' ? 'give' : 'receive',
      urgency: organUrgency,
      created_at: new Date().toISOString(),
      date: 'Just now',
      status: 'Registered',
    };

    DemoDB.addPatientPost(newPost);
    refreshPosts();
    showToast('Organ donation interest recorded in local database.', 'success');

    // Open contact details window
    setContactModal({
      name: newPost.name,
      phone: newPost.phone || '+91 98490 54321',
      email: newPost.email,
      group: newPost.group,
      type: 'organ',
      city: newPost.city,
      isMyPost: true,
      postId: newPost.id,
      urgency: newPost.urgency,
      dateStr: 'Just now',
    });
  };

  // ── Delete Post Logic ──────────────────────────────────────────────────────
  const handleDeletePost = (postId: string) => {
    const success = DemoDB.deletePatientPost(postId);
    if (success) {
      refreshPosts();
      showToast('Your donation post has been deleted.', 'success');
      if (contactModal?.postId === postId) {
        setContactModal(null);
      }
    } else {
      showToast('Unable to delete post.', 'info');
    }
  };

  // Open Contact Modal for any donor or centre
  const openDonorContact = (post: PatientDonationPost) => {
    const isMine =
      post.author === patientName || post.author === email || post.name === patientName || post.name === 'Asha Rao';
    setContactModal({
      name: post.name,
      phone: post.phone || '+91 98490 54321',
      email: post.email || 'donor@smartcare.org',
      group: post.group,
      type: post.type,
      city: post.city,
      notes: post.notes || 'Voluntary donor in community registry',
      isMyPost: isMine,
      postId: post.id,
      urgency: post.urgency,
      dateStr: post.date || 'Active',
    });
  };

  const openCentreContact = (centre: Centre) => {
    setContactModal({
      name: centre.name,
      phone: centre.phone,
      email: 'bloodbank@smartcare.org',
      group: selectedGroup,
      type: centre.type,
      city: centre.area,
      notes: `${centre.hours || 'Open 24/7'} · ${centre.note || 'Hospital Centre'}`,
      isMyPost: false,
    });
  };

  return (
    <PatientShell subtitle="Donations & Blood Bank" backHref="/dashboard/patient" className="pd-workspace-content">
      <div className="nd-finder-shell border border-[var(--line)] rounded-2xl overflow-hidden bg-[var(--surface)] shadow-sm">
        {/* LEFT PANEL */}
        <aside className="nd-finder-panel flex flex-col min-h-0 bg-[var(--surface)] border-r border-[var(--line)]">
          {/* Header Intro */}
          <div className="nd-finder-intro p-4 sm:p-5 pb-3">
            <div className="eyebrow eyebrow-dark mb-1">
              <span className="eyebrow-dot" /> Community &amp; Hospital Network
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--teal-dark)]">
              Give or receive,<br />
              <span className="text-[var(--teal)]">{patientName}.</span>
            </h1>

            {/* Type Switch (Blood / Organ) */}
            <div className="nd-type-switch mt-3 grid grid-cols-2 gap-1.5" role="tablist" aria-label="Donation type">
              <button
                type="button"
                className={`nd-type-btn min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5 font-bold ${
                  donationType === 'blood' ? 'active' : ''
                }`}
                onClick={() => handleTypeChange('blood')}
              >
                <Droplets size={16} className="text-red-600" /> Blood Donation
              </button>
              <button
                type="button"
                className={`nd-type-btn min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5 font-bold ${
                  donationType === 'organ' ? 'active' : ''
                }`}
                onClick={() => handleTypeChange('organ')}
              >
                <HeartHandshake size={16} className="text-emerald-600" /> Organ Registry
              </button>
            </div>

            {/* Mode tabs (Give / Receive) */}
            <div className="pd-mode-tabs grid grid-cols-2 gap-2 mt-2" role="tablist" aria-label="Give or receive">
              <button
                type="button"
                onClick={() => handleModeChange('give')}
                className={`flex items-center justify-center gap-1.5 min-h-[44px] px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'give'
                    ? 'bg-[var(--teal)] text-white shadow-sm'
                    : 'bg-[var(--mint)] text-[var(--teal-dark)] hover:bg-[#cbe3f7]'
                }`}
              >
                <HeartHandshake size={14} /> I want to give
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('receive')}
                className={`flex items-center justify-center gap-1.5 min-h-[44px] px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'receive'
                    ? 'bg-[var(--teal)] text-white shadow-sm'
                    : 'bg-[var(--mint)] text-[var(--teal-dark)] hover:bg-[#cbe3f7]'
                }`}
              >
                <Hand size={14} /> I need a donation
              </button>
            </div>
          </div>

          {/* BLOOD TAB CONTENT */}
          {donationType === 'blood' && (
            <div className="nd-tab-panel active flex-1 flex flex-col min-h-0 overflow-y-auto">
              <div className="nd-search-controls px-4 sm:px-5 py-3 border-b border-[var(--line)]">
                {/* 8-button blood selector */}
                <fieldset className="nd-blood-selector mb-3">
                  <legend className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center justify-between">
                    <span>Select blood group</span>
                    <span className="text-[10px] text-[var(--teal)] font-extrabold">{selectedGroup} selected</span>
                  </legend>
                  <div className="nd-blood-grid grid grid-cols-4 gap-1.5">
                    {BLOOD_GROUPS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGroup(g)}
                        className={`nd-bg-btn h-10 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                          selectedGroup === g
                            ? 'active bg-[var(--teal)] border-[var(--teal)] text-white shadow-sm'
                            : 'bg-[var(--surface)] border-[var(--line)] text-[var(--text)] hover:bg-[var(--mint)] hover:text-[var(--teal)]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* City Search + GPS Auto-Detect */}
                <div className="nd-field mb-3">
                  <label className="block text-[0.72rem] font-bold text-[var(--text-muted)] mb-1">
                    Your Location / Search Area
                  </label>
                  <div className="nd-input-row flex gap-2">
                    <div className="nd-select-wrap flex-1 flex items-center gap-2 px-3 border border-[var(--line)] rounded-xl bg-[var(--surface)]">
                      <MapPin size={15} className="text-[var(--text-muted)] shrink-0" />
                      <input
                        type="text"
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        placeholder="e.g. Hyderabad"
                        className="w-full text-xs font-semibold py-2.5 outline-none bg-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleLocateGPS}
                      title="Use device GPS location"
                      aria-label="Use GPS"
                      className="w-11 h-11 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--teal)] flex items-center justify-center hover:bg-[var(--mint)] active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <Locate size={18} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (userLocationCoords && mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([userLocationCoords.lat, userLocationCoords.lng], 14);
                    }
                    showToast(`Showing nearest centres for ${selectedGroup}`, 'info');
                  }}
                  className="w-full h-11 rounded-xl bg-[var(--teal)] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[var(--teal-dark)] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                >
                  <Search size={15} /> Find {mode === 'give' ? 'Donation Centres' : 'Blood Units Available'}
                </button>
              </div>

              {/* ── Your Active Registrations (with DELETE action) ── */}
              {myRegistrations.length > 0 && (
                <div className="pd-my-posts p-4 border-b border-[var(--line)] bg-[var(--mint)]/30">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[var(--teal-dark)] mb-2">
                    <span className="flex items-center gap-1.5">
                      <ClipboardList size={14} /> Your Active Donation Posts
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-full font-black">
                      {myRegistrations.length} Active
                    </span>
                  </div>
                  <div className="space-y-2">
                    {myRegistrations.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl flex items-center justify-between text-xs shadow-xs gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-[var(--teal-dark)] font-bold truncate">{p.name}</strong>
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                              {p.group}
                            </span>
                          </div>
                          <span className="block text-[0.7rem] text-[var(--text-muted)] mt-0.5 truncate">
                            {p.phone || 'No phone'} · {p.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openDonorContact(p)}
                            className="px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--teal)] font-bold text-[11px] hover:bg-[var(--mint)]"
                          >
                            View Card
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePost(p.id)}
                            title="Delete this donation post"
                            aria-label="Delete post"
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Community Donors Registry ── */}
              {allCommunityPosts.length > 0 && (
                <div className="px-4 sm:px-5 py-3 border-b border-[var(--line)] bg-[var(--surface)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[var(--teal-dark)] flex items-center gap-1.5">
                      <Droplets size={14} className="text-red-600" /> Community Donors ({allCommunityPosts.length})
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-semibold">Tap to view contact</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {allCommunityPosts.map((donor) => (
                      <div
                        key={donor.id}
                        onClick={() => openDonorContact(donor)}
                        className="p-2.5 rounded-xl border border-[var(--line)] hover:border-[var(--teal)]/40 hover:bg-[var(--mint)]/20 transition-all cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 font-black text-xs flex items-center justify-center shrink-0 border border-red-200">
                            {donor.group}
                          </div>
                          <div className="min-w-0">
                            <strong className="block text-xs font-bold text-[var(--text)] truncate">{donor.name}</strong>
                            <span className="block text-[11px] text-[var(--text-muted)] truncate">{donor.city}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--teal)]">
                            <Phone size={11} /> Contact
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hospital Blood Banks List */}
              <div className="nd-results-header flex items-center justify-between px-4 sm:px-5 py-2.5 bg-[var(--surface-sunken)] border-b border-[var(--line)]">
                <h2 className="text-xs font-extrabold text-[var(--teal-dark)] flex items-center gap-1.5 uppercase tracking-wider">
                  <HospitalIcon size={14} /> Hospital Centres <span className="nd-count ml-1">({filteredCentres.length})</span>
                </h2>
                <span className="text-[0.68rem] text-[var(--text-muted)]">Open for {selectedGroup}</span>
              </div>

              <div className="nd-results-scroll flex-1 overflow-y-auto divide-y divide-[var(--line)]">
                {filteredCentres.map((c) => (
                  <div
                    key={c.name}
                    className={`nd-result-row p-3.5 hover:bg-[var(--mint)]/30 transition-colors ${
                      selectedCentre === c.name ? 'bg-[var(--mint)] border-l-4 border-[var(--teal)]' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleCentreSelect(c)}
                      className="nd-result-select w-full flex items-start gap-3 text-left cursor-pointer"
                    >
                      <div className="nd-blood-avatar w-10 h-10 rounded-xl bg-[var(--mint)] text-[var(--teal-dark)] font-black text-xs flex items-center justify-center shrink-0 border border-[#b8d6f1]">
                        {selectedGroup}
                      </div>
                      <div className="nd-result-info flex-1 min-w-0">
                        <strong className="block text-xs font-bold text-[var(--teal-dark)] truncate">{c.name}</strong>
                        <span className="block text-[0.72rem] text-[var(--text-muted)] mt-0.5">{c.area} · {c.hours}</span>
                        {c.note && <small className="block text-[0.68rem] text-[var(--text-muted)] mt-0.5">{c.note}</small>}
                      </div>
                      <div className="text-right shrink-0 text-[0.7rem] font-bold text-[var(--teal)] flex items-center gap-1">
                        <MapPin size={11} /> {c.distance}
                      </div>
                    </button>
                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-[var(--line)]/50">
                      <button
                        type="button"
                        onClick={() => openCentreContact(c)}
                        className="inline-flex items-center gap-1 text-[0.72rem] font-bold text-[var(--teal)] hover:underline"
                      >
                        <Phone size={12} /> Call Desk: {c.phone}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setContactModal({
                            name: c.name,
                            phone: c.phone,
                            email: 'bloodbank@smartcare.org',
                            group: selectedGroup,
                            type: 'blood',
                            city: c.area,
                            notes: `${c.hours} · Pledged directly to hospital blood bank reserve`,
                            isMyPost: false,
                          });
                          showToast(`Pledged donation to ${c.name}`, 'success');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--teal)] text-white text-[11px] font-extrabold hover:opacity-95"
                      >
                        {mode === 'give' ? 'Pledge Here' : 'Request Units'} <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Donor Form: "I want to donate blood" */}
              <div className="nd-panel-aside p-4 border-t border-[var(--line)] bg-[var(--surface-sunken)]">
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-xs font-black text-[var(--teal-dark)]">
                    {mode === 'give' ? 'Register As Blood Donor' : 'Submit Blood Request'}
                  </strong>
                  <span className="text-[10px] text-[var(--teal)] font-bold uppercase tracking-wider">
                    {mode === 'give' ? 'Instant Listing' : 'Broadcast'}
                  </span>
                </div>
                <form onSubmit={handleBloodRegister} className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-0.5">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="e.g. Asha Rao"
                      className="w-full text-xs p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-0.5">Blood Group *</label>
                      <select
                        value={donorGroup}
                        onChange={(e) => setDonorGroup(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] font-bold"
                      >
                        {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-0.5">Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        placeholder="+91 98490 12345"
                        className="w-full text-xs p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-0.5">Availability Notes</label>
                    <input
                      type="text"
                      value={donorNotes}
                      onChange={(e) => setDonorNotes(e.target.value)}
                      placeholder="e.g. Available on call within 2 hours"
                      className="w-full text-xs p-2 rounded-xl border border-[var(--line)] bg-[var(--surface)]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-[var(--teal)] text-white text-xs font-black flex items-center justify-center gap-2 hover:bg-[var(--teal-dark)] active:scale-[0.98] transition-all shadow-md cursor-pointer"
                  >
                    <Send size={14} /> {mode === 'give' ? 'List Me as Blood Donor & View Contact Info' : 'Broadcast Blood Request'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ORGAN TAB CONTENT */}
          {donationType === 'organ' && (
            <div className="nd-tab-panel active flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {mode === 'give'
                  ? 'Record your voluntary organ donation pledge to help clinical teams match organ requests.'
                  : 'Record a clinical organ guidance request to connect with a transplant coordinator.'}
              </p>

              <form onSubmit={handleOrganSubmit} className="space-y-3">
                <div>
                  <label className="block text-[0.72rem] font-bold text-[var(--text)] mb-1">Full name *</label>
                  <input
                    type="text"
                    required
                    value={organName}
                    onChange={(e) => setOrganName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[0.72rem] font-bold text-[var(--text)] mb-1">
                      {mode === 'give' ? 'Organ of interest' : 'Organ guidance'}
                    </label>
                    <select
                      value={organChosen}
                      onChange={(e) => setOrganChosen(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] font-bold"
                    >
                      {ORGANS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.72rem] font-bold text-[var(--text)] mb-1">Contact phone *</label>
                    <input
                      type="tel"
                      required
                      value={organPhone}
                      onChange={(e) => setOrganPhone(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[0.72rem] font-bold text-[var(--text)] mb-1">City / Region *</label>
                  <input
                    type="text"
                    required
                    value={organCity}
                    onChange={(e) => setOrganCity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)]"
                  />
                </div>
                <label className="flex items-start gap-2 text-[0.72rem] text-[var(--text-muted)] cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={organConsent}
                    onChange={(e) => setOrganConsent(e.target.checked)}
                    className="mt-0.5 rounded text-[var(--teal)]"
                  />
                  <span>I understand this is a digital health record and not a replacement for statutory NOTTO registry documentation.</span>
                </label>
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[var(--teal)] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md hover:bg-[var(--teal-dark)]"
                >
                  <HeartHandshake size={15} /> {mode === 'give' ? 'Save Organ Pledge & View Card' : 'Submit Guidance Request'}
                </button>
              </form>

              {/* NOTTO Aside */}
              <div className="p-3.5 bg-[var(--mint)]/40 border border-[#c2dcf3] rounded-xl text-xs text-[var(--teal-dark)]">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Scale size={15} className="text-[var(--teal)]" /> Official Statutory Registry
                </div>
                <p className="text-[0.72rem] text-[var(--text-muted)] leading-relaxed">
                  Official organ donation registration in India is administered via NOTTO (National Organ &amp; Tissue Transplant Organisation).
                </p>
                <a
                  href="https://notto.mohfw.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-[var(--teal)] hover:underline mt-2"
                >
                  Visit official NOTTO portal <ExternalLink size={11} />
                </a>
              </div>
            </div>
          )}

          {/* Disclaimer bottom */}
          <div className="nd-panel-bottom p-3.5 border-t border-[var(--line)] bg-[var(--surface)] flex items-center gap-2 text-[0.68rem] text-[var(--text-muted)]">
            <Info size={14} className="shrink-0 text-[var(--teal)]" />
            <span>Community registry data is saved locally for this browser session.</span>
          </div>
        </aside>

        {/* RIGHT MAP (Interactive Leaflet Canvas) */}
        <div className="nd-finder-map relative min-h-[420px] bg-[#eaf3fa] overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-0" />

          {/* Map Legend */}
          <div className="nd-map-legend absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-[var(--surface)]/95 backdrop-blur-xs border border-[var(--line)] rounded-xl px-3.5 py-2 text-[0.72rem] shadow-md text-[var(--text-muted)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0f5ca8] inline-block" /> Blood Bank
            <span className="w-2.5 h-2.5 rounded-full bg-[#0a3b69] inline-block ml-2" /> Organ Centre
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] inline-block ml-2" /> Your Location
          </div>
        </div>
      </div>

      {/* ── SMALL WINDOW: DONOR CONTACT INFO MODAL ── */}
      {contactModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          onClick={() => setContactModal(null)}
        >
          <div
            className="w-full sm:max-w-[440px] bg-[var(--surface)] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl border border-[var(--line)] animate-in slide-in-from-bottom-3 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[var(--teal)] to-[var(--teal-dark)] text-white p-5 relative">
              <button
                type="button"
                onClick={() => setContactModal(null)}
                aria-label="Close modal"
                className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                  {contactModal.type === 'blood' ? <Droplets size={24} className="text-red-300" /> : <HeartHandshake size={24} />}
                </div>
                <div className="min-w-0 pr-6">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">
                    {contactModal.type === 'blood' ? 'Verified Blood Donor' : 'Organ Registry Contact'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                    {contactModal.name}
                  </h3>
                  <span className="text-xs text-blue-100/90 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {contactModal.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Body: Contact Details */}
            <div className="p-5 space-y-4 bg-[var(--surface)]">
              {/* Highlight details badge */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-center">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Blood Group / Organ</span>
                  <strong className="text-lg font-black text-red-600 dark:text-red-400 block mt-0.5">
                    {contactModal.group}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-center">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Availability Status</span>
                  <strong className="text-xs font-bold text-emerald-600 block mt-1 flex items-center justify-center gap-1">
                    <CheckCircle2 size={13} /> Active &amp; Ready
                  </strong>
                </div>
              </div>

              {/* Primary Call Action Button */}
              <a
                href={`tel:${contactModal.phone}`}
                className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all no-underline cursor-pointer"
              >
                <Phone size={18} /> Call Donor: {contactModal.phone}
              </a>

              {/* Secondary Email Button */}
              {contactModal.email && (
                <a
                  href={`mailto:${contactModal.email}?subject=Blood%20Donation%20Inquiry%20via%20SmartCare`}
                  className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] font-bold text-xs hover:bg-[var(--mint)] transition-colors no-underline cursor-pointer"
                >
                  <Mail size={15} /> Send Email ({contactModal.email})
                </a>
              )}

              {/* Notes */}
              {contactModal.notes && (
                <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text-muted)]">
                  <span className="font-bold text-[var(--text)] block mb-0.5">Donor Notes:</span>
                  {contactModal.notes}
                </div>
              )}

              {/* Delete Post action if user owns this post */}
              {contactModal.isMyPost && contactModal.postId && (
                <div className="pt-2 border-t border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => handleDeletePost(contactModal.postId!)}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} /> Delete My Donation Listing
                  </button>
                </div>
              )}

              {/* Done button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setContactModal(null)}
                  className="w-full h-10 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] text-xs font-bold text-[var(--text)] hover:bg-[var(--mint)] transition-colors cursor-pointer"
                >
                  Close Window
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
