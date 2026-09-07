'use client';

import { useState, useEffect } from 'react';
import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('smartcare_splash_shown')) {
        return;
      }
      setVisible(true);
      sessionStorage.setItem('smartcare_splash_shown', 'true');

      // Fast, smooth boot: 400ms display, 220ms fade
      const fadeTimer = setTimeout(() => {
        setFading(true);
      }, 400);

      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 620);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } catch {
      // Ignore if sessionStorage is restricted
    }
  }, []);

  if (!mounted || !visible) return null;

  return (
    <main
      id="splash-screen"
      aria-label="Loading SmartCare"
      onClick={() => setVisible(false)}
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
    </main>
  );
}
