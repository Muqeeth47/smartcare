'use client';

import { useEffect } from 'react';

const RELOAD_FLAG = 'smartcare.chunkReloadAt';

function isStaleFileError(reason: unknown): boolean {
  const text = reason instanceof Error ? `${reason.name} ${reason.message}` : String(reason ?? '');
  return /ChunkLoadError|Loading chunk .* failed|Loading CSS chunk .* failed|error loading dynamically imported module/i.test(text);
}

/**
 * After a new version goes live, a page that was already open still asks for the old files, which
 * no longer exist (a 404). The page then shows up as plain unstyled HTML. Reloading once fetches the
 * new files. The flag stops a reload loop if the problem is something else.
 */
export function ChunkReload() {
  useEffect(() => {
    const reloadOnce = () => {
      try {
        const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
        if (Date.now() - last < 30_000) return;
        sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
      } catch {}
      window.location.reload();
    };

    const onError = (e: ErrorEvent) => {
      if (isStaleFileError(e.error ?? e.message)) reloadOnce();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      if (isStaleFileError(e.reason)) reloadOnce();
    };
    // A stylesheet that 404s fires a plain error event on the <link> element, not on window
    const onResourceError = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (el instanceof HTMLLinkElement && el.rel === 'stylesheet' && el.href.includes('/_next/static/')) reloadOnce();
      if (el instanceof HTMLScriptElement && el.src.includes('/_next/static/')) reloadOnce();
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('error', onResourceError, true);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('error', onResourceError, true);
    };
  }, []);

  return null;
}
