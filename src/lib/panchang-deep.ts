// Panchang deep-attributes: Panchaka classification, Bhadra timing,
// Tithi qualities, Nakshatra characteristics table.
import { NAKSHATRAS } from "./vedic";

// ─── Panchaka ───────────────────────────────────────────────
// Last 5 nakshatras: Dhanishta (2nd half — approximation uses full),
// Shatabhisha, PBhadrapada, UBhadrapada, Revati → Panchaka period.
// Classical type by weekday during Panchaka:
//   Sun → Roga, Mon → Raja, Tue → Agni,
//   Wed → (safe), Thu → (safe), Fri → Chor, Sat → Mrityu.
const PANCHAKA_NAKS = new Set(["Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"]);
const PANCHAKA_TYPE: Record<number, string | null> = {
  0: "Roga",     // Sunday
  1: "Raja",     // Monday
  2: "Agni",     // Tuesday
  3: null,       // Wednesday — safe
  4: null,       // Thursday — safe
  5: "Chor",     // Friday
  6: "Mrityu",   // Saturday
};
export function classifyPanchaka(nakshatraName: string, weekdayNum: number): {
  active: boolean; type: string | null; note: string;
} {
  const active = PANCHAKA_NAKS.has(nakshatraName);
  const type = active ? PANCHAKA_TYPE[weekdayNum] ?? null : null;
  const note = !active
    ? "No Panchaka today — free of the five inauspicious activities."
    : type === "Roga"   ? "Roga Panchaka — illness. Avoid new medical decisions."
    : type === "Raja"   ? "Raja Panchaka — political/royal favours arise; avoid disputes."
    : type === "Agni"   ? "Agni Panchaka — fire risk. Avoid ignition, welding, kitchen construction."
    : type === "Chor"   ? "Chor Panchaka — theft risk. Guard valuables, avoid travel with cash."
    : type === "Mrityu" ? "Mrityu Panchaka — mortality risk. Avoid roof-work, southern journeys, funerals."
    : "Panchaka active but weekday tempers the effect.";
  return { active, type, note };
}

// ─── Bhadra (Vishti Karana) ─────────────────────────────────
// Vishti Karana = Bhadra: inauspicious for auspicious work.
// We already compute karana; expose a friendly note.
export function bhadraInfo(karanaName: string): { active: boolean; note: string } {
  const active = karanaName === "Vishti";
  return {
    active,
    note: active
      ? "Bhadra (Vishti) active — avoid marriage, house-warming, travel, new ventures during this karana."
      : "No Bhadra — the current karana is smooth.",
  };
}

// ─── Tithi quality ──────────────────────────────────────────
// 5-fold classification used in Muhurta shastra:
// Nanda (1,6,11) — joyful; Bhadra (2,7,12) — nurturing; Jaya (3,8,13) — victory;
// Rikta (4,9,14) — empty/avoid; Purna (5,10,15) — full/complete.
export function tithiQuality(tithiNumberInPaksha: number): {
  name: string; note: string; auspicious: boolean;
} {
  const t = ((tithiNumberInPaksha - 1) % 15) + 1; // 1..15
  const map: Record<number, { name: string; note: string; ok: boolean }> = {
    1: { name: "Nanda",  note: "Joyful — creative starts, art, celebration.", ok: true  },
    6: { name: "Nanda",  note: "Joyful — creative starts, art, celebration.", ok: true  },
    11:{ name: "Nanda",  note: "Joyful — creative starts, art, celebration.", ok: true  },
    2: { name: "Bhadra", note: "Nurturing — care, healing, home, family.",     ok: true  },
    7: { name: "Bhadra", note: "Nurturing — care, healing, home, family.",     ok: true  },
    12:{ name: "Bhadra", note: "Nurturing — care, healing, home, family.",     ok: true  },
    3: { name: "Jaya",   note: "Victory — negotiations, contests, launches.",  ok: true  },
    8: { name: "Jaya",   note: "Victory — negotiations, contests, launches.",  ok: true  },
    13:{ name: "Jaya",   note: "Victory — negotiations, contests, launches.",  ok: true  },
    4: { name: "Rikta",  note: "Empty — avoid weddings, new ventures. Good for demolition, ending cycles.", ok: false },
    9: { name: "Rikta",  note: "Empty — avoid weddings, new ventures.",         ok: false },
    14:{ name: "Rikta",  note: "Empty — avoid weddings, new ventures.",         ok: false },
    5: { name: "Purna",  note: "Full — completion, harvest, spiritual peak.",   ok: true  },
    10:{ name: "Purna",  note: "Full — completion, harvest, spiritual peak.",   ok: true  },
    15:{ name: "Purna",  note: "Full — completion, harvest, spiritual peak.",   ok: true  },
  };
  const r = map[t] ?? { name: "—", note: "", ok: true };
  return { name: r.name, note: r.note, auspicious: r.ok };
}

