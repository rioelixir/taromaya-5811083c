// Classical almanac layers that sit on top of the core Panchang:
// Samvat era counts, Chandramasa (lunar month), Ritu and Ayana, day/night
// measures, epoch day counts, the extra muhurta windows (Amrit Kalam,
// Varjyam, Ravi Yoga, Dur Muhurtam, the two Sandhyas, Vijaya, Baana),
// the Vasa/Shool set, Gowri Panchangam and the Ghatta Chakra.
//
// Everything here is derived from computed sidereal positions, not lookup
// approximations, except where a classical fixed table is the definition
// itself (for example the Varjyam ghati table, which is scriptural).
import * as A from "astronomy-engine";
import { lahiriAyanamsa, NAKSHATRAS, RASHIS } from "./vedic";
import { WEEKDAY, type Panchang } from "./panchang";

const norm360 = (x: number) => ((x % 360) + 360) % 360;

function tropicalLon(body: A.Body, date: Date): number {
  const g = A.GeoVector(body, date, true);
  const rot = A.Rotation_EQJ_ECT(date);
  const e = A.RotateVector(rot, g);
  return norm360((Math.atan2(e.y, e.x) * 180) / Math.PI);
}
function siderealLon(body: A.Body, date: Date): number {
  return norm360(tropicalLon(body, date) - lahiriAyanamsa(date));
}

// ── Lunar months ────────────────────────────────────────────────────────────
export const CHANDRA_MASA = [
  "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
  "Ashwina", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna",
];

/** Sidereal sign the Sun occupies at a moment (0 = Aries). */
function sunSign(date: Date) {
  return Math.floor(siderealLon(A.Body.Sun, date) / 30);
}

/**
 * Amanta lunar month: named from the sidereal sign the Sun occupies during
 * the lunation that began at the previous New Moon. Purnimanta months run one
 * name ahead once the Moon is waning.
 */
export function chandramasa(ref: Date, paksha: "Shukla" | "Krishna") {
  let lastNew: Date = ref;
  try {
    const found = A.SearchMoonPhase(0, new Date(ref.getTime() - 32 * 86400000), 34);
    if (found) lastNew = found.date;
  } catch { /* keep ref */ }
  const signAtNew = sunSign(new Date(lastNew.getTime() + 43200000));
  const amantaIndex = signAtNew % 12;
  const purnimantaIndex = paksha === "Krishna" ? (amantaIndex + 1) % 12 : amantaIndex;
  // Adhika (extra) month: no solar ingress inside the lunation.
  let nextNew: Date | null = null;
  try {
    const f = A.SearchMoonPhase(0, new Date(lastNew.getTime() + 86400000), 33);
    nextNew = f ? f.date : null;
  } catch { /* ignore */ }
  const adhika = nextNew ? sunSign(new Date(lastNew.getTime() + 43200000)) === sunSign(new Date(nextNew.getTime() - 43200000)) : false;
  return {
    amanta: CHANDRA_MASA[amantaIndex],
    purnimanta: CHANDRA_MASA[purnimantaIndex],
    adhika,
    lunationStart: lastNew,
  };
}

