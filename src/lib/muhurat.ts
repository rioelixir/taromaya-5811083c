// Muhurat / Electional astrology finder.
// Scans a date range in ~30-min slices and scores each window against
// classical Vedic auspiciousness criteria for a chosen activity.

import { computePanchang, type Panchang } from "./panchang";
import { computeHoras, type HoraLord } from "./hora";
import { NAKSHATRAS, RASHIS } from "./vedic";
import { scoreElectional, type BirthContext } from "./electional";

export type Activity =
  | "marriage" | "griha-pravesh" | "vehicle" | "business"
  | "travel" | "surgery" | "namkaran" | "signing";


export const ACTIVITIES: { key: Activity; label: string; desc: string }[] = [
  { key: "marriage",     label: "Marriage",         desc: "Vivaha muhurat — union, engagement, wedding." },
  { key: "griha-pravesh",label: "Griha Pravesh",    desc: "Entering a new home." },
  { key: "vehicle",      label: "Vehicle Purchase", desc: "Buying a car, bike, or major vehicle." },
  { key: "business",     label: "Business Start",   desc: "Opening a shop, launching a company." },
  { key: "travel",       label: "Travel",           desc: "Starting a journey." },
  { key: "surgery",      label: "Surgery",          desc: "Elective medical procedure." },
  { key: "namkaran",     label: "Namkaran",         desc: "Baby naming ceremony." },
  { key: "signing",      label: "Contract Signing", desc: "Agreements, deals, big decisions." },
];

// Recommended nakshatras per activity (traditional).
const GOOD_NAKS: Record<Activity, string[]> = {
  marriage:      ["Rohini","Mrigashira","Magha","Uttara Phalguni","Hasta","Swati","Anuradha","Moola","Uttara Ashadha","Uttara Bhadrapada","Revati"],
  "griha-pravesh": ["Rohini","Mrigashira","Anuradha","Chitra","Uttara Phalguni","Uttara Ashadha","Uttara Bhadrapada","Revati"],
  vehicle:       ["Ashwini","Pushya","Hasta","Chitra","Swati","Anuradha","Shravana","Revati"],
  business:      ["Ashwini","Rohini","Pushya","Hasta","Chitra","Anuradha","Uttara Phalguni","Shravana","Revati"],
  travel:        ["Ashwini","Punarvasu","Pushya","Hasta","Anuradha","Shravana","Dhanishta","Revati"],
  surgery:       ["Ashwini","Bharani","Krittika","Ardra","Ashlesha","Magha","Moola","Jyeshtha"],
  namkaran:      ["Ashwini","Rohini","Mrigashira","Punarvasu","Pushya","Hasta","Swati","Anuradha","Shravana","Dhanishta","Revati"],
  signing:       ["Ashwini","Rohini","Pushya","Hasta","Chitra","Anuradha","Uttara Ashadha","Shravana","Revati"],
};

const GOOD_TITHIS: Record<Activity, string[]> = {
  marriage:      ["Dwitiya","Tritiya","Panchami","Saptami","Ekadashi","Trayodashi"],
  "griha-pravesh": ["Dwitiya","Tritiya","Panchami","Saptami","Dashami","Ekadashi","Trayodashi"],
  vehicle:       ["Dwitiya","Tritiya","Panchami","Saptami","Dashami","Ekadashi","Trayodashi"],
  business:      ["Dwitiya","Tritiya","Panchami","Saptami","Dashami","Trayodashi"],
  travel:        ["Dwitiya","Tritiya","Panchami","Saptami","Ekadashi","Trayodashi"],
  surgery:       ["Chaturthi","Shashthi","Ashtami","Chaturdashi"],
  namkaran:      ["Dwitiya","Tritiya","Panchami","Saptami","Dashami","Ekadashi","Trayodashi","Purnima"],
  signing:       ["Dwitiya","Tritiya","Panchami","Saptami","Ekadashi","Trayodashi"],
};

const BAD_YOGAS = ["Vishkumbha","Atiganda","Shula","Ganda","Vyaghata","Vajra","Vyatipata","Parigha","Vaidhriti"];

// Preferred weekdays per activity
const GOOD_DAYS: Record<Activity, string[]> = {
  marriage:      ["Monday","Wednesday","Thursday","Friday"],
  "griha-pravesh": ["Monday","Wednesday","Thursday","Friday"],
  vehicle:       ["Monday","Wednesday","Thursday","Friday"],
  business:      ["Wednesday","Thursday","Friday"],
  travel:        ["Monday","Wednesday","Thursday","Friday"],
  surgery:       ["Wednesday","Saturday"],
  namkaran:      ["Monday","Wednesday","Thursday","Friday"],
  signing:       ["Wednesday","Thursday","Friday"],
};

export type MuhuratWindow = {
  from: Date;
  to: Date;
  score: number;      // 0..100
  quality: "Excellent" | "Good" | "Fair" | "Avoid";
  reasons: string[];
  warnings: string[];
  panchang: {
    tithi: string;
    nakshatra: string;
    yoga: string;
    weekday: string;
  };
  hora?: { lord: HoraLord; isDay: boolean };
  moonRashi?: string;
};

function inRange(t: Date, r: [Date, Date] | null) {
  if (!r) return false;
  return t.getTime() >= r[0].getTime() && t.getTime() <= r[1].getTime();
}

// Approximate Moon rashi from nakshatra index (each nakshatra = 13°20').
function nakToRashi(nakIndex: number): string {
  const deg = (nakIndex + 0.5) * (360 / 27); // midpoint of nakshatra
  return RASHIS[Math.floor(deg / 30) % 12];
}

