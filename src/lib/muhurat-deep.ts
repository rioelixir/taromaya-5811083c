// Muhurat Deep — Choghadiya + Hora tables for a chosen date/location.
// Choghadiya = 8 parts of day (sunrise→sunset) and 8 parts of night (sunset→next sunrise).

import * as A from "astronomy-engine";
import { computeHoras, type HoraSlot, HORA_NATURE } from "./hora";

export type ChoghadiyaName = "Amrit" | "Shubh" | "Labh" | "Char" | "Udveg" | "Rog" | "Kaal";
export type ChoghadiyaNature = "Good" | "Neutral" | "Bad";

export const CHOGH_META: Record<ChoghadiyaName, {
  nature: ChoghadiyaNature;
  lord: string;
  best: string;
}> = {
  Amrit: { nature: "Good",    lord: "Moon",    best: "All new beginnings, weddings, spiritual work" },
  Shubh: { nature: "Good",    lord: "Jupiter", best: "Auspicious ceremonies, education, upanayana" },
  Labh:  { nature: "Good",    lord: "Mercury", best: "Business, finance, contracts, learning" },
  Char:  { nature: "Neutral", lord: "Venus",   best: "Travel, movement, art, entertainment" },
  Udveg: { nature: "Bad",     lord: "Sun",     best: "Government work, litigation only" },
  Rog:   { nature: "Bad",     lord: "Mars",    best: "Warfare, disputes; avoid celebrations" },
  Kaal:  { nature: "Bad",     lord: "Saturn",  best: "Savings, acquisition of assets; avoid new ventures" },
};

// Weekday (Sun=0..Sat=6) → first choghadiya of day and night.
const DAY_START: ChoghadiyaName[]   = ["Udveg","Amrit","Rog","Labh","Shubh","Char","Kaal"];
const NIGHT_START: ChoghadiyaName[] = ["Shubh","Char","Kaal","Udveg","Amrit","Rog","Labh"];
// Fixed cycle order used forward from the starting slot.
const CYCLE: ChoghadiyaName[] = ["Udveg","Char","Labh","Amrit","Kaal","Shubh","Rog"];

export type ChoghSlot = {
  index: number;
  name: ChoghadiyaName;
  nature: ChoghadiyaNature;
  from: Date;
  to: Date;
  isDay: boolean;
};

export function computeChoghadiya(sunrise: Date, sunset: Date, nextSunrise: Date, weekday: number): ChoghSlot[] {
  const out: ChoghSlot[] = [];
  const dayUnit = (sunset.getTime() - sunrise.getTime()) / 8;
  const nightUnit = (nextSunrise.getTime() - sunset.getTime()) / 8;
  const dayStart = CYCLE.indexOf(DAY_START[weekday % 7]);
  const nightStart = CYCLE.indexOf(NIGHT_START[weekday % 7]);
  for (let i = 0; i < 8; i++) {
    const name = CYCLE[(dayStart + i) % 7];
    out.push({
      index: i + 1,
      name,
      nature: CHOGH_META[name].nature,
      from: new Date(sunrise.getTime() + i * dayUnit),
      to:   new Date(sunrise.getTime() + (i + 1) * dayUnit),
      isDay: true,
    });
  }
  for (let i = 0; i < 8; i++) {
    const name = CYCLE[(nightStart + i) % 7];
    out.push({
      index: i + 9,
      name,
      nature: CHOGH_META[name].nature,
      from: new Date(sunset.getTime() + i * nightUnit),
      to:   new Date(sunset.getTime() + (i + 1) * nightUnit),
      isDay: false,
    });
  }
  return out;
}

// Compute sunrise/sunset via astronomy-engine.
function riseSet(body: A.Body, dir: 1 | -1, from: Date, observer: A.Observer): Date | null {
  const t = A.SearchRiseSet(body, observer, dir, from, 2);
  return t ? t.date : null;
}

export type MuhuratDeepDay = {
  date: Date;
  sunrise: Date | null;
  sunset: Date | null;
  nextSunrise: Date | null;
  weekday: number;
  choghadiya: ChoghSlot[];
  horas: HoraSlot[];
};

export function computeMuhuratDeep(dateISO: string, lat: number, lon: number): MuhuratDeepDay {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(y, m - 1, d, 0, 0, 0);
  const observer = new A.Observer(lat, lon, 0);
  const sunrise = riseSet(A.Body.Sun, +1, date, observer);
  const sunset  = sunrise ? riseSet(A.Body.Sun, -1, sunrise, observer) : null;
  const nextSunrise = sunset ? riseSet(A.Body.Sun, +1, sunset, observer) : null;
  const weekday = (sunrise ?? date).getDay();
  const choghadiya = (sunrise && sunset && nextSunrise)
    ? computeChoghadiya(sunrise, sunset, nextSunrise, weekday) : [];
  const horas = (sunrise && sunset && nextSunrise)
    ? computeHoras(sunrise, sunset, nextSunrise, weekday) : [];
  return { date, sunrise, sunset, nextSunrise, weekday, choghadiya, horas };
}

export { HORA_NATURE };