// ── Samvat era counts and epochs ────────────────────────────────────────────
export function samvatAndEpochs(ref: Date, masaAmanta: string) {
  const year = ref.getFullYear();
  // Solar sidereal year begins at Mesha Sankranti (Sun entering sidereal Aries).
  const sun = siderealLon(A.Body.Sun, ref);
  const beforeMeshaSankranti = sun > 180; // Sun still in the second half of the sidereal zodiac
  const shakaYear = beforeMeshaSankranti ? year - 79 : year - 78;
  // Vikram Samvat runs Chaitra to Phalguna and is 135 years ahead of Shaka.
  const vikramYear = shakaYear + 135;
  // Gujarati Samvat starts at Kartika Shukla Pratipada, one year behind
  // the North Indian Vikram count for Chaitra to Ashwina.
  const beforeKartika = ["Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada", "Ashwina"].includes(masaAmanta);
  const gujaratiYear = beforeKartika ? vikramYear - 1 : vikramYear;
  const kaliyugaYear = shakaYear + 3179;

  const julianDay = 2440587.5 + ref.getTime() / 86400000;
  const modifiedJulianDay = julianDay - 2400000.5;
  const rataDie = Math.floor(julianDay - 1721424.5);
  const kaliAhargana = Math.floor(julianDay - 588465.5); // days since Kali epoch (3102 BCE Feb 18)

  // Indian National Calendar (Saka), months of 30/31 days from 22 March.
  const NATIONAL_MONTHS = ["Chaitra", "Vaisakha", "Jyaistha", "Asadha", "Sravana", "Bhadra", "Asvina", "Kartika", "Agrahayana", "Pausa", "Magha", "Phalguna"];
  const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const startDay = isLeap(year) ? 21 : 22; // Chaitra 1 falls on 21 March in leap years
  const chaitra1 = new Date(year, 2, startDay);
  let saka = shakaYear;
  let base = chaitra1;
  if (ref.getTime() < chaitra1.getTime()) {
    saka = shakaYear;
    base = new Date(year - 1, 2, isLeap(year - 1) ? 21 : 22);
  }
  const lengths = [isLeap(saka + 79) ? 31 : 30, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];
  let elapsed = Math.floor((ref.getTime() - base.getTime()) / 86400000);
  let mIdx = 0;
  while (mIdx < 12 && elapsed >= lengths[mIdx]) { elapsed -= lengths[mIdx]; mIdx += 1; }
  const nationalCivil = `${NATIONAL_MONTHS[Math.min(mIdx, 11)]} ${elapsed + 1}, Saka ${saka}`;
  const nationalNirayana = `${RASHIS[Math.floor(sun / 30)]} ${Math.floor(sun % 30) + 1}, Saka ${saka}`;

  return {
    shaka: shakaYear,
    vikram: vikramYear,
    gujarati: gujaratiYear,
    kaliyuga: kaliyugaYear,
    julianDay,
    julianDate: julianDay.toFixed(5),
    modifiedJulianDay,
    rataDie,
    kaliAhargana,
    nationalCivil,
    nationalNirayana,
    ayanamsaDegrees: lahiriAyanamsa(ref),
  };
}

// ── Ritu and Ayana ──────────────────────────────────────────────────────────
const DRIK_RITU = ["Vasanta", "Grishma", "Varsha", "Sharad", "Hemanta", "Shishira"];

export function rituAndAyana(ref: Date, masaAmanta: string) {
  const sunSid = siderealLon(A.Body.Sun, ref);
  const sunTrop = tropicalLon(A.Body.Sun, ref);
  // Drik (observed, tropical) Ritu — two tropical signs per season from Pisces.
  const drikIndex = Math.floor((((sunTrop + 30) % 360) / 60));
  // Vedic Ritu — two lunar months per season from Chaitra.
  const vedicIndex = Math.floor(CHANDRA_MASA.indexOf(masaAmanta) / 2);
  return {
    drikRitu: DRIK_RITU[drikIndex % 6],
    vedicRitu: DRIK_RITU[Math.max(0, vedicIndex) % 6],
    // Drik Ayana: tropical Sun moving north (Capricorn to Gemini) is Uttarayana.
    drikAyana: sunTrop >= 270 || sunTrop < 90 ? "Uttarayana" : "Dakshinayana",
    // Vedic Ayana uses the sidereal zodiac, so it shifts by the ayanamsa.
    vedicAyana: sunSid >= 270 || sunSid < 90 ? "Uttarayana" : "Dakshinayana",
    sunSidereal: sunSid,
    sunTropical: sunTrop,
  };
}

// ── Day and night measures ──────────────────────────────────────────────────
function ghatiPalaText(ms: number) {
  const ghati = ms / (24 * 60 * 1000); // 1 ghati = 24 minutes
  const g = Math.floor(ghati);
  const pala = Math.round((ghati - g) * 60);
  const hours = Math.floor(ms / 3600000);
  const mins = Math.round((ms % 3600000) / 60000);
  return { ghati: g, pala, hours, mins, text: `${hours} hours ${mins} minutes (${g} ghati ${pala} pala)` };
}

export function dayMeasures(p: Panchang, nextSunrise: Date | null) {
  const dina = p.sunrise && p.sunset ? p.sunset.getTime() - p.sunrise.getTime() : null;
  const ratri = p.sunset && nextSunrise ? nextSunrise.getTime() - p.sunset.getTime() : null;
  return {
    dinamana: dina ? ghatiPalaText(dina) : null,
    ratrimana: ratri ? ghatiPalaText(ratri) : null,
    madhyahna: p.solarNoon ?? (p.sunrise && dina ? new Date(p.sunrise.getTime() + dina / 2) : null),
  };
}

