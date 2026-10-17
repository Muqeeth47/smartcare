'use client';

import { useEffect } from 'react';

const TYPING_TARGETS = 'input, textarea, select, [contenteditable="true"]';

/**
 * Makes copy-and-paste scraping of the sign-in screen a little harder: no right-click menu, no
 * dragging text or images out, and no copying page text. Typing in the form fields still works
 * normally, including copy and paste inside them.
 *
 * This is a speed bump, not a lock. Anything shown in a browser can still be read by a determined
 * person or a full browser script, so the real protection is the server-side checks.
 */
export function useAntiScrape(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const insideField = (e: Event) => e.target instanceof Element && e.target.closest(TYPING_TARGETS) !== null;

    const blockUnlessField = (e: Event) => {
      if (!insideField(e)) e.preventDefault();
    };

    document.addEventListener('contextmenu', blockUnlessField);
    document.addEventListener('dragstart', blockUnlessField);
    document.addEventListener('copy', blockUnlessField);
    document.addEventListener('cut', blockUnlessField);
    return () => {
      document.removeEventListener('contextmenu', blockUnlessField);
      document.removeEventListener('dragstart', blockUnlessField);
      document.removeEventListener('copy', blockUnlessField);
      document.removeEventListener('cut', blockUnlessField);
    };
  }, [enabled]);
}
