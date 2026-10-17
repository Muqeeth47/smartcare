'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'smartcare.loginGuard';
const FREE_TRIES = 5;
const BASE_LOCK_SECONDS = 30;
const MAX_LOCK_SECONDS = 15 * 60;

interface GuardState {
  fails: number;
  lockouts: number;
  lockedUntil: number;
}

const EMPTY: GuardState = { fails: 0, lockouts: 0, lockedUntil: 0 };

function read(): GuardState {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return EMPTY;
  }
}

function write(state: GuardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * Slows down password guessing: after 5 wrong tries the form locks for 30 seconds, and each lock
 * after that lasts twice as long (up to 15 minutes). The count survives a page refresh.
 *
 * This runs in the browser, so it only stops casual guessing and simple scripts. Real protection
 * needs the same limit on the server that checks the password.
 */
export function useLoginThrottle() {
  const [lockedFor, setLockedFor] = useState(0);

  const refresh = useCallback(() => {
    const { lockedUntil } = read();
    setLockedFor(Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (lockedFor <= 0) return;
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, [lockedFor, refresh]);

  const recordFailure = useCallback(() => {
    const state = read();
    const fails = state.fails + 1;
    if (fails >= FREE_TRIES) {
      const seconds = Math.min(BASE_LOCK_SECONDS * 2 ** state.lockouts, MAX_LOCK_SECONDS);
      write({ fails: 0, lockouts: state.lockouts + 1, lockedUntil: Date.now() + seconds * 1000 });
    } else {
      write({ ...state, fails });
    }
    refresh();
  }, [refresh]);

  const reset = useCallback(() => {
    write(EMPTY);
    setLockedFor(0);
  }, []);

  return { lockedFor, recordFailure, reset };
}
