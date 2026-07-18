// Jaimini cross-check for Rectification.
// Given a BirthInput, compute a sidereal (Lahiri) chart and expose the
// Chara Karakas + key Arudha Padas so we can compare candidate times
// side by side and flag category-relevant shifts.

import { computeKundli } from "./vedic";
import type { BirthInput } from "./progressions";
import { computeCharaKarakas, computeArudhaPadas, RASHIS, type CharaKaraka } from "./jaimini";
import type { EventCategory } from "./rectification";

export type JaiminiSnapshot = {
  lagnaSign: number;
  karakas: Array<{ karaka: CharaKaraka; planet: string; rashi: number; degree: number }>;
  arudhas: Array<{ house: number; arudha: number; lord: string }>;
};

export function jaiminiSnapshot(birth: BirthInput): JaiminiSnapshot {
  const k = computeKundli({
    year: birth.year, month: birth.month, day: birth.day,
    hour: birth.hour, minute: birth.minute,
    tzOffsetHours: birth.tzOffsetHours,
    latitude: birth.latitude, longitude: birth.longitude,
  });
  const chartLite = {
    ascendant: { rashi: k.ascendant.rashi, degreeInRashi: k.ascendant.degreeInRashi },
    planets: k.planets.map((p) => ({
      name: p.name,
      longitude: p.longitude,
      rashi: p.rashi,
      degreeInRashi: p.degreeInRashi,
      house: ((p.rashi - k.ascendant.rashi + 12) % 12) + 1,
      retrograde: p.retrograde,
    })),
  };
  const karakas = computeCharaKarakas(chartLite);
  const arudhas = computeArudhaPadas(chartLite).map((a) => ({
    house: a.house, arudha: a.arudha, lord: a.lord,
  }));
  return {
    lagnaSign: k.ascendant.rashi,
    karakas,
    arudhas,
  };
}

// Which Jaimini points each event category confirms most strongly.
export const CATEGORY_JAIMINI: Record<EventCategory, {
  karakas: CharaKaraka[]; arudhaHouses: number[]; label: string;
}> = {
  career:     { karakas: ["AmK"],        arudhaHouses: [10],       label: "Amatyakaraka + A10 (career pada)" },
  marriage:   { karakas: ["DK"],         arudhaHouses: [7, 12],    label: "Darakaraka + A7 + Upapada (A12)" },
  childbirth: { karakas: ["PK"],         arudhaHouses: [5],        label: "Putrakaraka + A5 (children pada)" },
  loss:       { karakas: ["GK"],         arudhaHouses: [6, 8],     label: "Gnatikaraka + A6/A8" },
  move:       { karakas: ["MK"],         arudhaHouses: [4],        label: "Matrikaraka + A4 (home pada)" },
  education:  { karakas: ["AmK", "PK"],  arudhaHouses: [4, 5],     label: "AmK/PK + A4/A5" },
  health:     { karakas: ["AK", "GK"],   arudhaHouses: [1, 6],     label: "AK + A1/A6" },
  spiritual:  { karakas: ["AK"],         arudhaHouses: [9, 12],    label: "AK + A9/A12" },
};

export type JaiminiDiff = {
  arudhaShifts: Array<{ house: number; from: number; to: number }>;
  karakaShifts: Array<{ karaka: CharaKaraka; from: string; to: string }>;
  lagnaShift: { from: number; to: number } | null;
};

export function diffJaimini(a: JaiminiSnapshot, b: JaiminiSnapshot): JaiminiDiff {
  const arudhaShifts: JaiminiDiff["arudhaShifts"] = [];
  for (const ar of a.arudhas) {
    const other = b.arudhas.find((x) => x.house === ar.house);
    if (other && other.arudha !== ar.arudha) {
      arudhaShifts.push({ house: ar.house, from: ar.arudha, to: other.arudha });
    }
  }
  const karakaShifts: JaiminiDiff["karakaShifts"] = [];
  for (const k of a.karakas) {
    const other = b.karakas.find((x) => x.karaka === k.karaka);
    if (other && other.planet !== k.planet) {
      karakaShifts.push({ karaka: k.karaka, from: k.planet, to: other.planet });
    }
  }
  return {
    arudhaShifts,
    karakaShifts,
    lagnaShift: a.lagnaSign !== b.lagnaSign ? { from: a.lagnaSign, to: b.lagnaSign } : null,
  };
}

export { RASHIS as JAIMINI_RASHIS };