// ── Nakshatra boundary solver (needed for Varjyam and Amrit Kalam) ──────────
function moonNakBoundaries(ref: Date) {
  const span = 360 / 27;
  const lonAt = (t: number) => siderealLon(A.Body.Moon, new Date(t));
  const startIndex = Math.floor(lonAt(ref.getTime()) / span);
  const solve = (targetIndex: number, direction: -1 | 1) => {
    const target = norm360(targetIndex * span);
    let lo = ref.getTime();
    let hi = ref.getTime() + direction * 3 * 86400000;
    const signed = (t: number) => {
      let d = lonAt(t) - target;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      return d;
    };
    if (signed(lo) * signed(hi) > 0) return null;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (signed(lo) * signed(mid) <= 0) hi = mid; else lo = mid;
    }
    return new Date((lo + hi) / 2);
  };
  const start = solve(startIndex, -1);
  const end = solve((startIndex + 1) % 27, 1);
  return { index: startIndex, start, end };
}

// Classical Varjyam start point, expressed in ghatis from the start of each
// nakshatra (Nakshatra Tyajya table, 60 ghati per nakshatra span).
const VARJYAM_GHATI = [
  50, 24, 30, 40, 14, 21, 30, 20, 32, 30, 20, 18, 21, 10, 14, 14, 10, 14, 20, 20, 30, 20, 10, 10, 18, 16, 30,
];

export function varjyamAndAmrit(ref: Date) {
  const nak = moonNakBoundaries(ref);
  if (!nak.start || !nak.end) return null;
  const totalMs = nak.end.getTime() - nak.start.getTime();
  const ghatiMs = totalMs / 60;
  const startGhati = VARJYAM_GHATI[nak.index];
  const varjyamStart = new Date(nak.start.getTime() + startGhati * ghatiMs);
  const varjyamEnd = new Date(varjyamStart.getTime() + 1.6 * ghatiMs); // 1 ghati 36 pala
  // Amrita Ghatika sits 20 ghatis after the Varjyam window opens.
  const amritStart = new Date(varjyamStart.getTime() + 20 * ghatiMs);
  const amritEnd = new Date(amritStart.getTime() + 1.6 * ghatiMs);
  return {
    nakshatra: NAKSHATRAS[nak.index],
    nakshatraStart: nak.start,
    nakshatraEnd: nak.end,
    varjyam: [varjyamStart, varjyamEnd] as [Date, Date],
    amritKalam: [amritStart, amritEnd] as [Date, Date],
  };
}

// Ravi Yoga — the Sun's nakshatra and the Moon's nakshatra are not in a
// mutually afflicting relation; classically it holds while the Moon's
// nakshatra is not the 1st, 6th, 11th, 16th, 21st or 26th from the Sun's.
export function raviYoga(ref: Date) {
  const nakOf = (b: A.Body) => Math.floor(siderealLon(b, ref) / (360 / 27));
  const sunNak = nakOf(A.Body.Sun);
  const moonNak = nakOf(A.Body.Moon);
  const gap = ((moonNak - sunNak + 27) % 27) + 1;
  const blocked = [1, 6, 11, 16, 21, 26].includes(gap);
  return {
    active: !blocked,
    suryaNakshatra: NAKSHATRAS[sunNak],
    suryaPada: Math.floor(((siderealLon(A.Body.Sun, ref) % (360 / 27)) / (360 / 108))) + 1,
    countFromSun: gap,
    note: blocked
      ? `The Moon's star is the ${gap} from the Sun's star, so Ravi Yoga does not apply today.`
      : `The Moon's star is the ${gap} from the Sun's star, so Ravi Yoga holds and it strengthens the day.`,
  };
}

// ── Sandhya, Vijaya, Dur Muhurtam, Baana ────────────────────────────────────
// Dur Muhurtam indices (1-based) among the 15 day muhurtas, by weekday.
const DUR_MUHURTAM: number[][] = [
  [14], [9, 13], [4, 12], [8, 15], [6, 11], [4, 9], [2, 5],
];