// ─── Nakshatra characteristics ──────────────────────────────
export type NakChar = {
  name: string;
  deity: string;
  symbol: string;
  gana: "Deva" | "Manushya" | "Rakshasa";
  yoni: string;
  guna: "Sattva" | "Rajas" | "Tamas";
  tatva: "Earth" | "Water" | "Fire" | "Air" | "Ether";
  nature: "Chara" | "Sthira" | "Ugra" | "Mridu" | "Kshipra" | "Tikshna" | "Mishra";
  caste: "Brahmin" | "Kshatriya" | "Vaishya" | "Shudra";
};
const NAK_TABLE: NakChar[] = [
  { name:"Ashwini",           deity:"Ashwini Kumaras",    symbol:"Horse head",           gana:"Deva",      yoni:"Horse",     guna:"Rajas",   tatva:"Earth", nature:"Kshipra", caste:"Vaishya"  },
  { name:"Bharani",           deity:"Yama",               symbol:"Yoni",                 gana:"Manushya",  yoni:"Elephant",  guna:"Rajas",   tatva:"Earth", nature:"Ugra",    caste:"Shudra"   },
  { name:"Krittika",          deity:"Agni",               symbol:"Razor / flame",        gana:"Rakshasa",  yoni:"Sheep",     guna:"Rajas",   tatva:"Earth", nature:"Mishra",  caste:"Brahmin"  },
  { name:"Rohini",            deity:"Brahma",             symbol:"Chariot / banyan",     gana:"Manushya",  yoni:"Serpent",   guna:"Rajas",   tatva:"Earth", nature:"Sthira",  caste:"Shudra"   },
  { name:"Mrigashira",        deity:"Soma (Moon)",        symbol:"Deer's head",          gana:"Deva",      yoni:"Serpent",   guna:"Tamas",   tatva:"Earth", nature:"Mridu",   caste:"Vaishya"  },
  { name:"Ardra",             deity:"Rudra",              symbol:"Teardrop / diamond",   gana:"Manushya",  yoni:"Dog",       guna:"Tamas",   tatva:"Water", nature:"Tikshna", caste:"Shudra"   },
  { name:"Punarvasu",         deity:"Aditi",              symbol:"Quiver of arrows",     gana:"Deva",      yoni:"Cat",       guna:"Sattva",  tatva:"Water", nature:"Chara",   caste:"Vaishya"  },
  { name:"Pushya",            deity:"Brihaspati",         symbol:"Cow udder / flower",   gana:"Deva",      yoni:"Sheep",     guna:"Sattva",  tatva:"Water", nature:"Kshipra", caste:"Kshatriya"},
  { name:"Ashlesha",          deity:"Nagas",              symbol:"Coiled serpent",       gana:"Rakshasa",  yoni:"Cat",       guna:"Sattva",  tatva:"Water", nature:"Tikshna", caste:"Shudra"   },
  { name:"Magha",             deity:"Pitris",             symbol:"Royal throne",         gana:"Rakshasa",  yoni:"Rat",       guna:"Tamas",   tatva:"Water", nature:"Ugra",    caste:"Shudra"   },
  { name:"Purva Phalguni",    deity:"Bhaga",              symbol:"Hammock / bed",        gana:"Manushya",  yoni:"Rat",       guna:"Rajas",   tatva:"Water", nature:"Ugra",    caste:"Brahmin"  },
  { name:"Uttara Phalguni",   deity:"Aryaman",            symbol:"Bed (2nd leg)",        gana:"Manushya",  yoni:"Cow",       guna:"Rajas",   tatva:"Fire",  nature:"Sthira",  caste:"Kshatriya"},
  { name:"Hasta",             deity:"Savitr",             symbol:"Open palm",            gana:"Deva",      yoni:"Buffalo",   guna:"Rajas",   tatva:"Fire",  nature:"Kshipra", caste:"Vaishya"  },
  { name:"Chitra",            deity:"Vishwakarma",        symbol:"Bright jewel",         gana:"Rakshasa",  yoni:"Tiger",     guna:"Tamas",   tatva:"Fire",  nature:"Mridu",   caste:"Shudra"   },
  { name:"Swati",             deity:"Vayu",               symbol:"Young shoot / coral",  gana:"Deva",      yoni:"Buffalo",   guna:"Tamas",   tatva:"Fire",  nature:"Chara",   caste:"Shudra"   },
  { name:"Vishakha",          deity:"Indra & Agni",       symbol:"Triumphal arch",       gana:"Rakshasa",  yoni:"Tiger",     guna:"Sattva",  tatva:"Fire",  nature:"Mishra",  caste:"Brahmin"  },
  { name:"Anuradha",          deity:"Mitra",              symbol:"Lotus / staff",        gana:"Deva",      yoni:"Deer",      guna:"Sattva",  tatva:"Fire",  nature:"Mridu",   caste:"Shudra"   },
  { name:"Jyeshtha",          deity:"Indra",              symbol:"Umbrella / earring",   gana:"Rakshasa",  yoni:"Deer",      guna:"Sattva",  tatva:"Air",   nature:"Tikshna", caste:"Shudra"   },
  { name:"Mula",              deity:"Nirriti",            symbol:"Bunch of roots",       gana:"Rakshasa",  yoni:"Dog",       guna:"Tamas",   tatva:"Air",   nature:"Tikshna", caste:"Shudra"   },
  { name:"Purva Ashadha",     deity:"Apas",               symbol:"Elephant tusk / fan",  gana:"Manushya",  yoni:"Monkey",    guna:"Rajas",   tatva:"Air",   nature:"Ugra",    caste:"Brahmin"  },
  { name:"Uttara Ashadha",    deity:"Vishvedevas",        symbol:"Elephant tusk (2)",    gana:"Manushya",  yoni:"Mongoose",  guna:"Rajas",   tatva:"Air",   nature:"Sthira",  caste:"Kshatriya"},
  { name:"Shravana",          deity:"Vishnu",             symbol:"Ear / three footsteps",gana:"Deva",      yoni:"Monkey",    guna:"Rajas",   tatva:"Air",   nature:"Chara",   caste:"Shudra"   },
  { name:"Dhanishta",         deity:"Eight Vasus",        symbol:"Drum / flute",         gana:"Rakshasa",  yoni:"Lion",      guna:"Tamas",   tatva:"Ether", nature:"Chara",   caste:"Shudra"   },
  { name:"Shatabhisha",       deity:"Varuna",             symbol:"100 healers / circle", gana:"Rakshasa",  yoni:"Horse",     guna:"Tamas",   tatva:"Ether", nature:"Chara",   caste:"Shudra"   },
  { name:"Purva Bhadrapada",  deity:"Aja Ekapada",        symbol:"Front of funeral cot", gana:"Manushya",  yoni:"Lion",      guna:"Sattva",  tatva:"Ether", nature:"Ugra",    caste:"Brahmin"  },
  { name:"Uttara Bhadrapada", deity:"Ahir Budhnya",       symbol:"Back of funeral cot",  gana:"Manushya",  yoni:"Cow",       guna:"Sattva",  tatva:"Ether", nature:"Sthira",  caste:"Kshatriya"},
  { name:"Revati",            deity:"Pushan",             symbol:"Fish / drum",          gana:"Deva",      yoni:"Elephant",  guna:"Sattva",  tatva:"Ether", nature:"Mridu",   caste:"Shudra"   },
];
export function nakshatraCharacter(index: number): NakChar {
  return NAK_TABLE[((index % 27) + 27) % 27];
}
export function nakshatraByName(name: string): NakChar | null {
  const idx = (NAKSHATRAS as readonly string[]).indexOf(name);
  return idx >= 0 ? NAK_TABLE[idx] : null;
}

// ─── Yoga quality (auspicious / inauspicious) ───────────────
const BAD_YOGAS_SET = new Set([
  "Vishkumbha","Atiganda","Shula","Ganda","Vyaghata","Vajra","Vyatipata","Parigha","Vaidhriti",
]);
export function yogaQuality(yogaName: string): { auspicious: boolean; note: string } {
  if (BAD_YOGAS_SET.has(yogaName)) {
    return { auspicious: false, note: `${yogaName} yoga — avoid new ventures, weddings, journeys.` };
  }
  return { auspicious: true, note: `${yogaName} yoga is benign; general activities favoured.` };
}
