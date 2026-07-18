// KP (Krishnamurti Paddhati) engine — self-contained for the ChartLite shape.
// Provides:
//   • Sub-lord / sub-sub-lord for planets + 12 cusps (whole-sign cusps).
//   • Cuspal significators (planets in the sub of the cusp-lord, occupants,
//     owners of houses whose star-lord matches).
//   • Ruling Planets (current query moment): Day lord, Moon sign/star/sub,
//     Lagna sign/star/sub.
//
// Sidereal longitudes are consumed as-is (ChartLite already stores them).

export type ChartLite = {
  ascendant: { rashi: number; degreeInRashi: number; longitude?: number };
  planets: Array<{
    name: string;
    longitude: number;
    rashi: number;
    house: number;
    degreeInRashi: number;
    retrograde: boolean;
  }>;
};

export const KP_RASHIS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
] as const;

export const KP_NAKSHATRAS = [
  "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
  "Punarvasu","Pushya","Ashlesha","Magha","P.Phalguni","U.Phalguni",
  "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
  "Mula","P.Ashadha","U.Ashadha","Shravana","Dhanishta","Shatabhisha",
  "P.Bhadrapada","U.Bhadrapada","Revati",
] as const;

const RASHI_LORD = [
  "Mars","Venus","Mercury","Moon","Sun","Mercury",
  "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter",
];

const VIM_ORDER = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"] as const;
type Vim = typeof VIM_ORDER[number];
const VIM_YEARS: Record<Vim, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};
const NAK_SPAN = 360 / 27;

const WEEKDAY_LORD = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];

export type KPBreakdown = {
  longitude: number;
  sign: number;
  nakshatra: number;
  starLord: Vim;
  subLord: Vim;
  subSubLord: Vim;
};

export function kpBreakdown(longitude: number): KPBreakdown {
  const lon = ((longitude % 360) + 360) % 360;
  const nakIndex = Math.floor(lon / NAK_SPAN);
  const degInNak = lon - nakIndex * NAK_SPAN;
  const starLord = VIM_ORDER[nakIndex % 9];

  const proportionYears = (degInNak / NAK_SPAN) * 120;
  const startIdx = VIM_ORDER.indexOf(starLord);
  let elapsed = 0;
  let subLord: Vim = starLord;
  let subSpanYears = 0;
  let subStartYears = 0;
  for (let k = 0; k < 9; k++) {
    const pl = VIM_ORDER[(startIdx + k) % 9];
    const yrs = VIM_YEARS[pl];
    if (elapsed + yrs > proportionYears) {
      subLord = pl; subSpanYears = yrs; subStartYears = elapsed; break;
    }
    elapsed += yrs;
  }

  const subProgress = proportionYears - subStartYears;
  const subStartIdx = VIM_ORDER.indexOf(subLord);
  let e2 = 0;
  let subSubLord: Vim = subLord;
  for (let k = 0; k < 9; k++) {
    const pl = VIM_ORDER[(subStartIdx + k) % 9];
    const yrs = (VIM_YEARS[pl] / 120) * subSpanYears;
    if (e2 + yrs > subProgress) { subSubLord = pl; break; }
    e2 += yrs;
  }

  return {
    longitude: lon, sign: Math.floor(lon / 30), nakshatra: nakIndex,
    starLord, subLord, subSubLord,
  };
}

// -------- Planet & cusp sub-lord tables --------

export type KPRow = {
  who: string;
  sign: number;
  nakshatra: number;
  starLord: Vim;
  subLord: Vim;
  subSubLord: Vim;
};

function ascLongitude(chart: ChartLite): number {
  return chart.ascendant.longitude ?? chart.ascendant.rashi * 30 + chart.ascendant.degreeInRashi;
}

export function kpPlanets(chart: ChartLite): KPRow[] {
  const asc = ascLongitude(chart);
  const rows: KPRow[] = [];
  const a = kpBreakdown(asc);
  rows.push({ who: "Ascendant", sign: a.sign, nakshatra: a.nakshatra, starLord: a.starLord, subLord: a.subLord, subSubLord: a.subSubLord });
  for (const p of chart.planets) {
    const b = kpBreakdown(p.longitude);
    rows.push({ who: p.name, sign: b.sign, nakshatra: b.nakshatra, starLord: b.starLord, subLord: b.subLord, subSubLord: b.subSubLord });
  }
  return rows;
}

