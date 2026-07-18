// Avakhada Chakra — AstroSage-style classical natal summary derived from the
// Vedic chart. Draws Varna/Vashya/Yoni/Gana/Nadi/Tatva/Paya + Nakshatra pada
// syllables so a user can name a newborn or interpret constitution at a glance.
import {
  NAKSHATRAS, NAKSHATRA_LORDS, RASHIS, RASHI_LORDS,
  type KundliChart, type PlanetName,
} from "./vedic";

// From ashtakoot tables (rashi/nakshatra indexed).
const VARNA_BY_RASHI = ["Kshatriya","Vaishya","Shudra","Brahmin","Kshatriya","Vaishya","Shudra","Brahmin","Kshatriya","Vaishya","Shudra","Brahmin"];
const VASHYA_BY_RASHI = ["Chatushpada","Chatushpada","Manav","Jalachar","Vanachar","Manav","Manav","Keet","Manav","Chatushpada","Manav","Jalachar"];
const YONI_BY_NAK = ["Horse","Elephant","Sheep","Serpent","Serpent","Dog","Cat","Sheep","Cat","Rat","Rat","Cow","Buffalo","Tiger","Buffalo","Tiger","Deer","Deer","Dog","Monkey","Mongoose","Monkey","Lion","Horse","Lion","Cow","Elephant"];
const GANA_BY_NAK = ["Deva","Manushya","Rakshasa","Manushya","Deva","Manushya","Deva","Deva","Rakshasa","Rakshasa","Manushya","Manushya","Deva","Rakshasa","Deva","Rakshasa","Deva","Rakshasa","Rakshasa","Manushya","Manushya","Deva","Rakshasa","Rakshasa","Manushya","Manushya","Deva"];
const NADI_BY_NAK = ["Adi","Madhya","Antya","Antya","Madhya","Adi","Adi","Madhya","Antya","Antya","Madhya","Adi","Adi","Madhya","Antya","Antya","Madhya","Adi","Adi","Madhya","Antya","Antya","Madhya","Adi","Adi","Madhya","Antya"];

const TATVA_BY_RASHI = ["Agni","Prithvi","Vayu","Jal","Agni","Prithvi","Vayu","Jal","Agni","Prithvi","Vayu","Jal"];
const TATVA_LABEL: Record<string,string> = { Agni: "Fire", Prithvi: "Earth", Vayu: "Air", Jal: "Water" };

// Paya (metal of birth) — classical count from Moon nakshatra grouped in 3s.
// Bucket: 0-8 = Gold, 9-17 = Silver, 18-26 = Copper (traditional Chandra-paya scheme).
function payaFromNakshatra(nak: number): string {
  if (nak < 9) return "Gold";
  if (nak < 18) return "Silver";
  return "Copper";
}

// Standard nakshatra-pada name syllables (AstroSage / classical convention).
export const PADA_SYLLABLES: string[][] = [
  ["Chu","Che","Cho","La"],
  ["Li","Lu","Le","Lo"],
  ["A","I","U","E"],
  ["O","Va","Vi","Vu"],
  ["Ve","Vo","Ka","Ki"],
  ["Ku","Gha","Ng","Chh"],
  ["Ke","Ko","Ha","Hi"],
  ["Hu","He","Ho","Da"],
  ["Di","Du","De","Do"],
  ["Ma","Mi","Mu","Me"],
  ["Mo","Ta","Ti","Tu"],
  ["Te","To","Pa","Pi"],
  ["Pu","Sha","Na","Tha"],
  ["Pe","Po","Ra","Ri"],
  ["Ru","Re","Ro","Ta"],
  ["Ti","Tu","Te","To"],
  ["Na","Ni","Nu","Ne"],
  ["No","Ya","Yi","Yu"],
  ["Ye","Yo","Bha","Bhi"],
  ["Bhu","Dha","Bha","Dha"],
  ["Bhe","Bho","Ja","Ji"],
  ["Ju","Je","Jo","Kha"],
  ["Ga","Gi","Gu","Ge"],
  ["Go","Sa","Si","Su"],
  ["Se","So","Da","Di"],
  ["Du","Tha","Jha","Da"],
  ["De","Do","Cha","Chi"],
];

export type AvakhadaSummary = {
  ascendant: { rashi: string; lord: string };
  sunSign: { rashi: string; lord: string };
  moonSign: { rashi: string; lord: string };
  nakshatra: { name: string; pada: number; lord: string; charan: number };
  nameSyllable: string;
  varna: string;
  vashya: string;
  yoni: string;
  gana: string;
  nadi: string;
  tatva: string;
  tatvaLabel: string;
  paya: string;
  yunja: "Poorva" | "Madhya" | "Uttara";
  ganda: boolean;
  gandaReason?: string;
};

export function computeAvakhada(chart: KundliChart): AvakhadaSummary {
  const sun = chart.planets.find((p) => p.name === ("Sun" as PlanetName))!;
  const moon = chart.planets.find((p) => p.name === ("Moon" as PlanetName))!;
  const nak = moon.nakshatra;
  const pada = moon.pada;
  const yunja: AvakhadaSummary["yunja"] =
    nak < 9 ? "Poorva" : nak < 18 ? "Madhya" : "Uttara";

  // Gandanta: junction of water & fire signs at nakshatra boundary
  // (Revati-Ashwini, Ashlesha-Magha, Jyeshtha-Mula) — flagged when Moon is
  // in last pada of the water nakshatra or first pada of the fire one.
  const gandantaEndings = [26, 8, 17]; // last pada of these = ganda
  const gandantaStarts = [0, 9, 18];
  const ganda =
    (gandantaEndings.includes(nak) && pada === 4) ||
    (gandantaStarts.includes(nak) && pada === 1);

  return {
    ascendant: { rashi: RASHIS[chart.ascendant.rashi], lord: RASHI_LORDS[chart.ascendant.rashi] },
    sunSign: { rashi: RASHIS[sun.rashi], lord: RASHI_LORDS[sun.rashi] },
    moonSign: { rashi: RASHIS[moon.rashi], lord: RASHI_LORDS[moon.rashi] },
    nakshatra: {
      name: NAKSHATRAS[nak],
      pada,
      lord: NAKSHATRA_LORDS[nak],
      charan: pada,
    },
    nameSyllable: PADA_SYLLABLES[nak][pada - 1],
    varna: VARNA_BY_RASHI[moon.rashi],
    vashya: VASHYA_BY_RASHI[moon.rashi],
    yoni: YONI_BY_NAK[nak],
    gana: GANA_BY_NAK[nak],
    nadi: NADI_BY_NAK[nak],
    tatva: TATVA_BY_RASHI[moon.rashi],
    tatvaLabel: TATVA_LABEL[TATVA_BY_RASHI[moon.rashi]],
    paya: payaFromNakshatra(nak),
    yunja,
    ganda,
    gandaReason: ganda ? "Moon at Gandanta junction — classical caution period." : undefined,
  };
}