export function extraMuhurtas(p: Panchang, nextSunrise: Date | null) {
  const out: { name: string; range: [Date, Date] | null; nature: "good" | "avoid"; note: string }[] = [];
  if (p.sunrise && p.sunset) {
    const dayMs = p.sunset.getTime() - p.sunrise.getTime();
    const muh = dayMs / 15;
    out.push({
      name: "Pratah Sandhya",
      range: [new Date(p.sunrise.getTime() - 48 * 60000), new Date(p.sunrise.getTime() + 24 * 60000)],
      nature: "good",
      note: "The dawn junction, kept for prayer, recitation and quiet planning rather than transactions.",
    });
    out.push({
      name: "Vijaya Muhurta",
      range: [new Date(p.sunrise.getTime() + 10 * muh), new Date(p.sunrise.getTime() + 11 * muh)],
      nature: "good",
      note: "The eleventh muhurta of the day, traditionally chosen for contests, filings and decisive moves.",
    });
    out.push({
      name: "Sayahna Sandhya",
      range: [new Date(p.sunset.getTime() - 24 * 60000), new Date(p.sunset.getTime() + 48 * 60000)],
      nature: "good",
      note: "The dusk junction, again reserved for prayer and closing the day rather than starting work.",
    });
    for (const idx of DUR_MUHURTAM[new Date(p.sunrise).getDay()] ?? []) {
      out.push({
        name: `Dur Muhurtam ${idx}`,
        range: [new Date(p.sunrise.getTime() + (idx - 1) * muh), new Date(p.sunrise.getTime() + idx * muh)],
        nature: "avoid",
        note: "A weak muhurta for this weekday. Routine work is fine, but avoid launches and signatures.",
      });
    }
  }
  if (nextSunrise && p.sunset) {
    const nightMs = nextSunrise.getTime() - p.sunset.getTime();
    const muh = nightMs / 15;
    out.push({
      name: "Nishita Muhurta",
      range: [new Date(p.sunset.getTime() + 7 * muh), new Date(p.sunset.getTime() + 8 * muh)],
      nature: "good",
      note: "The midnight muhurta, used for mantra practice and vows.",
    });
  }
  return out;
}

// Baana (five arrows) — from the tithi count, an affliction marker used in
// muhurta selection.
const BAANA = ["Roga", "Agni", "Raja", "Chora", "Mrityu"];
export function baanaInfo(p: Panchang) {
  const tithiAbs = p.tithi.paksha === "Shukla" ? p.tithi.number : p.tithi.number;
  const idx = (tithiAbs * 2) % 5;
  const active = [0, 3, 4].includes(idx);
  return {
    name: BAANA[idx],
    active,
    note: active
      ? `${BAANA[idx]} Baana applies. Postpone marriage, house entry and vehicle purchase muhurtas set inside this day.`
      : `${BAANA[idx]} Baana is present but is not counted among the blocking arrows for muhurta work.`,
  };
}

// ── Vasa and Shool set ──────────────────────────────────────────────────────
const SHIVA_VASA = ["Kailash", "Gauri Parshva", "Vrishabha", "Sabha", "Bhojan", "Kreeda", "Shmashan"];
const AGNI_VASA = ["Prithvi (earth)", "Akash (sky)", "Patala (below)", "Prithvi (earth)"];
const HOMAHUTI = ["Surya", "Chandra", "Mangal", "Budh", "Guru", "Shukra", "Shani", "Rahu", "Ketu"];
const DIRECTION = ["East", "South", "West", "North"];
const RAHU_VASA_BY_DAY = ["South West", "North West", "South", "North", "West", "North East", "East"];

export function vasaAndShool(p: Panchang) {
  const tithi = p.tithi.number;
  const wd = p.sunrise ? p.sunrise.getDay() : 0;
  const shiva = SHIVA_VASA[(tithi * 2 + 5) % 7];
  const agni = AGNI_VASA[(tithi + wd + 1) % 4];
  const homahuti = HOMAHUTI[p.yoga.index % 9];
  const moonSign = Math.floor((p.nakshatra.index * (360 / 27)) / 30);
  return {
    shivaVasa: shiva,
    shivaNote: shiva === "Kailash" || shiva === "Sabha"
      ? "A favourable seat for worship, vows and temple work."
      : "A weaker seat. Keep worship simple and postpone elaborate rituals.",
    agnivasa: agni,
    agniNote: agni.startsWith("Prithvi")
      ? "Fire rests on the earth, which is the accepted condition for homa and yajna."
      : "Fire is not resting on the earth, so classical texts advise deferring homa.",
    homahuti,
    chandraVasa: DIRECTION[moonSign % 4],
    bhadraVasa: p.karana.name === "Vishti"
      ? (p.tithi.paksha === "Shukla" ? "Bhadra in the heavens" : "Bhadra on the earth")
      : "Bhadra is not active today",
    rahuVasa: RAHU_VASA_BY_DAY[wd],
    dishaShool: p.dishaShool,
    kumbhaChakra: DIRECTION[p.nakshatra.index % 4],
    kumbhaNote: `Travel toward the ${DIRECTION[p.nakshatra.index % 4]} is the direction the Kumbha Chakra favours for today's star.`,
  };
}