/** Whole-sign cusps: cusp N sits at ascendant-longitude + (N-1)*30 modulo 360.
 *  For Placidus-precise KP a proper house engine is needed; whole-sign remains
 *  a defensible default in the Vedic-KP hybrid used throughout the app. */
export function kpCusps(chart: ChartLite): KPRow[] {
  const asc = ascLongitude(chart);
  const rows: KPRow[] = [];
  for (let h = 1; h <= 12; h++) {
    const lon = (asc + (h - 1) * 30) % 360;
    const b = kpBreakdown(lon);
    rows.push({ who: `Cusp ${h}`, sign: b.sign, nakshatra: b.nakshatra, starLord: b.starLord, subLord: b.subLord, subSubLord: b.subSubLord });
  }
  return rows;
}

// -------- Cuspal Significators --------
// Standard 4-fold KP significators for a house H:
//   (A) Planets in the star of the occupants of H
//   (B) Occupants of H
//   (C) Planets in the star of the lord of H
//   (D) Lord of H
// De-duplicated, ordered A→D.

export type SignificatorRow = {
  house: number;
  sign: number;
  A: string[]; B: string[]; C: string[]; D: string[];
  combined: string[];
};

export function cuspalSignificators(chart: ChartLite): SignificatorRow[] {
  const asc = ascLongitude(chart);
  const houseSigns: number[] = [];
  for (let h = 1; h <= 12; h++) houseSigns.push(((chart.ascendant.rashi + (h - 1)) % 12));

  // Precompute each planet's star lord (as a name) and its house.
  const starOf = new Map<string, string>();
  const houseOf = new Map<string, number>();
  for (const p of chart.planets) {
    const b = kpBreakdown(p.longitude);
    starOf.set(p.name, b.starLord);
    houseOf.set(p.name, p.house);
  }

  return houseSigns.map((sign, i) => {
    const h = i + 1;
    // B: occupants (planets whose house === h)
    const B = chart.planets.filter((p) => p.house === h).map((p) => p.name);
    // A: planets whose star-lord is any occupant of H
    const A = B.length
      ? chart.planets.filter((p) => B.includes(starOf.get(p.name) ?? "")).map((p) => p.name)
      : [];
    // D: lord(s) of sign
    const lord = RASHI_LORD[sign];
    const D = [lord];
    // C: planets whose star-lord === D
    const C = chart.planets.filter((p) => starOf.get(p.name) === lord).map((p) => p.name);

    const combined: string[] = [];
    for (const arr of [A, B, C, D]) for (const n of arr) if (!combined.includes(n)) combined.push(n);
    return { house: h, sign, A, B, C, D, combined };
  });
}

// -------- Ruling Planets (for current moment) --------

export type RulingPlanets = {
  weekdayLord: string;
  moonSignLord: string;
  moonStarLord: string;
  moonSubLord: string;
  ascSignLord: string;
  ascStarLord: string;
  ascSubLord: string;
  combined: string[];
};

/**
 * Compute Ruling Planets. `now` and `nowLagnaLon` describe the query moment;
 * `moonLon` is the current sidereal Moon. If a live-moon input is missing,
 * the natal moon from the chart is used as a fallback so the table still
 * renders — that variant reflects the birth chart's ruling planets.
 */
export function rulingPlanets(
  now: Date,
  nowLagnaLon: number,
  moonLon: number,
): RulingPlanets {
  const weekdayLord = WEEKDAY_LORD[now.getDay()];

  const m = kpBreakdown(moonLon);
  const l = kpBreakdown(nowLagnaLon);

  const moonSignLord = RASHI_LORD[m.sign];
  const ascSignLord = RASHI_LORD[l.sign];

  const combined: string[] = [];
  for (const n of [weekdayLord, moonSignLord, m.starLord, m.subLord, ascSignLord, l.starLord, l.subLord]) {
    if (!combined.includes(n)) combined.push(n);
  }

  return {
    weekdayLord,
    moonSignLord, moonStarLord: m.starLord, moonSubLord: m.subLord,
    ascSignLord, ascStarLord: l.starLord, ascSubLord: l.subLord,
    combined,
  };
}
