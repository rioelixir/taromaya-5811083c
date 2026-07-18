// Jaimini engine: Chara Karakas, Atmakaraka, Arudha Padas (A1..A12 + Upapada),
// and a simplified Chara (Maharishi Jaimini) Dasha.
//
// Inputs use the ChartLite shape produced by src/lib/astro-provider.server.ts.

export type ChartLite = {
  ascendant: { rashi: number; degreeInRashi: number };
  planets: Array<{
    name: string;
    longitude: number;
    rashi: number;
    house: number;
    degreeInRashi: number;
    retrograde: boolean;
  }>;
};

export const RASHIS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
] as const;

// Traditional rulers per rashi (0..11). Used for Arudha Pada + Chara Dasha.
export const RASHI_LORD: string[] = [
  "Mars","Venus","Mercury","Moon","Sun","Mercury",
  "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter",
];

// -------- Chara Karakas (7-karaka scheme, standard Parashari-Jaimini) --------

export type CharaKaraka =
  | "AK" // Atmakaraka
  | "AmK" // Amatyakaraka
  | "BK" // Bhratrikaraka
  | "MK" // Matrikaraka
  | "PK" // Putrakaraka
  | "GK" // Gnatikaraka
  | "DK"; // Darakaraka

export const KARAKA_MEANING: Record<CharaKaraka, string> = {
  AK: "Soul / self · highest advancement in current sign",
  AmK: "Career, minister, guiding intellect",
  BK: "Siblings, courage, communication",
  MK: "Mother, comforts, home",
  PK: "Children, creativity, mantra",
  GK: "Cousins, disease, obstacles",
  DK: "Spouse, partnerships",
};

const KARAKA_ORDER: CharaKaraka[] = ["AK","AmK","BK","MK","PK","GK","DK"];

/** 7-karaka scheme uses Sun..Saturn + Rahu. Rahu uses (30 − degree). */
export function computeCharaKarakas(chart: ChartLite): Array<{
  karaka: CharaKaraka;
  planet: string;
  degree: number;
  rashi: number;
}> {
  const eligible = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu"];
  const ranked = chart.planets
    .filter((p) => eligible.includes(p.name))
    .map((p) => ({
      planet: p.name,
      rashi: p.rashi,
      // Rahu: reverse degree
      degree: p.name === "Rahu" ? 30 - p.degreeInRashi : p.degreeInRashi,
      raw: p.degreeInRashi,
    }))
    .sort((a, b) => b.degree - a.degree);

  // Take top 7 to fill the seven karakas.
  return ranked.slice(0, 7).map((r, i) => ({
    karaka: KARAKA_ORDER[i],
    planet: r.planet,
    degree: r.raw,
    rashi: r.rashi,
  }));
}

// -------- Arudha Padas (A1..A12) + Upapada Lagna --------
// For house H with lord L (sitting in sign S), count L→S = N.
// Arudha = N signs from S (i.e. sign S + (N − 1)).
// Exception: if Arudha equals L's own sign or 7th from it, shift 10 houses further.

function planetSign(chart: ChartLite, name: string): number | null {
  const p = chart.planets.find((pl) => pl.name === name);
  return p ? p.rashi : null;
}

export function computeArudhaPadas(chart: ChartLite): Array<{
  house: number;      // 1..12
  sign: number;       // 0..11 (sign occupying that house)
  lord: string;
  arudha: number;     // 0..11 (resulting sign)
}> {
  const lagna = chart.ascendant.rashi;
  const out: Array<{ house: number; sign: number; lord: string; arudha: number }> = [];

  for (let h = 1; h <= 12; h++) {
    const sign = (lagna + (h - 1)) % 12;
    const lord = RASHI_LORD[sign];
    const lordSign = planetSign(chart, lord);
    if (lordSign === null) continue;

    // Count from lord's sign to house-sign, both inclusive.
    let n = ((sign - lordSign + 12) % 12) + 1;
    let arudha = (lordSign + (n - 1)) % 12;

    // Exception: Arudha in own sign (lordSign) or 7th from it → shift 10 signs.
    if (arudha === lordSign || arudha === (lordSign + 6) % 12) {
      arudha = (arudha + 9) % 12;
    }

    out.push({ house: h, sign, lord, arudha });
  }
  return out;
}

// -------- Chara Dasha (simplified, Parashara-Jaimini convention) --------
// Mahadasha starts from the Lagna sign.
// Duration for a sign = (count from that sign to its lord, minus 1); minimum 1, maximum 12.
// Odd signs move forward, even signs move backward through the zodiac.

const YEAR_MS = 365.2425 * 86400 * 1000;

function isOddSign(s: number) {
  // Aries=0 is odd, Taurus=1 is even, etc.
  return s % 2 === 0;
}

export type CharaDashaPeriod = {
  sign: number;
  lord: string;
  years: number;
  start: Date;
  end: Date;
};

export function computeCharaDasha(
  chart: ChartLite,
  birthDate: Date,
  cycles: number = 2,
): CharaDashaPeriod[] {
  const start = chart.ascendant.rashi;
  const seq: number[] = [];
  let cur = start;
  for (let i = 0; i < 12 * cycles; i++) {
    seq.push(cur);
    // Advance
    cur = isOddSign(cur) ? (cur + 1) % 12 : (cur + 11) % 12;
  }

  const out: CharaDashaPeriod[] = [];
  let t = birthDate.getTime();
  for (const s of seq) {
    const lord = RASHI_LORD[s];
    const lordSign = planetSign(chart, lord);
    let years: number;
    if (lordSign === null) {
      years = 1;
    } else {
      // Count from sign s to lordSign in the sign's direction.
      const step = isOddSign(s) ? 1 : -1;
      let n = 0;
      let x = s;
      while (x !== lordSign && n < 12) { x = (x + step + 12) % 12; n++; }
      years = Math.max(1, Math.min(12, n)); // minus one, but 0→1 fallback
      if (lordSign === s) years = 12; // lord in own sign → full 12
    }
    const dur = years * YEAR_MS;
    out.push({ sign: s, lord, years, start: new Date(t), end: new Date(t + dur) });
    t += dur;
  }
  return out;
}
