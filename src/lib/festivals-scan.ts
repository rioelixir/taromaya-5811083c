// Festivals Scan v2 — grouped by day with panchang + detected observances.
// Complements the flat-array API in ./festivals used by the Panchang page.

import * as A from "astronomy-engine";
import { computePanchang, type Panchang } from "./panchang";
import { lahiriAyanamsa, RASHIS } from "./vedic";

const norm360 = (x: number) => ((x % 360) + 360) % 360;

export type FestivalKind = "vrat" | "purnima" | "amavasya" | "sankranti" | "major" | "auspicious";
export type Festival = {
  date: Date;
  name: string;
  kind: FestivalKind;
  significance: string;
};

function sunSiderealSign(date: Date): number {
  const g = A.GeoVector(A.Body.Sun, date, true);
  const rot = A.Rotation_EQJ_ECT(date);
  const e = A.RotateVector(rot, g);
  const trop = norm360(Math.atan2(e.y, e.x) * 180 / Math.PI);
  const sid = norm360(trop - lahiriAyanamsa(date));
  return Math.floor(sid / 30);
}

function detectFromPanchang(p: Panchang, date: Date): Festival[] {
  const out: Festival[] = [];
  const t = p.tithi.name;
  const paksha = p.tithi.paksha;
  const nak = p.nakshatra.name;
  const m = date.getMonth();

  if (t === "Ekadashi") out.push({ date, name: `${paksha} Ekadashi`, kind: "vrat",
    significance: "Vishnu fast — grants liberation and removes karmic debt. Fast from grains." });
  if (t === "Trayodashi") out.push({ date, name: `${paksha} Pradosh Vrat`, kind: "vrat",
    significance: "Shiva–Parvati worship at twilight; grants harmony and prosperity." });
  if (t === "Chaturthi" && paksha === "Krishna") out.push({ date, name: "Sankashti Chaturthi", kind: "vrat",
    significance: "Ganesha vrat — removes obstacles. Fast until moonrise." });
  if (t === "Chaturthi" && paksha === "Shukla") out.push({ date, name: "Vinayaka Chaturthi", kind: "vrat",
    significance: "Ganesha vrat for wisdom and success in new ventures." });
  if (t === "Chaturdashi" && paksha === "Krishna") {
    out.push({ date, name: "Masik Shivaratri", kind: "vrat",
      significance: "Monthly Shiva night — meditation, japa, all-night vigil." });
    if (m === 1 || m === 2) out.push({ date, name: "Maha Shivaratri", kind: "major",
      significance: "The great night of Shiva — cosmic dance, ultimate spiritual awakening." });
  }
  if (t === "Ashtami" && paksha === "Krishna") {
    out.push({ date, name: "Kalashtami", kind: "vrat",
      significance: "Kaal Bhairav worship — protection from fear and enemies." });
    if (m === 7 || m === 8) out.push({ date, name: "Krishna Janmashtami (window)", kind: "major",
      significance: "Birth of Lord Krishna — midnight fast and celebration." });
  }
  if (t === "Purnima") {
    out.push({ date, name: "Purnima Vrat", kind: "purnima",
      significance: "Full moon — Satyanarayan katha, charity, and lunar worship." });
    if (m === 6 || m === 7) out.push({ date, name: "Guru Purnima (window)", kind: "major",
      significance: "Honour spiritual and worldly teachers." });
    if (m === 8 || m === 9) out.push({ date, name: "Sharad Purnima (window)", kind: "major",
      significance: "Moon's brightest night; Lakshmi worship." });
    if (m === 2 || m === 3) out.push({ date, name: "Hanuman Jayanti (window)", kind: "major",
      significance: "Birth of Hanuman — courage and devotion." });
  }
  if (t === "Amavasya") {
    out.push({ date, name: "Amavasya", kind: "amavasya",
      significance: "New moon — pitru tarpan (ancestor rites), meditation, silence." });
    if (m === 9 || m === 10) out.push({ date, name: "Diwali Amavasya (window)", kind: "major",
      significance: "Lakshmi Puja — festival of lights on Kartik Amavasya." });
  }
  if (t === "Navami" && paksha === "Shukla") {
    if (m === 2 || m === 3) out.push({ date, name: "Ram Navami (window)", kind: "major",
      significance: "Birth of Lord Rama — recitation of Ramayana." });
    out.push({ date, name: "Durga Navami", kind: "auspicious",
      significance: "Ninth form of Durga — culmination of Navratri devotion." });
  }
  if (nak === "Pushya") out.push({ date, name: "Pushya Nakshatra", kind: "auspicious",
    significance: "Most auspicious nakshatra — ideal for gold purchase and new ventures." });
  if (nak === "Rohini" && paksha === "Krishna" && (m === 7 || m === 8))
    out.push({ date, name: "Janmashtami (Rohini yoga)", kind: "major",
      significance: "Krishna's birth star aligning with Krishna Ashtami — supreme yoga." });
  return out;
}

export type FestivalDay = { date: Date; panchang: Panchang; festivals: Festival[] };
export type FestivalScan = { days: FestivalDay[] };

export function scanFestivalCalendar(startISO: string, days: number, lat: number, lon: number): FestivalScan {
  const [y, mo, d] = startISO.split("-").map(Number);
  const start = new Date(y, mo - 1, d, 12, 0, 0);
  const out: FestivalDay[] = [];
  let prevSign = sunSiderealSign(new Date(start.getTime() - 86400000));
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * 86400000);
    const p = computePanchang({ date, latitude: lat, longitude: lon });
    const fests = detectFromPanchang(p, date);
    const sign = sunSiderealSign(date);
    if (sign !== prevSign) {
      const rashi = RASHIS[sign];
      fests.push({ date, name: `${rashi} Sankranti`, kind: "sankranti",
        significance: `Sun enters ${rashi}. ${sankrantiNote(sign)}` });
    }
    prevSign = sign;
    out.push({ date, panchang: p, festivals: fests });
  }
  return { days: out };
}

function sankrantiNote(sign: number): string {
  switch (sign) {
    case 9: return "Makar Sankranti — Uttarayana begins; harvest festival across India.";
    case 0: return "Mesha Sankranti — solar new year; Baisakhi window.";
    case 3: return "Karka Sankranti — Dakshinayana begins; monsoon rites.";
    case 6: return "Tula Sankranti — equinoctial transit; charity and ancestor rites.";
    default: return "Auspicious sun-sign transit — snan (holy bath) and daan (charity) recommended.";
  }
}
