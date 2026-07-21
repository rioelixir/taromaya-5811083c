import * as A from "astronomy-engine";
import { NAKSHATRAS, lahiriAyanamsa } from "./vedic";

const norm360 = (x: number) => ((x % 360) + 360) % 360;

const TITHIS = [
  "Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami",
  "Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima",
  "Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami",
  "Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Amavasya",
];

const YOGAS = [
  "Vishkumbha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarma","Dhriti",
  "Shula","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi",
  "Vyatipata","Variyan","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla",
  "Brahma","Indra","Vaidhriti",
];

const KARANAS = ["Bava","Balava","Kaulava","Taitila","Gara","Vanija","Vishti","Shakuni","Chatushpada","Naga","Kimstughna"];

const WEEKDAY = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const CHAUGHADIYA_NAMES = ["Udveg","Chal","Labh","Amrit","Kaal","Shubh","Rog"];
// Chaughadiya starts by weekday (0=Sun): (start-index in the 7-cycle for the first day slot)
const CHAUGHADIYA_DAY_START = [0, 3, 6, 2, 5, 1, 4]; // Sun→Udveg,Mon→Amrit,Tue→Rog,Wed→Labh,Thu→Shubh,Fri→Chal,Sat→Kaal
// Night chaughadiya first slot per weekday (Sun→Shubh, Mon→Chal, Tue→Kaal, Wed→Udveg, Thu→Amrit, Fri→Rog, Sat→Labh)
const CHAUGHADIYA_NIGHT_START = [5, 1, 4, 0, 3, 6, 2];
const CHAUGHADIYA_NATURE: Record<string, "good" | "bad" | "neutral"> = {
  Udveg: "bad", Chal: "neutral", Labh: "good", Amrit: "good", Kaal: "bad", Shubh: "good", Rog: "bad",
};

// Rahu Kaal / Yamaganda / Gulika part indices by weekday (0=Sun)
const RAHU_KAAL_PART = [7, 1, 6, 4, 5, 3, 2];
const YAMAGANDA_PART = [4, 3, 2, 1, 0, 6, 5];
const GULIKA_PART = [6, 5, 4, 3, 2, 1, 0];

const DISHA_SHOOL = ["West","East","North","North","South","West","East"];

function tropicalLon(body: A.Body, date: Date): number {
  const g = A.GeoVector(body, date, true);
  const rot = A.Rotation_EQJ_ECT(date);
  const e = A.RotateVector(rot, g);
  return norm360(Math.atan2(e.y, e.x) * 180 / Math.PI);
}

function siderealLon(body: A.Body, date: Date): number {
  return norm360(tropicalLon(body, date) - lahiriAyanamsa(date));
}

export type PanchangInput = {
  date: Date;
  latitude: number;
  longitude: number;
};

export type Panchang = {
  weekday: string;
  tithi: { number: number; name: string; paksha: "Shukla" | "Krishna" };
  nakshatra: { index: number; name: string; pada: number; lord: string };
  yoga: { index: number; name: string };
  karana: { index: number; name: string };
  sunrise: Date | null;
  sunset: Date | null;
  moonrise: Date | null;
  moonset: Date | null;
  solarNoon: Date | null;
  rahuKaal: [Date, Date] | null;
  yamaganda: [Date, Date] | null;
  gulika: [Date, Date] | null;
  abhijitMuhurat: [Date, Date] | null;
  brahmaMuhurat: [Date, Date] | null;
  godhuliMuhurat: [Date, Date] | null;
  chaughadiyaDay: { name: string; nature: string; from: Date; to: Date }[];
  chaughadiyaNight: { name: string; nature: string; from: Date; to: Date }[];
  chandrashtama: string[];
  dishaShool: string;
  ayanamsa: number;
  julianDay: number;
  moonIllumination: number;
  moonAge: number;
};

function jdFromDate(d: Date): number {
  return 2440587.5 + d.getTime() / 86400000;
}

