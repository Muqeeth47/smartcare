'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeartPulse, Globe, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useShallow } from 'zustand/react/shallow';

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
  const { theme, setTheme, showToast } = useAppStore(
    useShallow((s) => ({ theme: s.theme, setTheme: s.setTheme, showToast: s.showToast }))
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

  // ── Topbar controls shared across variants ─────────────────────────────────
  const Controls = (
    <div className="topbar-control-group flex items-center gap-2">
      {/* Workspace & Patient navigation toggle (collapses on desktop, opens drawer on mobile) */}
      {(variant === 'workspace' || variant === 'patient') && onMenuClick && (
        <button
          type="button"
          id="sidebar-toggle-btn"
          onClick={onMenuClick}
          aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!isSidebarCollapsed}
          title={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          className="topbar-control-btn mobile-menu-btn flex items-center justify-center w-9 h-9 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] text-[var(--teal)] hover:bg-[var(--mint)] transition-colors cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* Language selector */}
      <div className="lang-dropdown-wrapper relative flex items-center gap-1 h-9 px-2.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--mint)] transition-colors">
        <Globe size={14} className="lang-globe-icon text-[var(--text-muted)] shrink-0 pointer-events-none" />
        <select
          id="global-lang-select"
          value={lang}
          onChange={handleLangChange}
          aria-label="Select language"
          className="lang-select-native appearance-none bg-transparent text-[var(--text)] text-xs font-semibold border-none outline-none cursor-pointer pr-4 max-w-[5rem]"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <ChevronDown size={11} className="lang-dropdown-icon text-[var(--text-muted)] shrink-0 pointer-events-none absolute right-1.5" />
      </div>

      {/* Theme toggle */}
      <button
        id="theme-toggle-btn"
        onClick={handleThemeToggle}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        title={`Theme: ${themeLabel} (Click to toggle)`}
        className="topbar-control-btn flex items-center gap-1.5 h-9 px-2.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] text-xs font-bold hover:bg-[var(--mint)] transition-colors"
      >
        <ThemeIcon size={14} />
        <span className="hidden sm:inline">{themeLabel}</span>
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
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="brand-lockup flex items-center gap-2.5 no-underline shrink-0">
            <span className="brand-mark w-10 h-10 rounded-[0.9rem] flex items-center justify-center text-white" style={{ background: 'var(--teal-dark)', boxShadow: '0 8px 18px rgba(18,61,53,.20)' }}>
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
          {backHref && (
            <Link href={backHref} className="text-xs text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors hidden sm:flex items-center gap-1">
              {backLabel || 'Back to home'}
            </Link>
          )}
          {Controls}
        </div>
      </header>
    );
  }

  // ── Landing topbar — exact match to old shell-nav ──────────────────────────
  // Old: white bg, brand-lockup left, nav-links centre, nav-actions right
  return (
    <header
      data-section="site-header"
      className="shell-nav sticky top-0 z-[100] bg-[var(--surface)] border-b border-[var(--line)]"
    >
      <div className="max-w-[1240px] mx-auto px-5 sm:px-6 h-[70px] flex items-center justify-between gap-4">

        {/* Brand lockup */}
        <Link href="/" aria-label="SmartCare home" className="brand-lockup flex items-center gap-3 no-underline shrink-0">
          <span
            className="brand-mark w-[2.7rem] h-[2.7rem] rounded-[0.9rem] flex items-center justify-center text-white shrink-0"
            style={{ background: 'var(--teal-dark)', boxShadow: '0 8px 18px rgba(18,61,53,.20)' }}
          >
            <HeartPulse size={21} />
          </span>
          <span className="flex flex-col">
            <span className="brand-name text-[0.95rem] font-extrabold text-[var(--text)] leading-none">SmartCare</span>
            <span className="brand-caption text-[0.6rem] text-[var(--text-muted)] leading-none mt-0.5 uppercase tracking-widest">Care access, simplified</span>
          </span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav className="nav-links hidden md:flex items-center gap-6" aria-label="Primary navigation">
          <a href="#how-it-works" className="text-[0.88rem] font-bold text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors no-underline">How it works</a>
          <a href="#for-providers"  className="text-[0.88rem] font-bold text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors no-underline">For hospitals</a>
          <Link href="/donate"      className="text-[0.88rem] font-bold text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors no-underline">Donation</Link>
          <a href="#trust"          className="text-[0.88rem] font-bold text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors no-underline">Why SmartCare</a>
        </nav>

        {/* Actions: lang + theme + sign in + sign up */}
        <div className="nav-actions flex items-center gap-2">
          {Controls}
          <Link
            id="nav-login"
            href="/login"
            className="btn-ghost flex items-center justify-center h-[2.75rem] px-3 rounded-[0.65rem] text-[0.84rem] font-extrabold text-[var(--text-muted)] hover:bg-[var(--mint)] transition-colors border border-transparent no-underline"
          >
            Sign in
          </Link>
          <Link
            id="nav-signup"
            href="/login?mode=signup"
            className="btn-primary flex items-center justify-center h-[2.75rem] px-4 rounded-[0.65rem] text-[0.84rem] font-extrabold text-white transition-all no-underline"
            style={{ background: 'var(--teal)', boxShadow: '0 4px 12px rgba(15,92,168,.28)' }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
