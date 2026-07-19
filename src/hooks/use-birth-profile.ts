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
