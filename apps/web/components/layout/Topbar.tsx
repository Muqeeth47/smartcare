'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HeartPulse,
  Globe,
  ChevronDown,
  Sun,
  Moon,
  Siren,
  Menu,
  X,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'en', label: 'English (EN)' },
  { code: 'hi', label: 'हिन्दी (HI)' },
  { code: 'te', label: 'తెలుగు (TE)' },
  { code: 'ta', label: 'தமிழ் (TA)' },
  { code: 'bn', label: 'বাংলা (BN)' },
  { code: 'mr', label: 'मराठी (MR)' },
  { code: 'es', label: 'Español (ES)' },
];

interface TopbarProps {
  variant?: 'landing' | 'workspace' | 'patient';
  onMenuClick?: () => void;
  isSidebarCollapsed?: boolean;
  backHref?: string;
  backLabel?: string;
  title?: string;
  subtitle?: string;
}

export function Topbar({
  variant = 'landing',
  onMenuClick,
  isSidebarCollapsed = false,
  backHref,
  backLabel,
  title,
  subtitle,
}: TopbarProps) {
  const pathname = usePathname() || '';
  const isAmbulancePage = pathname.startsWith('/ambulance');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const { theme, setTheme, showToast, fontScale, setFontScale } = useAppStore(
    useShallow((s) => ({
      theme: s.theme,
      setTheme: s.setTheme,
      showToast: s.showToast,
      fontScale: s.fontScale,
      setFontScale: s.setFontScale,
    }))
  );
  const [lang, setLang] = useState('en');

  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
      if (match?.[1]) {
        const code = match[1].split('/')[2];
        if (code) setLang(code);
      }
    } catch {}
  }, []);

  const handleThemeToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} mode`, 'info');
  };

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setLang(code);
    document.cookie = `googtrans=/en/${code}; path=/;`;
    document.cookie = `googtrans=/en/${code}; domain=.${location.hostname}; path=/;`;
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (combo) {
      combo.value = code;
      combo.dispatchEvent(new Event('change'));
    } else {
      location.reload();
    }
  };

  const ThemeIcon = theme === 'dark' ? Moon : Sun;
  const themeLabel = theme === 'dark' ? 'Dark' : 'Light';

  // ── Persistent Glowing SOS Ambulance Button ────────────────────────────────
  const SosBeaconButton = !isAmbulancePage ? (
    <Link
      id="global-sos-ambulance-btn"
      href="/ambulance"
      className={cn(
        "items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-white bg-red-600 hover:bg-red-700 transition shadow-md shrink-0 no-underline",
        variant === 'landing' ? "inline-flex" : "hidden sm:inline-flex"
      )}
      style={{
        boxShadow: '0 0 12px rgba(229, 62, 62, 0.65)',
        minHeight: '34px',
      }}
      title="Emergency Ambulance Dispatch"
    >
      <Siren className="w-3.5 h-3.5 animate-pulse text-white" />
      <span className="tracking-wide uppercase text-[11px] font-black">SOS Ambulance</span>
    </Link>
  ) : null;

  // ── Topbar controls shared across variants ─────────────────────────────────
  const Controls = (
    <div className="topbar-control-group flex items-center gap-1 sm:gap-1.5 shrink-0">
      {/* Persistent SOS Button */}
      {SosBeaconButton}

      {/* Font size controls: A- A A+ (Desktop/tablet only to ensure mobile controls fit in 320px) */}
      <div
        className="font-scale-controls hidden sm:flex items-center border border-[var(--line)] rounded-[var(--radius)] overflow-hidden bg-[var(--surface)] divide-x divide-[var(--line)] shrink-0"
        aria-label="Font size controls"
      >
        <button
          id="font-scale-decrease"
          type="button"
          onClick={() => setFontScale(fontScale - 1)}
          disabled={fontScale <= -2}
          title="Decrease font size"
          aria-label="Decrease font size"
          className="flex items-center justify-center w-7 sm:w-8 h-8 text-[0.7rem] font-bold text-[var(--text-muted)] hover:bg-[var(--mint)] hover:text-[var(--teal)] transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
        >
          A<span className="text-[0.5rem] leading-none">-</span>
        </button>
        <button
          id="font-scale-reset"
          type="button"
          onClick={() => setFontScale(0)}
          title="Reset font size to default"
          aria-label="Reset font size"
          className="flex items-center justify-center w-7 sm:w-8 h-8 text-[0.78rem] font-extrabold transition-colors cursor-pointer"
          style={{ color: fontScale === 0 ? 'var(--teal)' : 'var(--text-muted)' }}
        >
          A
        </button>
        <button
          id="font-scale-increase"
          type="button"
          onClick={() => setFontScale(fontScale + 1)}
          disabled={fontScale >= 2}
          title="Increase font size"
          aria-label="Increase font size"
          className="flex items-center justify-center w-7 sm:w-8 h-8 text-[0.9rem] font-bold text-[var(--text-muted)] hover:bg-[var(--mint)] hover:text-[var(--teal)] transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
        >
          A<span className="text-[0.55rem] leading-none">+</span>
        </button>
      </div>

      {/* Language selector */}
      <div className="lang-dropdown-wrapper">
        <Globe size={13} className="lang-globe-icon" />
        <select
          id="global-lang-select"
          value={lang}
          onChange={handleLangChange}
          aria-label="Select language"
          className="lang-select-native"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <ChevronDown size={11} className="lang-dropdown-icon" />
      </div>

      {/* Theme toggle */}
      <button
        id="theme-toggle-btn"
        onClick={handleThemeToggle}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        title={`Theme: ${themeLabel} (Click to toggle)`}
        className="topbar-control-btn flex items-center justify-center gap-1.5 min-w-[38px] min-h-[38px] h-9 px-2 sm:px-2.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] text-xs font-bold hover:bg-[var(--mint)] active:scale-95 transition-all shrink-0"
      >
        <ThemeIcon size={14} />
        <span className="hidden xl:inline">{themeLabel}</span>
      </button>
    </div>
  );

  // ── Workspace / Patient topbar ─────────────────────────────────────────────
  if (variant === 'workspace' || variant === 'patient') {
    return (
      <header
        data-topbar
        className="flex items-center justify-between gap-3 h-14 bg-[var(--surface)] border-b border-[var(--line)] sticky top-0 z-[100]"
        style={{
          paddingLeft: 'max(1.15rem, calc(0.85rem + env(safe-area-inset-left, 0px)))',
          paddingRight: 'max(1.15rem, calc(0.85rem + env(safe-area-inset-right, 0px)))',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Sidebar toggle button positioned on top-left BEFORE the logo */}
          {onMenuClick && (
            <button
              type="button"
              id="sidebar-toggle-btn"
              onClick={onMenuClick}
              aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              aria-expanded={!isSidebarCollapsed}
              title={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              className="topbar-control-btn flex items-center justify-center min-w-[38px] min-h-[38px] w-9 h-9 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] text-[var(--teal)] hover:bg-[var(--mint)] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          <Link href="/" className="brand-lockup flex items-center gap-2.5 no-underline shrink-0">
            <span className="brand-mark w-9 h-9 rounded-[0.8rem] flex items-center justify-center text-white shrink-0" style={{ background: 'var(--teal-dark)', boxShadow: '0 8px 18px rgba(18,61,53,.20)' }}>
              <HeartPulse size={19} />
            </span>
            <span className="hidden sm:flex flex-col">
              <span className="brand-name text-[0.9rem] font-extrabold text-[var(--text)] leading-none">SmartCare</span>
              {subtitle && <span className="brand-caption text-[0.6rem] text-[var(--text-muted)] leading-none mt-0.5">{subtitle}</span>}
            </span>
          </Link>
          {title && <span className="text-[0.8rem] text-[var(--text-muted)] truncate hidden md:block">/ {title}</span>}
        </div>

        <div className="flex items-center gap-2">
          {Controls}
        </div>
      </header>
    );
  }

  // ── Landing topbar (Sleek, slim single-row navigation) ──────────────────────
  return (
    <header data-section="site-header" className="site-header">
      <div className="site-nav-container">

        {/* 1. Left: Brand lockup */}
        <Link href="/" aria-label="SmartCare home" className="flex items-center gap-2.5 sm:gap-3 no-underline shrink-0">
          <span
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ background: 'var(--teal-dark)' }}
          >
            <HeartPulse size={20} />
          </span>
          <span className="flex flex-col">
            <span className="text-sm sm:text-base font-black text-[var(--text)] leading-none tracking-tight">SmartCare</span>
            <span className="text-[0.58rem] sm:text-[0.62rem] font-bold text-[var(--text-muted)] leading-none mt-0.5 tracking-wider uppercase hidden sm:block">
              Care access, simplified
            </span>
          </span>
        </Link>

        {/* 2. Middle: Desktop Navigation Links (Clean single line, hidden on mobile) */}
        <nav className="hidden lg:flex items-center gap-2" aria-label="Main navigation">
          <a href="/#how-it-works" className="nav-link-item">How it works</a>
          <a href="/#for-providers" className="nav-link-item">For hospitals</a>
        </nav>

        {/* 3. Right: Desktop Controls & Auth (Hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {Controls}
          <Link
            id="nav-login"
            href="/login"
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-muted)] hover:text-[var(--teal)] hover:bg-[var(--mint)] transition-colors no-underline"
          >
            Sign in
          </Link>
          <Link
            id="nav-signup"
            href="/login?mode=signup"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm no-underline"
            style={{ background: 'var(--teal)' }}
          >
            Sign up
          </Link>
        </div>

        {/* 4. Mobile Quick Actions & Hamburger (Visible only on < 1024px) */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0">
          {/* Mobile SOS Pill */}
          {!isAmbulancePage && (
            <Link
              href="/ambulance"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black text-white bg-red-600 hover:bg-red-700 transition shadow-sm no-underline shrink-0"
              style={{ minHeight: '32px' }}
              title="Emergency Ambulance"
            >
              <Siren className="w-3 h-3 animate-pulse text-white" />
              <span className="tracking-wide uppercase">SOS</span>
            </Link>
          )}

          {/* Mobile Theme Toggle */}
          <button
            type="button"
            onClick={handleThemeToggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] active:scale-95 transition-all"
          >
            <ThemeIcon size={14} />
          </button>

          {/* Mobile Hamburger Toggle Button with enhanced touch ergonomics & active morph */}
          <button
            type="button"
            id="landing-mobile-menu-toggle"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileNavOpen}
            aria-controls="landing-mobile-menu-sheet"
            aria-haspopup="true"
            className={cn(
              "flex items-center justify-center min-w-[42px] min-h-[42px] w-10 h-10 rounded-xl border transition-all duration-200 cursor-pointer shrink-0 active:scale-90",
              mobileNavOpen
                ? "bg-[var(--teal)] text-white border-[var(--teal)] shadow-sm ring-2 ring-[var(--teal)]/30"
                : "bg-[var(--surface)] border-[var(--line)] text-[var(--text)] hover:bg-[var(--mint)] hover:text-[var(--teal)]"
            )}
          >
            <span className={cn("transition-transform duration-200 flex items-center justify-center", mobileNavOpen && "rotate-90")}>
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </span>
          </button>
        </div>
      </div>

      {/* 5. Mobile Flyout Sheet Dropdown */}
      {mobileNavOpen && (
        <div className="lg:hidden border-t border-[var(--line)] bg-[var(--surface)] shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-4 space-y-3 max-h-[calc(100dvh-4rem)] overflow-y-auto">
            {/* Nav Links */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] px-2 mb-0.5">
                Navigation
              </span>
              <a
                href="/#how-it-works"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--text)] hover:bg-[var(--mint)] transition-colors no-underline"
              >
                <span>How it works</span>
              </a>
              <Link
                href="/ambulance"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 transition-colors no-underline"
              >
                <span className="flex items-center gap-2">
                  <Siren className="w-4 h-4 text-red-600" />
                  Ambulance Emergency
                </span>
                <span className="text-[10px] uppercase font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
                  24/7
                </span>
              </Link>

              <a
                href="/#for-providers"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--text)] hover:bg-[var(--mint)] transition-colors no-underline"
              >
                <span>For hospitals</span>
              </a>
            </div>

            <div className="h-px bg-[var(--line)] my-1" />

            {/* Accessibility & Preferences */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] px-2">
                Preferences
              </span>
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-[var(--text-muted)] font-medium">Text Size</span>
                <div className="flex items-center border border-[var(--line)] rounded-lg overflow-hidden bg-[var(--surface)] divide-x divide-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => setFontScale(fontScale - 1)}
                    disabled={fontScale <= -2}
                    className="w-8 h-8 flex items-center justify-center text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--mint)] disabled:opacity-30"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontScale(0)}
                    className="w-8 h-8 flex items-center justify-center text-xs font-black text-[var(--teal)] hover:bg-[var(--mint)]"
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontScale(fontScale + 1)}
                    disabled={fontScale >= 2}
                    className="w-8 h-8 flex items-center justify-center text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--mint)] disabled:opacity-30"
                  >
                    A+
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-[var(--text-muted)] font-medium">Language</span>
                <div className="lang-dropdown-wrapper">
                  <Globe size={13} className="lang-globe-icon" />
                  <select
                    value={lang}
                    onChange={handleLangChange}
                    aria-label="Select language"
                    className="lang-select-native"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="lang-dropdown-icon" />
                </div>
              </div>
            </div>

            <div className="h-px bg-[var(--line)] my-1" />

            {/* Auth CTA Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/login"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-center h-10 px-4 rounded-xl border border-[var(--line)] text-xs font-bold text-[var(--text)] hover:bg-[var(--mint)] transition-colors no-underline"
              >
                Sign in
              </Link>
              <Link
                href="/login?mode=signup"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-center h-10 px-4 rounded-xl text-xs font-bold text-white bg-[var(--teal)] shadow-sm hover:opacity-95 transition-all no-underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