export function scanMuhurats(opts: {
  activity: Activity;
  startDate: Date;      // local
  days: number;         // e.g. 7 or 30
  latitude: number;
  longitude: number;
  sliceMinutes?: number;
  birth?: BirthContext;
}): MuhuratWindow[] {
  const slice = opts.sliceMinutes ?? 30;
  const results: MuhuratWindow[] = [];
  const goodNak = new Set(GOOD_NAKS[opts.activity]);
  const goodTithi = new Set(GOOD_TITHIS[opts.activity]);
  const goodDay = new Set(GOOD_DAYS[opts.activity]);

  for (let d = 0; d < opts.days; d++) {
    const day = new Date(opts.startDate);
    day.setDate(day.getDate() + d);
    day.setHours(0, 0, 0, 0);

    // Panchang for this day (computed at noon for stable tithi/nakshatra reference)
    const p: Panchang = computePanchang({
      date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12, 0, 0),
      latitude: opts.latitude,
      longitude: opts.longitude,
    });

    // Next-day sunrise for hora night bracket.
    const nextDay = new Date(day); nextDay.setDate(nextDay.getDate() + 1);
    const nextP = computePanchang({
      date: new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 12, 0, 0),
      latitude: opts.latitude,
      longitude: opts.longitude,
    });
    const weekdayNum = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getDay();
    const horas = (p.sunrise && p.sunset && nextP.sunrise)
      ? computeHoras(p.sunrise, p.sunset, nextP.sunrise, weekdayNum)
      : [];

    const moonRashi = nakToRashi(p.nakshatra.index);

    // Score core day-level factors
    let dayScore = 40;
    const dayReasons: string[] = [];
    const dayWarn: string[] = [];
    if (goodNak.has(p.nakshatra.name)) { dayScore += 20; dayReasons.push(`${p.nakshatra.name} nakshatra favours this activity`); }
    else dayWarn.push(`${p.nakshatra.name} nakshatra is not classically preferred`);
    if (goodTithi.has(p.tithi.name)) { dayScore += 15; dayReasons.push(`${p.tithi.name} tithi (${p.tithi.paksha}) is auspicious`); }
    else dayWarn.push(`${p.tithi.name} tithi is not preferred`);
    if (goodDay.has(p.weekday)) { dayScore += 10; dayReasons.push(`${p.weekday} is favourable`); }
    if (BAD_YOGAS.includes(p.yoga.name)) { dayScore -= 20; dayWarn.push(`${p.yoga.name} yoga — inauspicious`); }
    else dayReasons.push(`${p.yoga.name} yoga is benign`);

    // Electional depth (Tarabala + Chandrabala + Panchaka) — day-level.
    const elect = scoreElectional({
      activity: opts.activity,
      currentNakshatra: p.nakshatra.name,
      currentMoonRashi: moonRashi,
      birth: opts.birth,
    });
    dayScore += elect.delta;
    dayReasons.push(...elect.reasons);
    dayWarn.push(...elect.warnings);

    // Slice through daytime (sunrise → sunset+2h)
    if (!p.sunrise || !p.sunset) continue;
    const dayEnd = new Date(p.sunset.getTime() + 2 * 3600_000);
    for (let t = p.sunrise.getTime(); t <= dayEnd.getTime(); t += slice * 60_000) {
      const from = new Date(t);
      const to = new Date(t + slice * 60_000);

      let score = dayScore;
      const reasons = [...dayReasons];
      const warnings = [...dayWarn];

      if (inRange(from, p.rahuKaal))    { score -= 30; warnings.push("Falls in Rahu Kaal"); }
      if (inRange(from, p.yamaganda))   { score -= 20; warnings.push("Falls in Yamaganda"); }
      if (inRange(from, p.gulika))      { score -= 15; warnings.push("Falls in Gulika Kaal"); }
      if (inRange(from, p.abhijitMuhurat)) { score += 20; reasons.push("Abhijit Muhurat — universally auspicious"); }
      if (inRange(from, p.brahmaMuhurat))  { score += 10; reasons.push("Brahma Muhurat — sacred pre-dawn window"); }

      // Chaughadiya nature
      const cha = [...p.chaughadiyaDay, ...p.chaughadiyaNight].find(
        (c) => from.getTime() >= c.from.getTime() && from.getTime() < c.to.getTime(),
      );
      if (cha) {
        if (cha.nature === "good") { score += 8; reasons.push(`${cha.name} chaughadiya (good)`); }
        if (cha.nature === "bad")  { score -= 12; warnings.push(`${cha.name} chaughadiya (avoid)`); }
      }

      // Hora affinity (per slice)
      const hora = horas.find(h => from.getTime() >= h.from.getTime() && from.getTime() < h.to.getTime());
      if (hora) {
        const horaElect = scoreElectional({
          activity: opts.activity,
          currentNakshatra: p.nakshatra.name,
          currentMoonRashi: moonRashi,
          horaLord: hora.lord,
        });
        // hora-only delta (subtract already-applied day-level electional)
        const horaDelta = horaElect.delta - elect.delta;
        score += horaDelta;
        const horaReasons = horaElect.reasons.filter(r => !elect.reasons.includes(r));
        reasons.push(...horaReasons);
      }

      score = Math.max(0, Math.min(100, score));
      const quality =
        score >= 85 ? "Excellent" :
        score >= 70 ? "Good" :
        score >= 50 ? "Fair" : "Avoid";

      results.push({
        from, to, score, quality, reasons, warnings,
        panchang: {
          tithi: `${p.tithi.name} (${p.tithi.paksha})`,
          nakshatra: p.nakshatra.name,
          yoga: p.yoga.name,
          weekday: p.weekday,
        },
        hora: hora ? { lord: hora.lord, isDay: hora.isDay } : undefined,
        moonRashi,
      });
    }
  }
  // Sort by score descending, keep top windows
  results.sort((a, b) => b.score - a.score);
  return results;
}

