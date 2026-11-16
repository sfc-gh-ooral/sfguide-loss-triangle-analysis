'use client';

// The reader's Sample/Live choice, kept in the browser. Live is only used when the server has a
// Snowflake connection (.env.local); choosing Sample keeps the bundled data even when one exists.
import { useEffect, useState } from 'react';
import { HOSTED_EXAMPLE } from './hosted';

export type Mode = 'live' | 'sample';
const KEY = 'ltri-mode';

export function preferSample(): boolean {
  return typeof window !== 'undefined' && window.localStorage.getItem(KEY) === 'sample';
}
export function setPreferredMode(mode: Mode) {
  window.localStorage.setItem(KEY, mode);
}

let configuredPromise: Promise<boolean> | null = null;
export function serverConfigured(): Promise<boolean> {
  if (HOSTED_EXAMPLE) return Promise.resolve(false);
  configuredPromise ??= fetch('/api/mode').then(r => r.json()).then(j => j.mode === 'live').catch(() => false);
  return configuredPromise;
}

// Resolves once: undefined while checking, then 'live' (connection configured and not opted out) or 'sample'.
export function useMode(): { mode: Mode | undefined; configured: boolean } {
  const [state, setState] = useState<{ mode: Mode | undefined; configured: boolean }>({ mode: undefined, configured: false });
  useEffect(() => {
    let alive = true;
    serverConfigured().then(c => { if (alive) setState({ configured: c, mode: c && !preferSample() ? 'live' : 'sample' }); });
    return () => { alive = false; };
  }, []);
  return state;
}

// Live-mode fetch: never falls back to sample data. Throws with the server's error message.
export async function liveJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error(body.error ?? `${url} returned HTTP ${res.status}`);
  return body as T;
}
