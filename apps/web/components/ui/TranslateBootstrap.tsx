'use client';

import { useEffect } from 'react';
import { getSavedLanguage, loadTranslator } from '@/lib/translate';

/**
 * If the visitor chose a language on an earlier page, load Google's translator again so the
 * new page opens already translated. Visitors who never picked a language load nothing.
 */
export function TranslateBootstrap() {
  useEffect(() => {
    if (getSavedLanguage() !== 'en') {
      void loadTranslator();
    }
  }, []);

  return null;
}
