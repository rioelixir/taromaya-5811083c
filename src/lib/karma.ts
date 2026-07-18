// Karma & Past-Life Reader — Jyotish karmic astrology engine.
//
// Sources: Brihat Parashara Hora Shastra (Ch. on Karmas), Rahu-Ketu axis
// teachings (Sanjay Rath, Ernst Wilhelm), and Karmic Astrology (Ronnie Gale
// Dreyer). Interpretation combines four pillars:
//
//   1. KETU — south-node = past-life mastery, unfinished business, moksha lens.
//   2. RAHU — north-node = current-life growth vector, the dharmic ache.
//   3. 12TH HOUSE — the house of Vyaya (losses, liberation, foreign lands, sleep).
//   4. RETROGRADE PLANETS — soul memory, karma being re-worked this life.
//
// House-of-Ketu themes and sign-of-Ketu specialties are drawn from the
// classical past-life "occupation" mappings.

import type { KundliChart, PlanetName } from "./vedic";
import { RASHIS } from "./vedic";

export type KarmicPillar = {
  title: string;
  headline: string;
  body: string;
  bullets: string[];
};

export type KarmaReading = {
  ketuSign: string;
  ketuHouse: number;
  rahuSign: string;
  rahuHouse: number;
  twelfthLord: PlanetName | null;
  twelfthPlanets: PlanetName[];
  retrogrades: PlanetName[];
  moksha: number; // 0..100 spiritual liberation index
  pastLifeSummary: string;
  soulLesson: string;
  pillars: KarmicPillar[];
  liberation: {
    mantras: string[];
    practices: string[];
    charities: string[];
  };
};

const KETU_SIGN: Record<number, { archetype: string; skill: string }> = {
  0:  { archetype: "The Warrior",   skill: "combat, leadership, decisive action" },
  1:  { archetype: "The Landowner", skill: "agriculture, wealth-keeping, sensual arts" },
  2:  { archetype: "The Scribe",    skill: "trade, communication, sacred texts" },
  3:  { archetype: "The Nurturer",  skill: "healing, mothering, priestly service" },
  4:  { archetype: "The King",      skill: "royalty, authority, temple governance" },
  5:  { archetype: "The Physician", skill: "medicine, service, meticulous craft" },
  6:  { archetype: "The Diplomat",  skill: "law, partnership, aesthetic arts" },
  7:  { archetype: "The Occultist", skill: "tantra, secrets, transformation, surgery" },
  8:  { archetype: "The Guru",      skill: "wisdom teaching, dharma, philosophy" },
  9:  { archetype: "The Ascetic",   skill: "renunciation, discipline, monastic life" },
  10: { archetype: "The Reformer",  skill: "revolution, science, humanitarian work" },
  11: { archetype: "The Mystic",    skill: "contemplation, poetry, oceanic devotion" },
};

const KETU_HOUSE: Record<number, string> = {
  1:  "self-mastery, embodied identity, an over-familiar sense of 'I am'",
  2:  "family wealth, ancestral speech patterns, food and lineage",
  3:  "courage, siblings, self-effort — you have already earned bravery",
  4:  "mother, motherland, emotional roots — a returning soul",
  5:  "creative and devotional mastery, children, mantra siddhi from before",
  6:  "service, disease, enemies conquered in a prior life",
  7:  "marriage karma, partnerships already deeply known",
  8:  "occult knowledge, near-death, inherited transformations",
  9:  "guru-shishya lineage, prior dharmic teaching, long journeys",
  10: "past authority, career mastery, public karma being released",
  11: "networks, gains, elder-sibling karma completed",
  12: "monastery karma, foreign lives, moksha nearly attained",
};

