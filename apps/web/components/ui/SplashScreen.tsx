'use client';

import { useState, useEffect } from 'react';
import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // If already displayed in this browser session, skip immediately
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('smartcare_splash_shown') === 'true') {
        return;
      }
    } catch {}

    // First visit in session: show briefly
    setVisible(true);

    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 450);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem('smartcare_splash_shown', 'true');
      } catch {}
    }, 700);

    // Hard safety timer: guarantee dismissal even under React StrictMode dev cycles
    const safetyTimer = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem('smartcare_splash_shown', 'true');
      } catch {}
    }, 1100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      clearTimeout(safetyTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      id="splash-screen"
      role="status"
      aria-label="Loading SmartCare"
      onClick={() => {
        setVisible(false);
        try {
          sessionStorage.setItem('smartcare_splash_shown', 'true');
        } catch {}
      }}
      className={cn(
        'splash-screen cursor-pointer select-none',
        fading && 'opacity-0 pointer-events-none'
      )}
    >
      <div className="splash-inner">
        <div className="splash-mark">
          <HeartPulse size={34} />
        </div>
        <h1>SmartCare</h1>
        <p>Care access, clearly organized.</p>
        <div className="splash-progress" aria-hidden="true" />
      </div>
    </div>
  );
}