// ── Gowri Panchangam (Tamil tradition) ──────────────────────────────────────
const GOWRI = ["Amirtha", "Rogam", "Laabam", "Dhanam", "Sugam", "Soram", "Visham", "Udyogam"];
const GOWRI_GOOD = new Set(["Amirtha", "Laabam", "Dhanam", "Sugam", "Udyogam"]);
const GOWRI_DAY_START = [0, 4, 6, 2, 3, 5, 1];

export function gowriPanchangam(p: Panchang, nextSunrise: Date | null) {
  const build = (from: Date | null, to: Date | null, offset: number) => {
    if (!from || !to || to.getTime() <= from.getTime()) return [];
    const step = (to.getTime() - from.getTime()) / 8;
    return Array.from({ length: 8 }, (_, i) => {
      const name = GOWRI[(offset + i) % 8];
      return {
        name,
        good: GOWRI_GOOD.has(name),
        from: new Date(from.getTime() + i * step),
        to: new Date(from.getTime() + (i + 1) * step),
      };
    });
  };
  const wd = p.sunrise ? p.sunrise.getDay() : 0;
  const day = build(p.sunrise, p.sunset, GOWRI_DAY_START[wd]);
  const night = build(p.sunset, nextSunrise, (GOWRI_DAY_START[wd] + 4) % 8);
  const nallaNeram = [...day, ...night].filter((s) => s.name === "Amirtha" || s.name === "Laabam");
  return { day, night, nallaNeram };
}

// ── Tarabalam and Chandrabalam (relative to a birth star and Moon sign) ─────
const TARA_NAMES = ["Janma", "Sampat", "Vipat", "Kshema", "Pratyari", "Sadhaka", "Vadha", "Mitra", "Ati Mitra"];
const TARA_GOOD = [false, true, false, true, false, true, false, true, true];

export function taraBalam(birthNakIndex: number, todayNakIndex: number) {
  const count = ((todayNakIndex - birthNakIndex + 27) % 27) + 1;
  const idx = (count - 1) % 9;
  return {
    count,
    name: TARA_NAMES[idx],
    good: TARA_GOOD[idx],
    note: TARA_GOOD[idx]
      ? `${TARA_NAMES[idx]} Tara supports new work, travel and negotiation today.`
      : `${TARA_NAMES[idx]} Tara is a weak star count. Keep to maintenance work and defer launches.`,
  };
}

export function chandraBalam(birthMoonSign: number, todayMoonSign: number) {
  const house = ((todayMoonSign - birthMoonSign + 12) % 12) + 1;
  const strong = [1, 3, 6, 7, 10, 11].includes(house);
  return {
    house,
    strong,
    note: strong
      ? `The Moon transits the ${house} sign from your birth Moon, which is a supportive Chandra Balam position.`
      : `The Moon transits the ${house} sign from your birth Moon, a weaker Chandra Balam position for beginnings.`,
  };
}

// ── Ghatta Chakra (avoidance set for travel and muhurta) ────────────────────
const GHATTA_MONTHS = CHANDRA_MASA;
export function ghattaChakra(moonSignIndex: number) {
  // Classical Ghatta Chakra: for each Moon sign, one lunar month, tithi,
  // weekday, nakshatra, yoga and karana are marked as avoidable.
  const tithis = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi"];
  const yogas = ["Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva"];
  const karanas = ["Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti", "Bava", "Balava", "Kaulava", "Taitila", "Garaja"];
  const naks = [10, 22, 5, 18, 1, 14, 26, 9, 21, 4, 17, 0];
  const days = [0, 3, 6, 2, 5, 1, 4, 0, 3, 6, 2, 5];
  return {
    moonSign: RASHIS[moonSignIndex],
    month: GHATTA_MONTHS[(moonSignIndex + 3) % 12],
    tithi: tithis[moonSignIndex],
    vaar: WEEKDAY[days[moonSignIndex]],
    nakshatra: NAKSHATRAS[naks[moonSignIndex]],
    yoga: yogas[moonSignIndex],
    karana: karanas[moonSignIndex],
    note: "These are the traditional avoidance points for this Moon sign. When several fall on one date, defer travel and important starts.",
  };
}

/** Next sunrise, needed by several of the measures above. */
export function nextSunriseAfter(p: Panchang, latitude: number, longitude: number) {
  try {
    const observer = new A.Observer(latitude, longitude, 0);
    const from = p.sunset ?? p.refMoment;
    const t = A.SearchRiseSet(A.Body.Sun, observer, +1, from, 2);
    return t ? t.date : null;
  } catch { return null; }
}