const RAHU_HOUSE: Record<number, string> = {
  1:  "step into a bold new self — the aching call to originate",
  2:  "build new wealth and a new voice from scratch",
  3:  "grow courage, learn new communication, honour siblings",
  4:  "root into a new home, a new mother-figure, emotional safety",
  5:  "create, romance, invest — take the risk of joy",
  6:  "serve, heal, meet enemies with skill — earn through effort",
  7:  "open to the unknown Other — the mirror you avoided",
  8:  "surrender, share, transform through what is hidden",
  9:  "seek foreign wisdom, new teachers, the pilgrim's road",
  10: "claim public dharma — reinvent your career from within",
  11: "build a chosen community — audacious, unfamiliar friendships",
  12: "release, retreat, dissolve into the vast — foreign lands beckon",
};

const RETRO_KARMA: Record<PlanetName, string> = {
  Sun:     "Father wound / authority karma being re-worked.",
  Moon:    "Mother-emotional patterns replayed for release.",
  Mars:    "Anger, courage and past-life sibling debts revisited.",
  Mercury: "Speech, contracts and prior-life learning re-examined.",
  Jupiter: "Faith and guru-karma being tested and refined.",
  Venus:   "Romantic and artistic ties from before are re-emerging.",
  Saturn:  "Deep discipline karma — you carry an old ascetic vow.",
  Rahu:    "",
  Ketu:    "",
};

const PLANET_MANTRAS: Record<PlanetName, string> = {
  Sun:     "Om Suryaya Namah",
  Moon:    "Om Somaya Namah",
  Mars:    "Om Angarakaya Namah",
  Mercury: "Om Budhaya Namah",
  Jupiter: "Om Brihaspataye Namah",
  Venus:   "Om Shukraya Namah",
  Saturn:  "Om Shanicharaya Namah",
  Rahu:    "Om Rahave Namah",
  Ketu:    "Om Ketave Namah",
};

function houseOf(chart: KundliChart, planet: PlanetName): number {
  const p = chart.planets.find((x) => x.name === planet);
  if (!p) return 1;
  const lagnaRashi = chart.ascendant.rashi;
  return ((p.rashi - lagnaRashi + 12) % 12) + 1;
}

// Simple rashi-lord table (for the 12th lord).
const RASHI_LORDS: PlanetName[] = [
  "Mars","Venus","Mercury","Moon","Sun","Mercury",
  "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter",
];

