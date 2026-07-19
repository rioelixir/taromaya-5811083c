import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBirthProfile, saveBirthProfile, type BirthProfile } from "@/lib/birth-profile.functions";


export function useBirthProfile() {
  const fetchFn = useServerFn(getBirthProfile);
  return useQuery<BirthProfile | null>({
    queryKey: ["birth-profile"],
    queryFn: () => fetchFn(),
    staleTime: 60_000,
  });
}

export type BirthProfileInput = {
  full_name: string;
  gender?: string | null;
  birth_date: string;
  birth_time: string;
  tz_offset_hours: number;
  place: string;
  latitude: number;
  longitude: number;
};

export function useSaveBirthProfile() {
  const qc = useQueryClient();
  const saveFn = useServerFn(saveBirthProfile);
  return useMutation<BirthProfile, Error, BirthProfileInput>({
    mutationFn: (input) => saveFn({ data: input }),
    onSuccess: (data) => {
      qc.setQueryData(["birth-profile"], data);
    },
  });
}

/** Convert a stored BirthProfile into KundliInput fields. */
export function birthProfileToKundliInput(p: BirthProfile) {
  const [y, m, d] = p.birth_date.split("-").map(Number);
  const [hh, mm, ss] = p.birth_time.split(":").map(Number);
  return {
    year: y, month: m, day: d,
    hour: hh ?? 0, minute: mm ?? 0, seconds: ss ?? 0,
    tzOffsetHours: Number(p.tz_offset_hours),
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
  };
}

/** Map a BirthProfile to the common form-state field strings shared across modules. */
export function birthProfileToFormFields(p: BirthProfile) {
  const time = p.birth_time.length >= 5 ? p.birth_time.slice(0, 5) : p.birth_time;
  return {
    name: p.full_name ?? "",
    date: p.birth_date,
    time,
    tz: String(p.tz_offset_hours),
    lat: String(p.latitude),
    lon: String(p.longitude),
    place: p.place ?? "",
    seconds: "0",
  };
}

/**
 * Autofill a module form with the user's saved birth profile once it loads.
 * Only hydrates the fields the form actually has, and only runs once so the
 * user can freely edit afterwards without being overwritten.
 */
export function useAutofillBirth<T extends Record<string, unknown>>(
  setForm: (updater: (prev: T) => T) => void,
) {
  const { data: profile } = useBirthProfile();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !profile) return;
    done.current = true;
    const fields = birthProfileToFormFields(profile);
    setForm((prev) => {
      const next = { ...prev } as Record<string, unknown>;
      for (const [k, v] of Object.entries(fields)) {
        if (k in next) next[k] = v;
      }
      return next as T;
    });
  }, [profile, setForm]);
  return profile ?? null;
}
