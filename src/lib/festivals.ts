/**
 * Hindu Festival Calendar — Tithi/Paksha based rules.
 * Scans a date range and returns matching festivals per day.
 */

import { computePanchang } from "./panchang";

export type FestivalHit = {
  date: Date;
  name: string;
  category: "major" | "vrata" | "ekadashi" | "pradosh" | "chaturthi" | "amavasya" | "purnima" | "sankranti";
  detail: string;
};

// A festival rule matches a given Panchang result.
type Rule = (p: ReturnType<typeof computePanchang>, date: Date) => FestivalHit | null;

const cat = (name: string, category: FestivalHit["category"], detail: string) =>
  (p: ReturnType<typeof computePanchang>, date: Date, ok: boolean): FestivalHit | null =>
    ok ? { date, name, category, detail } : null;

const RULES: Rule[] = [
  // Tithi-based recurring
  (p, d) => cat("Amavasya (New Moon)", "amavasya", "New moon night — ancestral remembrance, meditation.")(p, d, p.tithi.number === 30 || p.tithi.name === "Amavasya"),
  (p, d) => cat("Purnima (Full Moon)", "purnima", "Full moon night — Satya Narayan puja, fasts, meditation.")(p, d, p.tithi.number === 15 && p.tithi.paksha === "Shukla"),

  (p, d) => cat("Ekadashi", "ekadashi", "11th lunar day — fasting for Lord Vishnu.")(p, d, p.tithi.number === 11 || p.tithi.number === 26),
  (p, d) => cat("Pradosh Vrata", "pradosh", "13th lunar day — Shiva fast, evening prayers.")(p, d, p.tithi.number === 13 || p.tithi.number === 28),
  (p, d) => cat("Sankashti Chaturthi", "chaturthi", "4th of Krishna paksha — Ganesha fast, moonrise viewing.")(p, d, p.tithi.number === 19),
  (p, d) => cat("Vinayaka Chaturthi", "chaturthi", "4th of Shukla paksha — Ganesha puja.")(p, d, p.tithi.number === 4),

  // Special weekday × nakshatra combinations
  (p, d) => cat("Sarvartha Siddhi Yoga", "vrata", "Highly auspicious day-nakshatra combination.")(p, d,
    (d.getDay() === 0 && ["Hasta","Mula","Uttara Ashadha","Uttara Phalguni","Uttara Bhadrapada","Pushya","Ashwini"].includes(p.nakshatra.name)) ||
    (d.getDay() === 1 && ["Rohini","Shravana","Mrigashira","Pushya","Anuradha"].includes(p.nakshatra.name)) ||
    (d.getDay() === 4 && ["Ashwini","Punarvasu","Pushya","Anuradha","Revati"].includes(p.nakshatra.name)),
  ),

  // Solar month starts — Makar Sankranti (~Jan 14), Mesha Sankranti (~Apr 14)
  (p, d) => {
    const m = d.getMonth() + 1, day = d.getDate();
    if (m === 1 && day === 14) return { date: d, name: "Makar Sankranti", category: "sankranti", detail: "Sun enters Capricorn. Uttarayana begins." };
    if (m === 4 && (day === 13 || day === 14)) return { date: d, name: "Mesha Sankranti / Baisakhi", category: "sankranti", detail: "Sun enters Aries. Solar new year." };
    if (m === 8 && (day === 16 || day === 17)) return { date: d, name: "Simha Sankranti", category: "sankranti", detail: "Sun enters Leo." };
    return null;
  },
];

// Named festivals keyed off tithi + month (approx solar, ok for demo)
const NAMED: { month: number; tithi: number; paksha: "Shukla" | "Krishna"; name: string; detail: string }[] = [
  { month: 3, tithi: 8,  paksha: "Krishna", name: "Holika Dahan", detail: "Eve of Holi — bonfire ritual." },
  { month: 3, tithi: 1,  paksha: "Krishna", name: "Holi", detail: "Festival of colours." },
  { month: 4, tithi: 9,  paksha: "Shukla",  name: "Ram Navami", detail: "Birth of Lord Rama." },
  { month: 5, tithi: 3,  paksha: "Shukla",  name: "Akshaya Tritiya", detail: "Highly auspicious for beginnings, gold purchase." },
  { month: 7, tithi: 2,  paksha: "Shukla",  name: "Guru Purnima", detail: "Honour of teachers." },
  { month: 8, tithi: 15, paksha: "Shukla",  name: "Raksha Bandhan", detail: "Sibling bond." },
  { month: 8, tithi: 8,  paksha: "Krishna", name: "Janmashtami", detail: "Birth of Lord Krishna." },
  { month: 9, tithi: 4,  paksha: "Shukla",  name: "Ganesh Chaturthi", detail: "Ganesha installation." },
  { month: 10, tithi: 1, paksha: "Shukla",  name: "Navratri begins", detail: "Nine nights of the Goddess." },
  { month: 10, tithi: 10, paksha: "Shukla", name: "Dussehra / Vijayadashami", detail: "Victory of good over evil." },
  { month: 11, tithi: 13, paksha: "Krishna",name: "Dhanteras", detail: "Wealth-purchase festival, start of Diwali." },
  { month: 11, tithi: 15, paksha: "Krishna",name: "Diwali (Lakshmi Puja)", detail: "Festival of lights." },
  { month: 11, tithi: 1, paksha: "Shukla",  name: "Govardhan Puja", detail: "Day after Diwali." },
  { month: 11, tithi: 2, paksha: "Shukla",  name: "Bhai Dooj", detail: "Sister-brother festival." },
  { month: 3, tithi: 14, paksha: "Krishna", name: "Maha Shivratri", detail: "Great Night of Shiva — fast and vigil." },
];

export function scanFestivals(
  from: Date, to: Date, latitude: number, longitude: number,
): FestivalHit[] {
  const out: FestivalHit[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0);
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 12, 0, 0);
  while (cursor <= end) {
    const p = computePanchang({ date: new Date(cursor), latitude, longitude });
    for (const r of RULES) {
      const hit = r(p, new Date(cursor));
      if (hit) out.push(hit);
    }
    // Named
    for (const n of NAMED) {
      if ((cursor.getMonth() + 1) === n.month && p.tithi.number === (n.paksha === "Shukla" ? n.tithi : n.tithi + 15) && p.tithi.paksha === n.paksha) {
        out.push({ date: new Date(cursor), name: n.name, category: "major", detail: n.detail });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  // Dedupe by name+date
  const seen = new Set<string>();
  return out.filter(h => {
    const k = `${h.name}|${h.date.toDateString()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
