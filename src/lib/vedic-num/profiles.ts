/**
 * Unlimited saved profiles for the Vedic Numerology product.
 *
 * Profiles live in this browser only — no account needed — so a consultant can
 * keep as many client sheets as they like without a sign-in wall.
 */
import { useCallback, useEffect, useState } from "react";

export type NumProfile = {
  id: string;
  fullName: string;
  birthName?: string;
  birthDate: string;
  gender?: string;
  mobile?: string;
  businessName?: string;
  place?: string;
  createdAt: string;
};

const KEY = "taromaya.vedic-numerology.profiles";
const ACTIVE = "taromaya.vedic-numerology.active";
const EVT = "taromaya-num-profiles";

function read(): NumProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as NumProfile[]) : [];
  } catch {
    return [];
  }
}

function write(list: NumProfile[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* storage full or blocked */ }
  window.dispatchEvent(new Event(EVT));
}

function readActive(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(ACTIVE); } catch { return null; }
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<NumProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => { setProfiles(read()); setActiveId(readActive()); };
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((p: Omit<NumProfile, "id" | "createdAt"> & { id?: string }) => {
    const list = read();
    const id = p.id ?? (globalThis.crypto?.randomUUID?.() ?? String(Date.now()));
    const existing = list.find((x) => x.id === id);
    const row: NumProfile = {
      ...existing,
      ...p,
      id,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    write(existing ? list.map((x) => (x.id === id ? row : x)) : [row, ...list]);
    try { window.localStorage.setItem(ACTIVE, id); } catch { /* ignore */ }
    window.dispatchEvent(new Event(EVT));
    return id;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((x) => x.id !== id));
    if (readActive() === id) {
      try { window.localStorage.removeItem(ACTIVE); } catch { /* ignore */ }
    }
    window.dispatchEvent(new Event(EVT));
  }, []);

  const select = useCallback((id: string) => {
    try { window.localStorage.setItem(ACTIVE, id); } catch { /* ignore */ }
    window.dispatchEvent(new Event(EVT));
  }, []);

  const active = profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null;
  return { profiles, active, save, remove, select };
}
