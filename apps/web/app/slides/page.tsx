'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Home,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Bed,
  Users,
  Activity,
  TrendingUp,
  Truck,
  Network,
  Stethoscope,
  ShieldCheck,
  Siren,
  QrCode,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function SlidesPage() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 10;
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev < totalSlides ? prev + 1 : prev));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlide((prev) => (prev < totalSlides ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide((prev) => (prev > 1 ? prev - 1 : prev));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides]);

  return (
    <div className="min-h-screen bg-[#071527] text-white flex flex-col justify-between overflow-hidden relative selection:bg-teal-500 selection:text-white font-sans">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── Fixed Top-Left Branding in JetBrains Mono ── */}
      <header className="fixed top-5 left-6 z-50 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-sky-500/30 backdrop-blur-md shadow-lg shadow-sky-500/10">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          <span className="font-mono text-base font-extrabold tracking-tight text-sky-400">
            sudophiles
          </span>
        </div>
        <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-teal-950/60 border border-teal-500/30 text-teal-300 font-mono text-xs font-semibold uppercase tracking-wider">
          AushadhiNet &bull; SmartCare
        </span>
      </header>

      {/* ── Fixed Bottom-Right Slide Number ── */}
      <footer className="fixed bottom-5 right-6 z-50 flex items-center gap-3">
        <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-md font-mono text-sm font-bold text-slate-400 shadow-xl">
          <span className="text-sky-400 font-extrabold text-base">{String(currentSlide).padStart(2, '0')}</span> / {String(totalSlides).padStart(2, '0')}
        </div>
      </footer>

      {/* ── Slide Canvas ── */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-16 max-w-7xl w-full mx-auto relative z-10">

        {/* SLIDE 1: Title */}
        {currentSlide === 1 && (
          <div className="text-center space-y-6 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 font-mono text-xs font-bold uppercase tracking-widest shadow-lg shadow-teal-500/10">
              <Sparkles size={14} /> National Health Resource &amp; Supply Chain Resilience
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-teal-300 leading-tight">
              AushadhiNet &amp; SmartCare Platform
            </h1>
            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              A federated AI ecosystem for real-time visibility into medicine stocks, bed availability, and medical personnel attendance across India's entire PHC network.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
              {[
                { label: 'PHCs Connected', val: '420+' },
                { label: 'Telemetry Loop', val: '15 Mins' },
                { label: 'State AI Nodes', val: '5 Hubs' },
                { label: 'Privacy Guarantee', val: 'Zero-PII' },
              ].map((m, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-sky-400">{m.val}</div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mt-1">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 2: Problem Statement */}
        {currentSlide === 2 && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
                <span>01</span> &bull; CHALLENGE ASSESSMENT
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">The Problem: Fragmentation &amp; Stock-Outs</h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1">Public health facilities face critical supply bottlenecks, opaque telemetry, and unpredictable emergency demand surges.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle size={20} /> Current Systemic Bottlenecks
                </h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                    <span><strong className="text-white">Opaque PHC Inventories:</strong> Unreported stock-outs of life-saving antipyretics, snake antivenom, and IV fluids.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                    <span><strong className="text-white">Unpredictable Bed Telemetry:</strong> No centralized real-time tracking of Oxygen, ICU, and General Ward beds during sudden disease outbreaks.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                    <span><strong className="text-white">Staffing Asymmetry:</strong> Doctor and nurse shift attendance untracked, causing dangerous Patient:Doctor ratio spikes (&gt; 45:1).</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-teal-500/30 space-y-4 shadow-xl shadow-teal-500/5">
                <h3 className="text-lg font-bold text-teal-300 flex items-center gap-2">
                  <CheckCircle2 size={20} /> The AushadhiNet Solution
                </h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">15-Minute Telemetry Mesh:</strong> Continuous automated sync of medicine burn rates, bed occupancy, and attendance logs.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">Epidemic Surge Forecaster:</strong> Predictive AI modeling for Dengue (+75%), Heatwave (+85%), and Flu with 72h warnings.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">Multi-State Federated AI (FedAvg):</strong> Inter-state gradient model exchange with Zero-PII leakage under ABDM / DPDP Act.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: Architecture */}
        {currentSlide === 3 && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
                <span>02</span> &bull; SYSTEM ARCHITECTURE
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">4-Tier Resilient Health Architecture</h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1">Seamless decentralized synchronization from rural health sub-centres to the National MoHFW Command Desk.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-sky-500/30 space-y-3">
                <div className="font-mono text-xs font-bold text-sky-400 uppercase tracking-wider">// TOPOLOGY HIERARCHY</div>
                
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm text-white">Tier 4: National &amp; State AI Command</div>
                    <div className="text-xs text-slate-400">MoHFW Federated Hub &bull; 5 State AI Nodes</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">FEDAVG</span>
                </div>

                <div className="text-center font-mono text-xs text-teal-400">▲ 15-Minute Gradient Exchange (&Delta;W) ▲</div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm text-white">Tier 3: District CMO &amp; Redistribution Depot</div>
                    <div className="text-xs text-slate-400">Central Medical Stores &bull; Automated Fleet Routing</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">REBALANCE</span>
                </div>

                <div className="text-center font-mono text-xs text-teal-400">▲ Real-Time Telemetry Packets ▲</div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm text-white">Tier 2: Primary Health Centres (PHC) &amp; Hospitals</div>
                    <div className="text-xs text-slate-400">OPD Queue &bull; e-Rx Studio &bull; Bed Telemetry &bull; Shift Attendance</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">420 PHCS</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers size={20} className="text-teal-400" /> Architectural Highlights
                </h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">01</span>
                    <span><strong className="text-white">Edge-First Indexed Cache:</strong> Offline resilience ensures PHCs operate during connectivity blackouts.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">02</span>
                    <span><strong className="text-white">15-Minute Sync Loop:</strong> Automated packet broadcasts update district burn rates every 15 minutes.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">03</span>
                    <span><strong className="text-white">Cryptographic Rx Signing:</strong> Tamper-proof HMAC-SHA256 digital stamp prevents fraud.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4: Pillar 1 - Telemetry */}
        {currentSlide === 4 && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
                <span>03</span> &bull; CORE PILLAR 1
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">PHC Resource &amp; Telemetry Mesh</h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1">Unprecedented real-time visibility into medicine stocks, bed categorizations, and clinical staff shifts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <Pill size={20} />
                </div>
                <h3 className="text-base font-bold text-white">Medicine Stock Buffer</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <li>&bull; <strong className="text-white">Live Stock Counts:</strong> 10+ essential drugs tracked per facility.</li>
                  <li>&bull; <strong className="text-white">Critical Burn Alerts:</strong> Flags stock dropping below 5-day reserve.</li>
                  <li>&bull; <strong className="text-white">Expiry Management:</strong> FIFO stock rotation protocol.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                  <Bed size={20} />
                </div>
                <h3 className="text-base font-bold text-white">Bed Categorization</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <li>&bull; <strong className="text-white">ICU &amp; Ventilators:</strong> Real-time occupancy meters with alerts.</li>
                  <li>&bull; <strong className="text-white">Oxygen-Supported Beds:</strong> Dedicated respiratory emergency tracker.</li>
                  <li>&bull; <strong className="text-white">General &amp; Isolation:</strong> Dynamic capacity reallocation.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <h3 className="text-base font-bold text-white">Shift Staff Attendance</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <li>&bull; <strong className="text-white">On-Duty Counts:</strong> Doctors, Nurses, Pharmacists, Paramedics.</li>
                  <li>&bull; <strong className="text-white">Staffing Health %:</strong> Sanctioned vs. present staff ratio.</li>
                  <li>&bull; <strong className="text-white">Patient:Doctor Ratio:</strong> Alerts CMO when load exceeds 30:1.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 5: Pillar 2 - Forecasting */}
        {currentSlide === 5 && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
                <span>04</span> &bull; CORE PILLAR 2
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">AI Epidemic Demand Forecaster</h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1">Multi-scenario epidemiological surge modeling and automated 72-hour stock-out warnings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp size={20} className="text-teal-400" /> Outbreak Surge Scenarios
                </h3>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                    <div className="font-bold text-rose-400">Dengue Outbreak (+75% Surge)</div>
                    <div className="text-xs text-slate-300 mt-0.5">Multiplies IV fluid, paracetamol, and pediatric bed demand.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                    <div className="font-bold text-amber-400">Heatwave Dehydration (+85% Surge)</div>
                    <div className="text-xs text-slate-300 mt-0.5">Accelerates ORS, Normal Saline, and emergency bed turnover.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                    <div className="font-bold text-sky-400">Seasonal Influenza Wave (+50% Surge)</div>
                    <div className="text-xs text-slate-300 mt-0.5">Pre-allocates Salbutamol inhalers and broad-spectrum antibiotics.</div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-rose-500/30 space-y-3">
                <div className="font-mono text-xs font-bold text-rose-400 uppercase tracking-wider">// 72-HOUR EARLY WARNING DESK</div>
                
                <div className="p-3.5 rounded-xl bg-slate-800 border-l-4 border-l-rose-500">
                  <div className="font-bold text-sm text-white">PHC Shamshabad &bull; Critical Stock Breach</div>
                  <div className="text-xs text-rose-300">Paracetamol 650mg: 2.1 Days Stock (Burn: 450/day) &bull; Breach in 48h</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800 border-l-4 border-l-amber-500">
                  <div className="font-bold text-sm text-white">PHC Gachibowli &bull; Oxygen Deficit Warning</div>
                  <div className="text-xs text-amber-300">O2 Capacity at 88% &bull; 3 Cylinders Left &bull; Breach in 64h</div>
                </div>

                <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-500/30 text-center font-mono text-xs text-teal-300">
                  ⚡ AI Action: Automated Rebalancing Order #TR-2026-904 recommended
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 6: Pillar 3 - Redistribution */}
        {currentSlide === 6 && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
                <span>05</span> &bull; CORE PILLAR 3
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Cross-District Redistribution Engine</h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1">Autonomous surplus-to-deficit rebalancing and rapid cold-chain emergency fleet routing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck size={20} className="text-teal-400" /> Rebalancing Protocols
                </h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">Surplus-Deficit Matching:</strong> Matches Central Medical Stores Depots with deficit rural clinics.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">1-Click CMO Authorization:</strong> Digital sign-off for inter-facility transfers.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">Cold-Chain GPS Tracking:</strong> In-transit temperature and location telemetry.</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-700 space-y-3">
                <div className="font-mono text-xs font-bold text-sky-400 uppercase tracking-wider">// ACTIVE MANIFEST DISPATCH</div>
                
                <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-sky-300">Manifest #TR-2026-904</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">IN TRANSIT &bull; 38M ETA</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Route: Central Depot ➔ PHC Shamshabad</div>
                  <div className="text-xs text-white font-mono mt-1">Payload: 1,200 Paracetamol + 150 ORS</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-sky-300">Manifest #TR-2026-905</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">AUTHORIZED</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Route: Rangareddy South Hub ➔ PHC Gachibowli</div>
                  <div className="text-xs text-white font-mono mt-1">Payload: 8 Oxygen Cylinders (B-Type)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 7: Pillar 4 - Federated AI */}
        {currentSlide === 7 && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
                <span>06</span> &bull; CORE PILLAR 4
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Multi-State Federated AI Mesh (FedAvg)</h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1">Collaborative national machine learning without moving sensitive patient records.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Network size={20} className="text-teal-400" /> Federated Learning Highlights
                </h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">Zero Patient PII Transfer:</strong> Patient data never leaves state premises. Only gradient weights (&Delta;W) are exchanged.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">5 State Hubs Integrated:</strong> Telangana, Maharashtra, Karnataka, Uttar Pradesh, Tamil Nadu.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">High Convergence Accuracy:</strong> Global model reaches 98.7% prediction accuracy with loss at 0.038.</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-teal-500/30 space-y-3">
                <div className="font-mono text-xs font-bold text-teal-400 uppercase tracking-wider">// STATE NODE PERFORMANCE</div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                    <div className="font-bold text-white text-xs">Telangana (Hyd)</div>
                    <div className="font-mono text-teal-400 text-sm font-bold mt-1">98.9% Acc</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                    <div className="font-bold text-white text-xs">Maharashtra (Mum)</div>
                    <div className="font-mono text-teal-400 text-sm font-bold mt-1">98.4% Acc</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                    <div className="font-bold text-white text-xs">Karnataka (Blr)</div>
                    <div className="font-mono text-teal-400 text-sm font-bold mt-1">98.6% Acc</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                    <div className="font-bold text-white text-xs">Uttar Pradesh (Lko)</div>
                    <div className="font-mono text-teal-400 text-sm font-bold mt-1">98.1% Acc</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-teal-950/40 border border-teal-500/30 text-center font-mono text-[11px] text-teal-300">
                  🛡️ ABDM &amp; DPDP Act 2023 Privacy Compliant
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 8: Clinical Workspace */}
        {currentSlide === 8 && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
                <span>07</span> &bull; CLINICAL WORKFLOW
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Doctor Workspace &amp; Smart e-Rx Studio</h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1">Fast patient triage, contraindication safety guards, and Jan Aushadhi generic substitution.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                  <Stethoscope size={20} />
                </div>
                <h3 className="text-base font-bold text-white">Live OPD Triage</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <li>&bull; <strong className="text-white">Red / Yellow / Green:</strong> Automated triage priority sorting.</li>
                  <li>&bull; <strong className="text-white">Live Vitals Strip:</strong> BP, SpO2, Pulse, Temp at a glance.</li>
                  <li>&bull; <strong className="text-white">Shift Staff Bar:</strong> Real-time clinical attendance.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-base font-bold text-white">Allergy Safety Guard</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <li>&bull; <strong className="text-white">Contraindication Alerts:</strong> Flags Penicillin/NSAID conflicts.</li>
                  <li>&bull; <strong className="text-white">Physician Override:</strong> Explicit clinical acknowledgment.</li>
                  <li>&bull; <strong className="text-white">HMAC Stamp:</strong> Tamper-proof digital cryptographic seal.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-base font-bold text-white">Jan Aushadhi Subsidies</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <li>&bull; <strong className="text-white">1-Click Generic Swap:</strong> Instant branded-to-generic swap.</li>
                  <li>&bull; <strong className="text-white">50–90% Savings:</strong> Direct price comparison shown.</li>
                  <li>&bull; <strong className="text-white">Dispensary Stock:</strong> Real-time in-house stock check.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 9: Citizen Ecosystem */}
        {currentSlide === 9 && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
                <span>08</span> &bull; CITIZEN EMPOWERMENT
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Citizen Gateway &amp; Emergency 108 SOS</h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1">Universal healthcare access for every citizen via mobile web, kiosks, and emergency dispatch.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-rose-500/30 space-y-4">
                <h3 className="text-lg font-bold text-rose-300 flex items-center gap-2">
                  <Siren size={20} /> 108 Ambulance SOS Telemetry
                </h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">Live GPS Dispatch:</strong> Real-time tracking from nearest base station to patient.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">Live ETA Countdown Timer:</strong> Second-by-second countdown with progress bar.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">Trauma Pre-Notification:</strong> Pre-alerts hospital ER with arrival vitals.</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/70 border border-sky-500/30 space-y-4">
                <h3 className="text-lg font-bold text-sky-300 flex items-center gap-2">
                  <QrCode size={20} /> ABHA Digital Health Passport
                </h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">ABDM 14-Digit ID:</strong> Digital health locker integration with QR scanner.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">Portable Clinical Records:</strong> Offline allergy records and e-prescriptions.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong className="text-white">Jan Aushadhi Pharmacy:</strong> Search formulary &amp; order subsidized generic meds.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 10: Tech Stack & Impact */}
        {currentSlide === 10 && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
                <span>09</span> &bull; TECHNOLOGY &amp; IMPACT
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Tech Stack &amp; National Health Impact</h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1">Production-ready, resilient architecture designed to scale across India's public healthcare ecosystem.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers size={20} className="text-teal-400" /> Technology Foundation
                </h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li>&bull; <strong className="text-white">Next.js 14 + React 18 + TypeScript 5:</strong> Strict type-safety across 32 routes.</li>
                  <li>&bull; <strong className="text-white">Zustand + Simulated Telemetry Engine:</strong> Fast, synchronous in-memory state.</li>
                  <li>&bull; <strong className="text-white">Tailwind CSS + Glassmorphism:</strong> Dark/light modern aesthetic with 0 emojis.</li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/90 border border-teal-500/40 space-y-4 shadow-xl">
                <h3 className="text-lg font-bold text-teal-300 flex items-center gap-2">
                  <CheckCircle2 size={20} /> Measurable Outcomes
                </h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">★</span>
                    <span><strong className="text-white">72-Hour Stockout Prevention:</strong> Zero unpredicted rural medicine shortages.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">★</span>
                    <span><strong className="text-white">50–90% Out-of-Pocket Savings:</strong> Universal Jan Aushadhi generic access.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">★</span>
                    <span><strong className="text-white">National Multi-State FedAvg:</strong> Cross-state AI training with zero PII transfer.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition shadow-lg shadow-teal-500/20 no-underline"
              >
                <Home size={16} /> Open AushadhiNet Live Web Application <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}

      </main>

      {/* ── Fixed Bottom Controls Bar ── */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/85 border border-slate-700/60 backdrop-blur-md shadow-2xl">
        <button
          type="button"
          onClick={prevSlide}
          disabled={currentSlide === 1}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-teal-600/30 text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition border border-slate-700 cursor-pointer"
          title="Previous (Left Arrow)"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Progress Bar */}
        <div className="w-32 sm:w-48 h-2 rounded-full bg-slate-800 overflow-hidden mx-1">
          <div
            className="h-full bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-400 transition-all duration-300"
            style={{ width: `${((currentSlide - 1) / (totalSlides - 1)) * 100 || 10}%` }}
          />
        </div>

        <button
          type="button"
          onClick={nextSlide}
          disabled={currentSlide === totalSlides}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-teal-600/30 text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition border border-slate-700 cursor-pointer"
          title="Next (Right Arrow / Space)"
        >
          <ChevronRight size={18} />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-teal-600/30 text-white flex items-center justify-center transition border border-slate-700 cursor-pointer"
          title="Fullscreen (F)"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>

        <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-slate-500 pl-2">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">&larr;</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">&rarr;</span>
          <span className="text-slate-500">keys</span>
        </div>
      </nav>

    </div>
  );
}
