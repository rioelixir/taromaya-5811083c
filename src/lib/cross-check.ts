// Cross-check engine.
//
// Kundli, Panchang, Transits and Horoscope each have their own page, but they
// must always describe the SAME sky for the same birth and time inputs.
// This module recomputes the shared facts from every one of those engines and
// reports whether they agree, so a drift in one module is caught immediately
// instead of confusing the reader.
//
// One convention matters here: the Panchang reads its five limbs at local
// sunrise (the classical "Panchang of the day"), while a birth chart reads
// them at the exact birth minute. So the almanac is compared against the chart
// engine run at the almanac's own reference moment, never against a different
// instant — otherwise a correct difference would look like a bug.

import { computeKundli, RASHIS, NAKSHATRAS, lahiriAyanamsa } from "./vedic";
import { computePanchang } from "./panchang";
import { computeCurrentSky } from "./transits";
import { moonRashi, sunRashi, nakshatraOfDay, moonPhaseInfo } from "./horoscope";

export type CrossCheckInput = {
  year: number; month: number; day: number;
  hour: number; minute: number;
  tzOffsetHours: number;
  latitude: number; longitude: number;
  /** Instant used for the "now" engines (transits / horoscope of the day). */
  now?: Date;
};

export type CrossCheckItem = {
  key: string;
  label: string;          // plain-English name of the fact
  modules: string[];      // which pages must agree on it
  values: Record<string, string>;
  ok: boolean;
  detail: string;         // plain sentence about the comparison
};

export type CrossCheckReport = {
  ok: boolean;
  checked: number;
  failed: number;
  items: CrossCheckItem[];
  birthInstantUtc: string;
  nowUtc: string;
};

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const NAK_SPAN = 360 / 27;

/** The exact UTC instant of birth from local clock time + place offset. */
export function birthInstant(i: CrossCheckInput): Date {
  return new Date(
    Date.UTC(i.year, i.month - 1, i.day, i.hour, i.minute, 0) -
      i.tzOffsetHours * 3600_000,
  );
}

/** Tithi number from a Sun/Moon sidereal longitude pair (same rule everywhere). */
export function tithiFromLongitudes(sunLon: number, moonLon: number): number {
  return Math.floor(norm360(moonLon - sunLon) / 12) + 1;
}

/** Run the shared chart engine for an exact instant at a place. */
function chartAt(at: Date, latitude: number, longitude: number) {
  return computeKundli({
    year: at.getUTCFullYear(), month: at.getUTCMonth() + 1, day: at.getUTCDate(),
    hour: at.getUTCHours(), minute: at.getUTCMinutes(),
    tzOffsetHours: 0, latitude, longitude,
  });
}

