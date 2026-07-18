// Month-long Panchang almanac — daily aggregate quality score, dominant
// factors, and red-day flags across a rolling 30/60-day window.

import { computePanchang, type Panchang } from "./panchang";
import {
  classifyPanchaka, bhadraInfo, tithiQuality, yogaQuality,
} from "./panchang-deep";

export type AlmanacDay = {
  date: Date;
  weekday: string;
  tithi: string;
  paksha: "Shukla" | "Krishna";
  nakshatra: string;
  yoga: string;
  score: number;              // -100..100
  quality: "Excellent" | "Good" | "Fair" | "Avoid";
  tags: { label: string; kind: "good" | "bad" | "neutral" }[];
  panchang: Panchang;
};

// Classical "good" nakshatras for general auspicious work.
const AUSPICIOUS_NAKS = new Set([
  "Rohini","Mrigashira","Punarvasu","Pushya","Uttara Phalguni","Hasta",
  "Chitra","Anuradha","Uttara Ashadha","Shravana","Dhanishta",
  "Uttara Bhadrapada","Revati",
]);
const CRUEL_NAKS = new Set([
  "Bharani","Krittika","Ashlesha","Magha","Mula","Jyeshtha",
]);

export function computeMonthAlmanac(opts: {
  startDate: Date;
  days: number;
  latitude: number;
  longitude: number;
}): AlmanacDay[] {
  const out: AlmanacDay[] = [];
  for (let i = 0; i < opts.days; i++) {
    const d = new Date(opts.startDate);
    d.setDate(d.getDate() + i);
    d.setHours(12, 0, 0, 0);
    const p = computePanchang({
      date: d, latitude: opts.latitude, longitude: opts.longitude,
    });
    const tags: AlmanacDay["tags"] = [];
    let score = 50;

    // Tithi quality
    const tq = tithiQuality(p.tithi.number);
    if (tq.name === "Rikta") { score -= 12; tags.push({ label: "Rikta tithi", kind: "bad" }); }
    else if (tq.name === "Purna") { score += 8; tags.push({ label: "Purna", kind: "good" }); }
    else if (tq.name === "Jaya") { score += 10; tags.push({ label: "Jaya", kind: "good" }); }
    else if (tq.name === "Nanda") { score += 8; tags.push({ label: "Nanda", kind: "good" }); }
    else if (tq.name === "Bhadra") { score += 6; tags.push({ label: "Bhadra tithi", kind: "good" }); }

    // Nakshatra
    if (AUSPICIOUS_NAKS.has(p.nakshatra.name)) {
      score += 12; tags.push({ label: p.nakshatra.name, kind: "good" });
    } else if (CRUEL_NAKS.has(p.nakshatra.name)) {
      score -= 10; tags.push({ label: p.nakshatra.name, kind: "bad" });
    }

    // Yoga
    const yq = yogaQuality(p.yoga.name);
    if (!yq.auspicious) { score -= 14; tags.push({ label: p.yoga.name, kind: "bad" }); }

    // Panchaka
    const pan = classifyPanchaka(p.nakshatra.name, d.getDay());
    if (pan.active && pan.type) {
      score -= 12; tags.push({ label: `${pan.type} Panchaka`, kind: "bad" });
    }

    // Bhadra (via karana)
    const bh = bhadraInfo(p.karana.name);
    if (bh.active) { score -= 10; tags.push({ label: "Bhadra", kind: "bad" }); }

    // Weekday benefic weighting
    if (["Wednesday", "Thursday", "Friday"].includes(p.weekday)) score += 4;
    if (p.weekday === "Saturday") score -= 3;

    // Abhijit muhurat present adds a bit
    if (p.abhijitMuhurat) score += 3;

    score = Math.max(-100, Math.min(100, score));
    const quality: AlmanacDay["quality"] =
      score >= 75 ? "Excellent" :
      score >= 60 ? "Good" :
      score >= 40 ? "Fair" : "Avoid";

    out.push({
      date: new Date(d),
      weekday: p.weekday,
      tithi: p.tithi.name,
      paksha: p.tithi.paksha,
      nakshatra: p.nakshatra.name,
      yoga: p.yoga.name,
      score, quality, tags, panchang: p,
    });
  }
  return out;
}

/** Aggregate chaughadiya nature for one day into three counts. */
export function chaughadiyaSummary(p: Panchang) {
  const all = [...p.chaughadiyaDay, ...p.chaughadiyaNight];
  const good = all.filter((c) => c.nature === "good").length;
  const bad = all.filter((c) => c.nature === "bad").length;
  const neutral = all.length - good - bad;
  return { good, bad, neutral, total: all.length };
}