// Nakshatra pada lords cycle
const NAK_LORDS = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];

export function computePanchang(input: PanchangInput): Panchang {
  const { date, latitude, longitude } = input;
  const observer = new A.Observer(latitude, longitude, 0);
  const weekday = WEEKDAY[date.getDay()];

  // Sunrise/sunset within 2 days from midnight
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

  const findRise = (body: A.Body, dir: 1 | -1) => {
    try {
      const t = A.SearchRiseSet(body, observer, dir, dayStart, 2);
      return t ? t.date : null;
    } catch { return null; }
  };
  const sunrise = findRise(A.Body.Sun, +1);
  const sunset = findRise(A.Body.Sun, -1);
  const moonrise = findRise(A.Body.Moon, +1);
  const moonset = findRise(A.Body.Moon, -1);

  // Solar noon: search sun hour angle 0 (transit)
  let solarNoon: Date | null = null;
  try {
    const t = A.SearchHourAngle(A.Body.Sun, observer, 0, dayStart, +1);
    solarNoon = t?.time?.date ?? null;
  } catch { /* ignore */ }

  // Compute Sun and Moon positions at (solarNoon or given date)
  const refDate = solarNoon ?? date;
  const sunSid = siderealLon(A.Body.Sun, refDate);
  const moonSid = siderealLon(A.Body.Moon, refDate);

  // Tithi: 30 parts of 12° each of (Moon - Sun)
  const elong = norm360(moonSid - sunSid);
  const tithiNumber = Math.floor(elong / 12); // 0..29
  const paksha = tithiNumber < 15 ? "Shukla" : "Krishna";

  // Nakshatra: Moon nak
  const NAK_SPAN = 360 / 27;
  const nakIndex = Math.floor(moonSid / NAK_SPAN);
  const nakDeg = moonSid - nakIndex * NAK_SPAN;
  const pada = Math.floor(nakDeg / (NAK_SPAN / 4)) + 1;

  // Yoga: (Sun + Moon) / (360/27)
  const yogaIndex = Math.floor(norm360(sunSid + moonSid) / NAK_SPAN);

  // Karana: 60 half-tithis
  const karanaHalfIndex = Math.floor(elong / 6); // 0..59
  const karanaName = (() => {
    if (karanaHalfIndex === 0) return "Kimstughna";
    if (karanaHalfIndex >= 57) return ["Shakuni","Chatushpada","Naga"][karanaHalfIndex - 57];
    return KARANAS[((karanaHalfIndex - 1) % 7)];
  })();

  // Fixed periods (Rahu Kaal, etc.) — 8 parts of day (sunrise → sunset)
  const parts = (): [Date, Date][] => {
    if (!sunrise || !sunset) return [];
    const total = sunset.getTime() - sunrise.getTime();
    if (total <= 0) return [];
    const step = total / 8;
    return Array.from({ length: 8 }, (_, i) => [
      new Date(sunrise.getTime() + i * step),
      new Date(sunrise.getTime() + (i + 1) * step),
    ] as [Date, Date]);
  };
  const dayParts = parts();
  const partAt = (i: number): [Date, Date] | null => dayParts[i] ?? null;

  const wd = date.getDay();

  // Abhijit Muhurat: 8th muhurta of day (~24 min around solar noon)
  let abhijit: [Date, Date] | null = null;
  if (sunrise && sunset) {
    const noon = sunrise.getTime() + (sunset.getTime() - sunrise.getTime()) / 2;
    const half = 24 * 60 * 1000; // ±24 min → 48 min (1 muhurta)
    abhijit = [new Date(noon - half), new Date(noon + half)];
  }
  // Brahma Muhurat: 96 → 48 min before sunrise
  const brahma: [Date, Date] | null = sunrise
    ? [new Date(sunrise.getTime() - 96 * 60000), new Date(sunrise.getTime() - 48 * 60000)]
    : null;
  // Godhuli Muhurat: ~24 min around sunset
  const godhuli: [Date, Date] | null = sunset
    ? [new Date(sunset.getTime() - 12 * 60000), new Date(sunset.getTime() + 12 * 60000)]
    : null;

  // Chaughadiya
  const chaughadiya = (starts: number[], parts: [Date, Date][]) => {
    return parts.map((p, i) => {
      const name = CHAUGHADIYA_NAMES[(starts[wd] + i) % 7];
      return { name, nature: CHAUGHADIYA_NATURE[name], from: p[0], to: p[1] };
    });
  };
  const chaughadiyaDay = chaughadiya(CHAUGHADIYA_DAY_START, dayParts);
  const nightParts = (() => {
    if (!sunset || !sunrise) return [];
    // Next day's sunrise
    const nextDay = new Date(dayStart.getTime() + 86400000);
    let nextSunrise: Date | null = null;
    try {
      const t = A.SearchRiseSet(A.Body.Sun, observer, +1, nextDay, 2);
      nextSunrise = t ? t.date : null;
    } catch { /* ignore */ }
    if (!nextSunrise) return [];
    const total = nextSunrise.getTime() - sunset.getTime();
    const step = total / 8;
    return Array.from({ length: 8 }, (_, i) => [
      new Date(sunset.getTime() + i * step),
      new Date(sunset.getTime() + (i + 1) * step),
    ] as [Date, Date]);
  })();
  const chaughadiyaNight = chaughadiya(CHAUGHADIYA_NIGHT_START, nightParts);

  // Chandrashtama: 8th, 17th, 22nd nakshatras from current
  const chandrashtama = [7, 16, 21].map((offset) => NAKSHATRAS[(nakIndex + offset) % 27]);

  // Moon phase
  const illum = A.Illumination(A.Body.Moon, refDate);
  const moonAge = elong / 12; // 0..30 days approx

  return {
    weekday,
    tithi: { number: tithiNumber + 1, name: TITHIS[tithiNumber], paksha },
    nakshatra: { index: nakIndex, name: NAKSHATRAS[nakIndex], pada, lord: NAK_LORDS[nakIndex % 9] },
    yoga: { index: yogaIndex, name: YOGAS[yogaIndex] },
    karana: { index: karanaHalfIndex, name: karanaName },
    sunrise, sunset, moonrise, moonset, solarNoon,
    rahuKaal: partAt(RAHU_KAAL_PART[wd]),
    yamaganda: partAt(YAMAGANDA_PART[wd]),
    gulika: partAt(GULIKA_PART[wd]),
    abhijitMuhurat: abhijit,
    brahmaMuhurat: brahma,
    godhuliMuhurat: godhuli,
    chaughadiyaDay,
    chaughadiyaNight,
    chandrashtama,
    dishaShool: DISHA_SHOOL[wd],
    ayanamsa: lahiriAyanamsa(refDate),
    julianDay: jdFromDate(refDate),
    moonIllumination: illum.phase_fraction,
    moonAge,
  };
}

// Named muhurats — utility helpers.
export function fmtTime(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function fmtRange(range: [Date, Date] | null): string {
  if (!range) return "—";
  return `${fmtTime(range[0])} – ${fmtTime(range[1])}`;
}

// Major Hindu festivals — simplified (tithi + month based)
export function todaysFestivals(p: Panchang, date: Date): string[] {
  const list: string[] = [];
  const month = date.getMonth() + 1;
  if (p.tithi.name === "Purnima") list.push("Purnima");
  if (p.tithi.name === "Amavasya") list.push("Amavasya");
  if (p.tithi.name === "Ekadashi") list.push("Ekadashi Vrat");
  if (p.tithi.name === "Chaturthi" && p.tithi.paksha === "Krishna") list.push("Sankashti Chaturthi");
  // Sankranti approximation — Sun changes sign
  // (rough — the true Sankranti check requires sign transition)
  return list;
}
