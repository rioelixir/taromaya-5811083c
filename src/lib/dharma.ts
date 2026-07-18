// Dharma & Life Purpose — Atmakaraka, Ishta Devata (12th-from-AK in D9) and
// the 10th-house lord synthesised into a life-mission read.

import type { KundliChart, PlanetName } from "./vedic";
import { RASHIS } from "./vedic";
import { computeVarga } from "./vedic-extended";

const RASHI_LORDS: PlanetName[] = [
  "Mars","Venus","Mercury","Moon","Sun","Mercury",
  "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter",
];

const CHARAKARAKAS: PlanetName[] = [
  "Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu",
];

export type ChakarakaAssignment = {
  role: "AK" | "AmK" | "BhK" | "MK" | "PK" | "GK" | "DK" | "PiK";
  fullName: string;
  planet: PlanetName;
  degrees: number;
};

const ROLE_META: Record<ChakarakaAssignment["role"], { name: string; theme: string }> = {
  AK:  { name: "Atmakaraka",   theme: "Soul · life mission" },
  AmK: { name: "Amatyakaraka", theme: "Career · minister of the soul" },
  BhK: { name: "Bhatrikaraka", theme: "Siblings · courage" },
  MK:  { name: "Matrikaraka",  theme: "Mother · emotional home" },
  PK:  { name: "Putrakaraka",  theme: "Progeny · creativity" },
  GK:  { name: "Gnatikaraka",  theme: "Enemies · discipline" },
  DK:  { name: "Darakaraka",   theme: "Spouse · partnership" },
  PiK: { name: "Pitrikaraka",  theme: "Father · dharmic lineage" },
};

const ISHTA_DEVATA_BY_SIGN: Record<number, string> = {
  0:  "Kartikeya · Mangala",       // Aries
  1:  "Sri Lakshmi",                // Taurus
  2:  "Vishnu (Vamana) · Ganesha",  // Gemini
  3:  "Krishna · Parvati",          // Cancer
  4:  "Sri Rama · Vishnu",          // Leo
  5:  "Vishnu (Buddha) · Sarasvati",// Virgo
  6:  "Lakshmi · Parashurama",      // Libra
  7:  "Narasimha · Kali",           // Scorpio
  8:  "Vishnu (Vamana) · Guru Dattatreya", // Sagittarius
  9:  "Kurma · Hanuman",            // Capricorn
  10: "Kurma · Shani-Ayyappa",      // Aquarius
  11: "Matsya · Vishnu Narayana",   // Pisces
};

const PLANET_DHARMA: Record<PlanetName, string> = {
  Sun:     "Sovereignty, leadership, public service, ethics of the king.",
  Moon:    "Nurture, healing, hospitality, holding emotional space.",
  Mars:    "Protecting the weak, discipline, martial arts, surgery, engineering.",
  Mercury: "Communication, writing, teaching, trade, sacred computation.",
  Jupiter: "Wisdom, counsel, priestly service, philosophy, philanthropy.",
  Venus:   "Beauty, art, music, luxury with dharma, healing through relationship.",
  Saturn:  "Service to the ignored, sustained labour, tradition, monastic vows.",
  Rahu:    "Innovation, cross-cultural work, technology, unusual paths.",
  Ketu:    "Renunciation, occult mastery, moksha-oriented sciences.",
};

export type DharmaReading = {
  charakarakas: ChakarakaAssignment[];
  atmakaraka: ChakarakaAssignment;
  ishtaDevata: {
    sign: string;
    signIndex: number;
    lord: PlanetName;
    deity: string;
    guidance: string;
  };
  tenthHouseLord: {
    planet: PlanetName;
    sign: string;
    houseFromAsc: number;
  };
  atmakarakaDharma: string;
  lifeMission: string;
};

function houseOf(chart: KundliChart, planet: PlanetName): number {
  const p = chart.planets.find((x) => x.name === planet);
  if (!p) return 10;
  return ((p.rashi - chart.ascendant.rashi + 12) % 12) + 1;
}

export function analyzeDharma(chart: KundliChart): DharmaReading {
  // Jaimini Charakarakas — sort 8 planets (excl. Ketu) by descending degrees.
  const candidates = chart.planets
    .filter((p) => CHARAKARAKAS.includes(p.name))
    .map((p) => ({ name: p.name, deg: p.degreeInRashi }))
    .sort((a, b) => b.deg - a.deg);

  const roles: ChakarakaAssignment["role"][] = ["AK","AmK","BhK","MK","PK","GK","DK","PiK"];
  const charakarakas: ChakarakaAssignment[] = candidates.slice(0, 8).map((c, i) => ({
    role: roles[i],
    fullName: ROLE_META[roles[i]].name,
    planet: c.name,
    degrees: c.deg,
  }));

  const atmakaraka = charakarakas[0];

  // Ishta Devata: 12th sign from AK's navamsa (D9) position.
  const d9 = computeVarga(chart, "D9");
  const akD9 = d9.planetSigns.find((s) => s.name === atmakaraka.planet)!;
  const twelfthFromAK = (akD9.sign + 11) % 12;
  const lord = RASHI_LORDS[twelfthFromAK];
  const deity = ISHTA_DEVATA_BY_SIGN[twelfthFromAK];

  // 10th house lord (Karma bhava).
  const tenthSign = (chart.ascendant.rashi + 9) % 12;
  const tenthLord = RASHI_LORDS[tenthSign];
  const tenthLordPlanet = chart.planets.find((p) => p.name === tenthLord)!;
  const tenthLordHouse = houseOf(chart, tenthLord);

  const lifeMission =
    `Your soul (${atmakaraka.planet} as Atmakaraka in ${RASHIS[atmakaraka.planet === "Rahu" ? 0 : 0]}) ` +
    `crystallises its dharma through ${PLANET_DHARMA[atmakaraka.planet].toLowerCase()} ` +
    `The 10th lord ${tenthLord} in the ${ordinal(tenthLordHouse)} house shapes the outer form of your karma. ` +
    `Worshipping ${deity} (Ishta Devata) grants moksha in this incarnation.`;

  return {
    charakarakas,
    atmakaraka,
    ishtaDevata: {
      sign: RASHIS[twelfthFromAK],
      signIndex: twelfthFromAK,
      lord,
      deity,
      guidance: `Chant to ${deity} 108 times daily. Keep an image or yantra of the ${deity.split(" · ")[0]} facing east on your altar. This deity carries your moksha thread.`,
    },
    tenthHouseLord: {
      planet: tenthLord,
      sign: RASHIS[tenthLordPlanet.rashi],
      houseFromAsc: tenthLordHouse,
    },
    atmakarakaDharma: PLANET_DHARMA[atmakaraka.planet],
    lifeMission,
  };
}

function ordinal(n: number): string {
  const s = ["th","st","nd","rd"]; const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export { ROLE_META };