export function runCrossCheck(input: CrossCheckInput): CrossCheckReport {
  const at = birthInstant(input);
  const now = input.now ?? new Date();
  const items: CrossCheckItem[] = [];

  const chart = computeKundli({
    year: input.year, month: input.month, day: input.day,
    hour: input.hour, minute: input.minute,
    tzOffsetHours: input.tzOffsetHours,
    latitude: input.latitude, longitude: input.longitude,
  });
  const kMoon = chart.planets.find((p) => p.name === "Moon")!;
  const kSun = chart.planets.find((p) => p.name === "Sun")!;

  // 1. Moon's star at the birth minute: chart engine vs horoscope engine.
  {
    const a = kMoon.nakshatra;
    const b = nakshatraOfDay(at).index;
    items.push({
      key: "moon-nakshatra",
      label: "Moon's star at birth",
      modules: ["Kundli", "Horoscope"],
      values: { Kundli: NAKSHATRAS[a]!, Horoscope: NAKSHATRAS[b]! },
      ok: a === b,
      detail: "Both pages read the Moon's star from the same sidereal position at your birth minute.",
    });
  }

  // 2. Quarter of the star (pada).
  {
    const a = kMoon.pada;
    const b = nakshatraOfDay(at).pada;
    items.push({
      key: "moon-pada",
      label: "Quarter of the star (pada)",
      modules: ["Kundli", "Horoscope"],
      values: { Kundli: String(a), Horoscope: String(b) },
      ok: a === b,
      detail: "The quarter inside the star comes from the same longitude, so it must be identical.",
    });
  }

  // 3. Moon sign.
  {
    const a = kMoon.rashi;
    const b = moonRashi(at).index;
    items.push({
      key: "moon-rashi",
      label: "Moon sign at birth",
      modules: ["Kundli", "Horoscope"],
      values: { Kundli: RASHIS[a]!, Horoscope: RASHIS[b]! },
      ok: a === b,
      detail: "Your Rashiphal is read from this sign, so it must match your chart.",
    });
  }

  // 4. Sun sign (sidereal).
  {
    const a = kSun.rashi;
    const b = sunRashi(at).index;
    items.push({
      key: "sun-rashi",
      label: "Sun sign at birth (Vedic)",
      modules: ["Kundli", "Horoscope"],
      values: { Kundli: RASHIS[a]!, Horoscope: RASHIS[b]! },
      ok: a === b,
      detail: "The Vedic Sun sign is the same on both pages. A Western Sun sign can differ by one sign, which is expected.",
    });
  }

  // 5. Almanac for the birth date vs the chart engine at the almanac's own
  //    reference moment (local sunrise of that Vedic day).
  {
    const p = computePanchang({ date: at, latitude: input.latitude, longitude: input.longitude });
    const ref = chartAt(p.refMoment, input.latitude, input.longitude);
    const rMoon = ref.planets.find((x) => x.name === "Moon")!;
    const rSun = ref.planets.find((x) => x.name === "Sun")!;
    items.push({
      key: "panchang-star",
      label: "Almanac star matches the chart engine",
      modules: ["Panchang", "Kundli"],
      values: { Panchang: p.nakshatra.name, "Chart engine": NAKSHATRAS[rMoon.nakshatra]! },
      ok: p.nakshatra.index === rMoon.nakshatra,
      detail: "The almanac reads the star at sunrise; the same engine at that same moment must give the same star.",
    });
    items.push({
      key: "panchang-tithi",
      label: "Almanac Moon day matches the chart engine",
      modules: ["Panchang", "Kundli"],
      values: {
        Panchang: String(p.tithi.number),
        "Chart engine": String(tithiFromLongitudes(rSun.longitude, rMoon.longitude)),
      },
      ok: p.tithi.number === tithiFromLongitudes(rSun.longitude, rMoon.longitude),
      detail: "The Moon day is the gap between the Sun and the Moon, so the almanac and the chart must land on the same number.",
    });
  }

  // 6. Star and sign must agree with each other (star arc inside its sign).
  {
    const signFromStar = Math.floor((kMoon.nakshatra * NAK_SPAN + (kMoon.pada - 1) * (NAK_SPAN / 4)) / 30);
    const ok = Math.abs(signFromStar - kMoon.rashi) <= 1; // a pada can straddle a sign edge
    items.push({
      key: "star-sign-coherence",
      label: "Star and sign line up",
      modules: ["Kundli", "Panchang"],
      values: { "From star": RASHIS[signFromStar] ?? "—", "From longitude": RASHIS[kMoon.rashi]! },
      ok,
      detail: "A star always sits inside one or two neighbouring signs, so these cannot contradict each other.",
    });
  }

  // 7. Transits: the current sky read as Western and as Vedic must differ by
  //    exactly the fixed shift, nothing else.
  {
    const sky = computeCurrentSky(now, input.latitude, input.longitude);
    const trop = sky.tropicalPlanets.find((p) => p.name === "Sun")!.tropicalLongitude;
    const sid = sky.planets.find((p) => p.name === "Sun")!.longitude;
    const gap = norm360(trop - sid);
    const expected = lahiriAyanamsa(now);
    items.push({
      key: "transit-ayanamsa",
      label: "Sky now: Western and Vedic agree",
      modules: ["Transits", "Horoscope"],
      values: { Difference: `${gap.toFixed(3)}°`, "Expected shift": `${expected.toFixed(3)}°` },
      ok: Math.abs(gap - expected) < 0.05,
      detail: "The only difference between the Western and the Vedic sky should be the fixed shift.",
    });
  }

  // 8. Today's star: almanac vs horoscope, compared at the almanac's moment.
  {
    const pToday = computePanchang({ date: now, latitude: input.latitude, longitude: input.longitude });
    const a = pToday.nakshatra.index;
    const b = nakshatraOfDay(pToday.refMoment).index;
    items.push({
      key: "today-nakshatra",
      label: "Moon's star today",
      modules: ["Panchang", "Horoscope", "Transits"],
      values: { Panchang: NAKSHATRAS[a]!, Horoscope: NAKSHATRAS[b]! },
      ok: a === b,
      detail: "Today's star appears on several pages and must be the same on all of them.",
    });
  }

  // 9. Moon shape vs Moon half today (growing light means the bright half).
  {
    const pToday = computePanchang({ date: now, latitude: input.latitude, longitude: input.longitude });
    const waxing = moonPhaseInfo(pToday.refMoment).waxing;
    const shukla = pToday.tithi.paksha === "Shukla";
    items.push({
      key: "phase-paksha",
      label: "Moon shape matches the Moon half",
      modules: ["Horoscope", "Panchang"],
      values: {
        Horoscope: waxing ? "Growing brighter" : "Fading",
        Panchang: shukla ? "Bright half" : "Dark half",
      },
      ok: waxing === shukla,
      detail: "If the Moon is gaining light, the almanac must be in the bright half.",
    });
  }

  // 10. Houses always start from the Lagna sign (used by Kundli and Transits).
  {
    const ok = chart.houses.every((sign, i) => sign === (chart.ascendant.rashi + i) % 12);
    items.push({
      key: "house-frame",
      label: "House frame is the same everywhere",
      modules: ["Kundli", "Transits"],
      values: { "House 1": RASHIS[chart.houses[0]!]!, Ascendant: RASHIS[chart.ascendant.rashi]! },
      ok,
      detail: "Transit houses are counted from the same first house as your birth chart.",
    });
  }

  const failed = items.filter((i) => !i.ok).length;
  return {
    ok: failed === 0,
    checked: items.length,
    failed,
    items,
    birthInstantUtc: at.toISOString(),
    nowUtc: now.toISOString(),
  };
}