export function analyzeKarma(chart: KundliChart): KarmaReading {
  const ketu = chart.planets.find((p) => p.name === "Ketu")!;
  const rahu = chart.planets.find((p) => p.name === "Rahu")!;
  const ketuH = houseOf(chart, "Ketu");
  const rahuH = houseOf(chart, "Rahu");

  const twelfthRashi = (chart.ascendant.rashi + 11) % 12;
  const twelfthLord = RASHI_LORDS[twelfthRashi];
  const lagnaRashi = chart.ascendant.rashi;
  const twelfthPlanets = chart.planets
    .filter((p) => ((p.rashi - lagnaRashi + 12) % 12) + 1 === 12)
    .map((p) => p.name);

  const retrogrades = chart.planets
    .filter((p) => p.retrograde && p.name !== "Rahu" && p.name !== "Ketu")
    .map((p) => p.name);

  // Moksha index: presence in 12th + Ketu strength + retrograde count + Jupiter/Ketu conjunction.
  let moksha = 40;
  moksha += twelfthPlanets.length * 8;
  moksha += retrogrades.length * 3;
  if (ketuH === 12 || ketuH === 8 || ketuH === 4) moksha += 10;
  const jupiter = chart.planets.find((p) => p.name === "Jupiter")!;
  if (jupiter.rashi === ketu.rashi) moksha += 8;
  moksha = Math.min(100, moksha);

  const ketuArch = KETU_SIGN[ketu.rashi];
  const pastLifeSummary =
    `In a prior life you moved as ${ketuArch.archetype} — mastering ${ketuArch.skill}. ` +
    `That mastery is stored in the ${ordinal(ketuH)} house of your current chart: ${KETU_HOUSE[ketuH]}.`;

  const soulLesson =
    `This lifetime asks you to grow through Rahu in ${RASHIS[rahu.rashi]} in the ${ordinal(rahuH)} house — ${RAHU_HOUSE[rahuH]}.`;

  const pillars: KarmicPillar[] = [
    {
      title: "Ketu — Past-Life Mastery",
      headline: `${ketuArch.archetype} · ${RASHIS[ketu.rashi]} · ${ordinal(ketuH)} house`,
      body: `Your soul arrives already fluent in ${ketuArch.skill}. Beware of over-relying on this comfortable brilliance — Ketu gives instinctive skill but also a subtle boredom that pulls you away from the very gifts you carry.`,
      bullets: [
        `Native talent: ${ketuArch.skill}`,
        `Karmic theme of this house: ${KETU_HOUSE[ketuH]}`,
        `Pada / Nakshatra: ${ketu.nakshatra + 1} · Pada ${ketu.pada}`,
      ],
    },
    {
      title: "Rahu — Dharmic Ache",
      headline: `${RASHIS[rahu.rashi]} · ${ordinal(rahuH)} house`,
      body: `Rahu is the unfamiliar direction your soul chose. It will feel foreign and even reckless — that discomfort is precisely the growth. The magnetism of Rahu tricks the mind but expands the destiny.`,
      bullets: [
        `Growth edge: ${RAHU_HOUSE[rahuH]}`,
        `Rahu axis polarity: ${ordinal(ketuH)} ↔ ${ordinal(rahuH)} houses`,
      ],
    },
    {
      title: "12th House — The Vyaya Bhava",
      headline: `Ruled by ${twelfthLord} · ${RASHIS[twelfthRashi]}`,
      body: `The 12th is the doorway to moksha, foreign lands, sleep, sub-conscious and letting-go. Planets here are gifts from prior lives that only bloom when surrendered rather than owned.`,
      bullets: twelfthPlanets.length
        ? twelfthPlanets.map((p) => `${p} in the 12th — karmic release theme through ${p}.`)
        : ["No planets in the 12th — moksha is unlocked through Ketu's house and retrograde planets."],
    },
    {
      title: "Retrograde Planets — Soul Memory",
      headline: retrogrades.length ? retrogrades.join(" · ") : "No retrogrades",
      body: retrogrades.length
        ? "Retrograde planets carry unresolved themes from a prior life. They ask you to slow down and re-do rather than push forward. The retrograde impulse is: 'do it again, but with more soul.'"
        : "No retrogrades — your soul entered this life with a fresh mandate rather than old rehearsals.",
      bullets: retrogrades.map((p) => RETRO_KARMA[p]).filter(Boolean),
    },
  ];

  const liberationMantras = [
    PLANET_MANTRAS.Ketu,
    "Om Namo Bhagavate Vasudevaya",
    ...twelfthPlanets.map((p) => PLANET_MANTRAS[p]),
  ];

  const liberationPractices = [
    "Meditate facing south for 11 minutes at dusk (Ketu direction).",
    "One weekly day of silence (mauna vrat) — 12th-house healing.",
    `Chant the ${ketuArch.archetype}'s dharma once a day: "I release the mastery I already hold."`,
    retrogrades.length
      ? `Journal on the ${retrogrades.join(", ")} theme — write the same story from three perspectives.`
      : "Keep a dream journal at bedside — the 12th house speaks in sleep.",
  ];

  const liberationCharities = [
    "Feed stray dogs (Ketu's vahana) on Tuesdays.",
    "Donate a blanket to a wandering ascetic or a shelter.",
    "Offer sesame seeds and a lit ghee lamp on amavasya.",
    twelfthPlanets.includes("Saturn") ? "Serve elderly labourers on Saturdays." : "Serve unseen labour — cooks, cleaners, night-workers.",
  ];

  return {
    ketuSign: RASHIS[ketu.rashi],
    ketuHouse: ketuH,
    rahuSign: RASHIS[rahu.rashi],
    rahuHouse: rahuH,
    twelfthLord,
    twelfthPlanets,
    retrogrades,
    moksha,
    pastLifeSummary,
    soulLesson,
    pillars,
    liberation: {
      mantras: liberationMantras,
      practices: liberationPractices,
      charities: liberationCharities,
    },
  };
}

function ordinal(n: number): string {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
