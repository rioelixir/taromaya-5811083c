/**
 * Taromaya Astrology Pro — saved birth profiles.
 *
 * Unlimited family/client profiles kept in this browser, each carrying the
 * full birth record an astrologer needs: name, gender, exact time, place,
 * coordinates, time zone, daylight saving, ayanamsa and a birth-time
 * accuracy note. The active profile feeds every module of the platform.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { computeKundli, type KundliChart } from "@/lib/vedic";
import type { Ayanamsa } from "@/lib/chart-config";

export type Accuracy = "exact" | "approx" | "unknown";

export type ProProfile = {
  id: string;
  fullName: string;
  gender: "female" | "male" | "other" | "unspecified";
  birthDate: string; // yyyy-mm-dd
  birthTime: string; // HH:mm
  place: string;
  latitude: number;
  longitude: number;
  tzOffsetHours: number;
  dst: boolean;
  ayanamsa: Ayanamsa;
  accuracy: Accuracy;
  relation?: string;
  notes?: string;
  createdAt: string;
};

export type ProProfileInput = Omit<ProProfile, "id" | "createdAt"> & { id?: string };

const KEY = "taromaya.astro-pro.profiles";
const ACTIVE = "taromaya.astro-pro.active";
const RECENT = "taromaya.astro-pro.recent-places";
const EVT = "taromaya-astro-pro";

export const ACCURACY_LABEL: Record<Accuracy, string> = {
  exact: "Recorded from a birth certificate or hospital record",
  approx: "Remembered to within roughly half an hour",
  unknown: "Time of day unknown — rectification recommended",
};

function read(): ProProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as ProProfile[]) : [];
  } catch {
    return [];
  }
}

function write(list: ProProfile[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage blocked */
  }
  window.dispatchEvent(new Event(EVT));
}

function readActive(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE);
  } catch {
    return null;
  }
}

/** Places used before, offered as quick picks when adding a profile. */
export function recentPlaces(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT) ?? "[]");
    return Array.isArray(parsed) ? (parsed as string[]).slice(0, 8) : [];
  } catch {
    return [];
  }
}

function rememberPlace(place: string) {
  if (typeof window === "undefined" || !place.trim()) return;
  const next = [place, ...recentPlaces().filter((p) => p !== place)].slice(0, 8);
  try {
    window.localStorage.setItem(RECENT, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function useProProfiles() {
  const [profiles, setProfiles] = useState<ProProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setProfiles(read());
      setActiveId(readActive());
    };
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((p: ProProfileInput) => {
    const list = read();
    const id = p.id ?? globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    const existing = list.find((x) => x.id === id);
    const row: ProProfile = {
      ...p,
      id,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    write(existing ? list.map((x) => (x.id === id ? row : x)) : [row, ...list]);
    rememberPlace(p.place);
    try {
      window.localStorage.setItem(ACTIVE, id);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVT));
    return id;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((x) => x.id !== id));
    if (readActive() === id) {
      try {
        window.localStorage.removeItem(ACTIVE);
      } catch {
        /* ignore */
      }
    }
    window.dispatchEvent(new Event(EVT));
  }, []);

  const select = useCallback((id: string) => {
    try {
      window.localStorage.setItem(ACTIVE, id);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVT));
  }, []);

  const active = profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null;
  return { profiles, active, save, remove, select };
}

/** Birth moment as a real instant, honouring the daylight-saving flag. */
export function profileOffset(p: ProProfile): number {
  return p.tzOffsetHours + (p.dst ? 1 : 0);
}

export function chartForProfile(p: ProProfile): KundliChart | null {
  const [y, m, d] = p.birthDate.split("-").map(Number);
  const [hh, mm] = p.birthTime.split(":").map(Number);
  if (!y || !m || !d) return null;
  try {
    return computeKundli({
      year: y,
      month: m,
      day: d,
      hour: hh ?? 12,
      minute: mm ?? 0,
      seconds: 0,
      tzOffsetHours: profileOffset(p),
      latitude: p.latitude,
      longitude: p.longitude,
      config: { ayanamsa: p.ayanamsa },
    });
  } catch {
    return null;
  }
}

/** The active profile plus its computed chart — the spine of every module. */
export function useProChart() {
  const store = useProProfiles();
  const chart = useMemo(
    () => (store.active ? chartForProfile(store.active) : null),
    [store.active],
  );
  return { ...store, chart };
}
