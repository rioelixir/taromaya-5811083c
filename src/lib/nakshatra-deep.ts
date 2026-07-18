// Deep Nakshatra intelligence — all 27 nakshatras with pada-level attributes.
// Data compiled from Brihat Parasara Hora Shastra, Muhurta Chintamani, and
// Varahamihira's Brihat Samhita. Pada-navamsha follows the classical
// nakshatra → navamsha mapping (each pada = 3°20', mapped to a rashi via
// the 108-navamsha sequence from Aries).

import { NAKSHATRAS, NAKSHATRA_LORDS, RASHIS } from "./vedic";

export type Gana = "Deva" | "Manushya" | "Rakshasa";
export type Nadi = "Adi" | "Madhya" | "Antya";
export type Yoni =
  | "Horse" | "Elephant" | "Sheep" | "Serpent" | "Dog" | "Cat"
  | "Rat" | "Cow" | "Buffalo" | "Tiger" | "Deer" | "Monkey"
  | "Mongoose" | "Lion";
export type YoniGender = "Male" | "Female";
export type Guna = "Sattva" | "Rajas" | "Tamas";
export type Varna = "Brahmin" | "Kshatriya" | "Vaishya" | "Shudra";
export type Tattva = "Fire" | "Earth" | "Air" | "Water" | "Ether";
export type Direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export type Group = "Movable" | "Fixed" | "Dual" | "Sharp" | "Soft" | "Fierce" | "Mixed" | "Swift";

export type NakshatraProfile = {
  index: number;                // 0..26
  name: string;
  lord: string;                 // dasha lord
  deity: string;
  symbol: string;
  yoni: Yoni;
  yoniGender: YoniGender;
  gana: Gana;
  nadi: Nadi;
  guna: Guna;
  varna: Varna;
  tattva: Tattva;
  direction: Direction;
  group: Group;
  bodyPart: string;
  favourable: string[];         // activities suited
  unfavourable: string[];
  career: string[];
  strengths: string[];
  shadows: string[];
  mantra: string;
  gemstone: string;
  deityShort: string;           // one-line archetype
};

// Yoni pairs (14 animals across 27 with Rohini/Mrigashira sharing serpent trope
// per Muhurta Chintamani). Standard Prashna Marga table:
const YONI: [Yoni, YoniGender][] = [
  ["Horse","Male"],    ["Elephant","Male"],  ["Sheep","Female"],
  ["Serpent","Male"],  ["Serpent","Female"], ["Dog","Female"],
  ["Cat","Female"],    ["Sheep","Male"],     ["Cat","Male"],
  ["Rat","Male"],      ["Rat","Female"],     ["Cow","Female"],
  ["Buffalo","Female"],["Tiger","Female"],   ["Buffalo","Male"],
  ["Tiger","Male"],    ["Deer","Female"],    ["Deer","Male"],
  ["Dog","Male"],      ["Monkey","Male"],    ["Mongoose","Male"],
  ["Monkey","Female"], ["Lion","Female"],    ["Horse","Female"],
  ["Lion","Male"],     ["Cow","Male"],       ["Elephant","Female"],
];

const GANA: Gana[] = [
  "Deva","Manushya","Rakshasa","Manushya","Deva","Manushya",
  "Deva","Deva","Rakshasa","Rakshasa","Manushya","Manushya",
  "Deva","Rakshasa","Deva","Rakshasa","Deva","Rakshasa",
  "Rakshasa","Manushya","Manushya","Deva","Rakshasa","Rakshasa",
  "Manushya","Manushya","Deva",
];

// Nadi runs 1..3,3..1,1..3,3..1... in the classical order.
const NADI: Nadi[] = [
  "Adi","Madhya","Antya","Antya","Madhya","Adi",
  "Adi","Madhya","Antya","Antya","Madhya","Adi",
  "Adi","Madhya","Antya","Antya","Madhya","Adi",
  "Adi","Madhya","Antya","Antya","Madhya","Adi",
  "Adi","Madhya","Antya",
];

const GUNA: Guna[] = [
  "Rajas","Rajas","Rajas","Rajas","Tamas","Tamas",
  "Sattva","Sattva","Sattva","Tamas","Tamas","Tamas",
  "Tamas","Tamas","Tamas","Sattva","Sattva","Sattva",
  "Tamas","Rajas","Rajas","Rajas","Rajas","Rajas",
  "Sattva","Sattva","Sattva",
];

const VARNA: Varna[] = [
  "Vaishya","Mleccha" as any,"Brahmin","Shudra","Farmer" as any,"Butcher" as any,
  "Vaishya","Kshatriya","Mleccha" as any,"Shudra","Brahmin","Kshatriya",
  "Vaishya","Farmer" as any,"Butcher" as any,"Farmer" as any,"Shudra","Warrior" as any,
  "Butcher" as any,"Brahmin","Kshatriya","Mleccha" as any,"Farmer" as any,"Butcher" as any,
  "Brahmin","Kshatriya","Shudra",
];

const TATTVA: Tattva[] = [
  "Earth","Earth","Earth","Earth","Earth","Water",
  "Water","Water","Water","Fire","Fire","Fire",
  "Fire","Fire","Fire","Air","Air","Air",
  "Air","Air","Air","Ether","Ether","Ether",
  "Ether","Ether","Ether",
];

const GROUP: Group[] = [
  "Swift","Fierce","Mixed","Fixed","Soft","Sharp",
  "Movable","Swift","Sharp","Fierce","Fierce","Fixed",
  "Swift","Soft","Movable","Mixed","Soft","Sharp",
  "Sharp","Fierce","Fixed","Movable","Movable","Movable",
  "Fierce","Fixed","Soft",
];

const DIRECTION: Direction[] = [
  "S","W","N","E","SE","SW",
  "NW","NE","S","W","N","E",
  "SE","SW","NW","NE","S","W",
  "N","E","SE","SW","NW","NE",
  "S","W","N",
];

const DATA: Array<Omit<NakshatraProfile,
  "index"|"name"|"lord"|"yoni"|"yoniGender"|"gana"|"nadi"|"guna"|"varna"|"tattva"|"direction"|"group"
>> = [
  { deity:"Ashwini Kumaras", deityShort:"Divine healers, twin physicians", symbol:"Horse's head", bodyPart:"Knees / upper feet",
    favourable:["Travel","New ventures","Healing","Sports","Buying vehicles"], unfavourable:["Slow work","Marriage rites","Debt-taking"],
    career:["Doctor","Athlete","Pilot","Emergency responder","Entrepreneur"],
    strengths:["Speed","Courage","Healing touch","Youthful energy"], shadows:["Impulsiveness","Impatience","Restlessness"],
    mantra:"Om Ashvibhyām Namah", gemstone:"Cat's Eye" },
  { deity:"Yama", deityShort:"Lord of restraint & death", symbol:"Yoni (womb / vulva)", bodyPart:"Head",
    favourable:["Creative arts","Sexuality","Endings & transformations"], unfavourable:["Beginnings","Sattvic ceremonies","Long journeys"],
    career:["Artist","Judge","Undertaker","Fertility specialist","Ethicist"],
    strengths:["Creative fire","Moral clarity","Endurance"], shadows:["Jealousy","Sensual excess","Judgmentalism"],
    mantra:"Om Yamāya Namah", gemstone:"Diamond" },
  { deity:"Agni", deityShort:"Fire god, cosmic priest", symbol:"Razor / axe / flame", bodyPart:"Head & top of face",
    favourable:["Purification","Cutting ties","Weapons","Fire ceremonies"], unfavourable:["Peace-making","Softness","Marriage"],
    career:["Surgeon","Chef","Military","Metallurgist","Priest"],
    strengths:["Sharp intellect","Purifying zeal","Leadership"], shadows:["Cruelty","Burning others","Perfectionism"],
    mantra:"Om Agnaye Namah", gemstone:"Ruby" },
  { deity:"Brahma / Prajapati", deityShort:"Creator, source of forms", symbol:"Chariot / banyan tree", bodyPart:"Forehead / calves",
    favourable:["Marriage","Planting","Home-building","Art","Farming"], unfavourable:["Destruction","Aggression","Divorce"],
    career:["Farmer","Artist","Mother","Architect","Beauty industry"],
    strengths:["Beauty","Fertility","Steadiness","Charm"], shadows:["Sensuality","Materialism","Possessiveness"],
    mantra:"Om Brahmaṇe Namah", gemstone:"Pearl" },
  { deity:"Soma / Chandra", deityShort:"Moon god of nectar", symbol:"Deer's head", bodyPart:"Eyebrows",
    favourable:["Travel","Study","Art","Fine work","Perfumery"], unfavourable:["Confrontation","Heavy labour"],
    career:["Researcher","Musician","Perfumer","Writer","Traveler"],
    strengths:["Curiosity","Gentleness","Artistic sense"], shadows:["Fickleness","Suspicion","Overthinking"],
    mantra:"Om Somāya Namah", gemstone:"Red Coral" },
  { deity:"Rudra", deityShort:"Storm god, howler of grief", symbol:"Teardrop / diamond head", bodyPart:"Eyes",
    favourable:["Research","Destruction of enemies","Deep work"], unfavourable:["Marriage","Journeys","New ventures"],
    career:["Scientist","Detective","Surgeon","Analyst","Crisis worker"],
    strengths:["Piercing insight","Emotional depth","Truth-seeking"], shadows:["Grief","Rage","Tears","Volatility"],
    mantra:"Om Rudrāya Namah", gemstone:"Gomedh" },
  { deity:"Aditi", deityShort:"Mother of the gods, infinity", symbol:"Bow & quiver", bodyPart:"Nose / fingers",
    favourable:["Returns","Renewals","Beginnings","Home-coming"], unfavourable:["Endings","Detachment"],
    career:["Teacher","Storyteller","Publisher","Reconciler","Housing sector"],
    strengths:["Optimism","Renewability","Truthfulness","Generosity"], shadows:["Restlessness","Repetition of mistakes"],
    mantra:"Om Adityai Namah", gemstone:"Yellow Sapphire" },
  { deity:"Brihaspati", deityShort:"Guru of the gods", symbol:"Cow's udder / lotus", bodyPart:"Mouth / face",
    favourable:["Priesthood","Rituals","Study","Investing","Foundations"], unfavourable:["Malefic acts","Aggression"],
    career:["Priest","Teacher","Counsellor","Banker","Nurturer"],
    strengths:["Nourishment","Wisdom","Reliability"], shadows:["Rigidity","Over-caution","Self-righteousness"],
    mantra:"Om Bṛhaspatye Namah", gemstone:"Yellow Sapphire" },
  { deity:"Naga (Serpent)", deityShort:"Kundalini serpent", symbol:"Coiled serpent", bodyPart:"Ears / joints",
    favourable:["Occult","Deep work","Poisons","Politics"], unfavourable:["Marriage","Open dealings","Trust"],
    career:["Occultist","Politician","Pharmacist","Hypnotist","Sex therapist"],
    strengths:["Mystic depth","Persuasion","Kundalini power"], shadows:["Deception","Toxicity","Clinging"],
    mantra:"Om Sarpebhyo Namah", gemstone:"Blue Sapphire" },
  { deity:"Pitrs (Ancestors)", deityShort:"Royal ancestors", symbol:"Royal throne", bodyPart:"Nose",
    favourable:["Ancestor rites","Coronations","Ceremonies"], unfavourable:["Humility work","Simple beginnings"],
    career:["King/Leader","Politician","Ancestor healer","Historian"],
    strengths:["Regal bearing","Ancestor pride","Ambition"], shadows:["Arrogance","Caste pride","Ego"],
    mantra:"Om Pitṛbhyo Namah", gemstone:"Emerald" },
  { deity:"Bhaga", deityShort:"God of enjoyment & fortune", symbol:"Front legs of a bed / hammock", bodyPart:"Genitals / right hand",
    favourable:["Marriage","Pleasure","Relaxation","Arts"], unfavourable:["Renunciation","Ascetic work"],
    career:["Entertainer","Wedding planner","Luxury industry","Model"],
    strengths:["Charisma","Playfulness","Love of beauty"], shadows:["Lethargy","Indulgence","Vanity"],
    mantra:"Om Bhagāya Namah", gemstone:"Diamond" },
  { deity:"Aryaman", deityShort:"God of contracts & patronage", symbol:"Back legs of a bed / four legs of a cot", bodyPart:"Sexual organs / left hand",
    favourable:["Marriage","Contracts","Patronage","Charity"], unfavourable:["Aggression","Solo work"],
    career:["Diplomat","Wedding officiant","Patron","HR","Social worker"],
    strengths:["Fairness","Nobility","Warmth"], shadows:["Complacency","People-pleasing"],
    mantra:"Om Aryamṇe Namah", gemstone:"Sun-stone / Ruby" },
  { deity:"Savitr (Sun)", deityShort:"Solar craftsman", symbol:"Hand / palm", bodyPart:"Hands",
    favourable:["Craft","Skill","Trading","Placement of images"], unfavourable:["Deceit","Trickery"],
    career:["Craftsperson","Healer","Palmist","Trader","Massage therapist"],
    strengths:["Manual skill","Cleverness","Youthfulness"], shadows:["Trickery","Nervous energy","Kleptomania"],
    mantra:"Om Savitre Namah", gemstone:"Emerald" },
  { deity:"Vishvakarma / Tvashtar", deityShort:"Cosmic architect", symbol:"Bright jewel / pearl", bodyPart:"Forehead / neck",
    favourable:["Design","Building","Art","Fashion","Jewelry"], unfavourable:["Rough work","Warfare"],
    career:["Designer","Architect","Jeweler","Artist","Engineer"],
    strengths:["Elegance","Creative genius","Charisma"], shadows:["Vanity","Materialism","Illusion"],
    mantra:"Om Tvaṣṭre Namah", gemstone:"Red Coral" },
  { deity:"Vayu", deityShort:"Wind god", symbol:"Sword / coral", bodyPart:"Chest & upper teeth",
    favourable:["Travel","Diplomacy","Movement","Independence"], unfavourable:["Fixed commitment","Stagnation"],
    career:["Diplomat","Traveler","Aviator","Air-force","Merchant"],
    strengths:["Independence","Curiosity","Charm","Flexibility"], shadows:["Indecision","Wandering","Superficiality"],
    mantra:"Om Vāyave Namah", gemstone:"Hessonite" },
  { deity:"Indra & Agni", deityShort:"Kings of heaven & fire", symbol:"Potter's wheel / triumphal arch", bodyPart:"Arms",
    favourable:["Achievement","Goals","Competition","Ambition"], unfavourable:["Peace-work","Retreat"],
    career:["Politician","CEO","Warrior","Marketer","Athlete"],
    strengths:["Determination","Achievement","Focus"], shadows:["Envy","Vengeance","Obsession"],
    mantra:"Om Indrāgnibhyām Namah", gemstone:"Diamond" },
  { deity:"Mitra", deityShort:"God of friendship & compassion", symbol:"Lotus / triumphal gateway", bodyPart:"Heart / breasts",
    favourable:["Friendship","Cooperation","Devotion","Long journeys"], unfavourable:["Enmity","Cheating"],
    career:["Diplomat","Counsellor","Devotee","Team leader","Community organiser"],
    strengths:["Devotion","Success through friends","Balance"], shadows:["Dependence on others","Melancholy"],
    mantra:"Om Mitrāya Namah", gemstone:"Yellow Sapphire" },
  { deity:"Indra", deityShort:"King of gods", symbol:"Circular amulet / earring", bodyPart:"Neck",
    favourable:["Challenging kings/authority","Debate","Occult"], unfavourable:["Peaceful negotiation","Passivity"],
    career:["Occultist","Investigator","Warrior","Executive","Yogi"],
    strengths:["Courage","Occult power","Piercing insight"], shadows:["Arrogance","Vengeance","Anger"],
    mantra:"Om Indrāya Namah", gemstone:"Blue Sapphire" },
  { deity:"Nirriti", deityShort:"Goddess of dissolution", symbol:"Bunch of roots / tied roots", bodyPart:"Feet",
    favourable:["Uprooting","Ending","Deep research","Investigation"], unfavourable:["Beginnings","Marriage","Home-building"],
    career:["Investigator","Root-cause analyst","Philosopher","Herbalist","Cremator"],
    strengths:["Getting to the root","Ruthless truth","Renunciation"], shadows:["Destruction","Grief","Isolation"],
    mantra:"Om Nirṛtaye Namah", gemstone:"Cat's Eye" },
  { deity:"Apas / Waters", deityShort:"Cosmic waters", symbol:"Elephant tusk / winnowing basket", bodyPart:"Thighs",
    favourable:["Invincible work","Bathing rites","Ambition"], unfavourable:["Retreat","Endings"],
    career:["Debater","Athlete","Politician","Water worker","Warrior"],
    strengths:["Invincibility","Purity","Endurance"], shadows:["Pride","Stubbornness"],
    mantra:"Om Adbhyaḥ Namah", gemstone:"Diamond" },
  { deity:"Vishvedevas", deityShort:"Universal gods", symbol:"Elephant tusk / small bed", bodyPart:"Thighs",
    favourable:["Universal work","Diplomacy","Leadership"], unfavourable:["Selfish agenda"],
    career:["Statesperson","Leader","Judge","Philosopher","Teacher"],
    strengths:["Nobility","Wisdom","Balance","Final victory"], shadows:["Overwork","Difficulty finishing"],
    mantra:"Om Viśvebhyo Devebhyo Namah", gemstone:"Yellow Sapphire" },
  { deity:"Vishnu", deityShort:"Preserver of dharma", symbol:"Ear / three footprints", bodyPart:"Ears",
    favourable:["Listening","Learning","Ceremony","Travel"], unfavourable:["Isolation","Deceit"],
    career:["Teacher","Astrologer","Wise elder","Musician","Broadcaster"],
    strengths:["Wisdom","Fame","Devotion","Listening"], shadows:["Restlessness","Gossip"],
    mantra:"Om Viṣṇave Namah", gemstone:"Blue Sapphire" },
  { deity:"Ashta Vasus", deityShort:"Eight elemental gods", symbol:"Drum / flute", bodyPart:"Back",
    favourable:["Music","Wealth","Group work","Charity"], unfavourable:["Marriage (native traditions)","Solitude"],
    career:["Musician","Fundraiser","Philanthropist","Real estate","Rhythm work"],
    strengths:["Rhythm","Wealth","Generosity"], shadows:["Marital discord","Restlessness","Envy"],
    mantra:"Om Vasubhyo Namah", gemstone:"Ruby" },
  { deity:"Varuna", deityShort:"God of cosmic waters & oaths", symbol:"Empty circle / 100 flowers/physicians", bodyPart:"Jaw",
    favourable:["Healing","Research","Occult","Mysticism"], unfavourable:["Superficial work"],
    career:["Healer","Astrologer","Researcher","Mystic","Doctor"],
    strengths:["Healing","Vision","Independent thought"], shadows:["Loneliness","Detachment","Secrecy"],
    mantra:"Om Varuṇāya Namah", gemstone:"Gomedh" },
  { deity:"Aja Ekapada", deityShort:"One-footed goat / rising fire", symbol:"Front legs of funeral cot / sword", bodyPart:"Sides of body",
    favourable:["Ascetic work","Intense sadhana","Fire practice"], unfavourable:["Pleasure","Marriage","Comfort"],
    career:["Ascetic","Fire-walker","Intense researcher","Solitary artist"],
    strengths:["Intensity","Vertical fire","Ascetic power"], shadows:["Nervousness","Anxiety","Isolation"],
    mantra:"Om Aja Ekapade Namah", gemstone:"Blue Sapphire" },
  { deity:"Ahir Budhnya", deityShort:"Serpent of the deep", symbol:"Back legs of funeral cot / twin", bodyPart:"Feet",
    favourable:["Deep meditation","Occult","Compassion","Endings"], unfavourable:["Aggression","Superficial work"],
    career:["Mystic","Astrologer","Compassion worker","Ancestral healer"],
    strengths:["Deep wisdom","Compassion","Renunciation"], shadows:["Laziness","Escapism","Passivity"],
    mantra:"Om Ahi Budhnyāya Namah", gemstone:"Blue Sapphire" },
  { deity:"Pushan", deityShort:"Nourisher, shepherd of souls", symbol:"Fish / drum", bodyPart:"Feet",
    favourable:["Journeys","Nurture","Endings & liberation"], unfavourable:["Aggression","War"],
    career:["Nurturer","Vet","Care worker","Musician","Pilgrimage guide"],
    strengths:["Kindness","Prosperity","Safe passage","Devotion"], shadows:["Over-giving","Escapism","Naïveté"],
    mantra:"Om Pūṣṇe Namah", gemstone:"Yellow Sapphire" },
];

export function nakshatraProfile(i: number): NakshatraProfile {
  const idx = ((i % 27) + 27) % 27;
  const [yoni, yoniGender] = YONI[idx];
  return {
    index: idx,
    name: NAKSHATRAS[idx],
    lord: NAKSHATRA_LORDS[idx],
    yoni, yoniGender,
    gana: GANA[idx],
    nadi: NADI[idx],
    guna: GUNA[idx],
    varna: VARNA[idx],
    tattva: TATTVA[idx],
    direction: DIRECTION[idx],
    group: GROUP[idx],
    ...DATA[idx],
  };
}

// Pada → Navamsha rashi. Each of the 108 padas (27 × 4) maps to a navamsha
// sign. Fire-sign nakshatras start their navamsha count from Aries, Earth
// from Capricorn, Air from Libra, Water from Cancer — the classical
// Parasari rule. Simpler equivalent: pada k (1-indexed) of nakshatra n
// occupies the (n*4 + k - 1)th navamsha from Aries.
export function padaNavamsha(nakIndex: number, pada: number): number {
  return ((nakIndex * 4 + (pada - 1)) % 12);
}

// Pada element (based on the navamsha rashi's element).
export function padaElement(nakIndex: number, pada: number): Tattva {
  const rashi = padaNavamsha(nakIndex, pada);
  // 0 Aries..11 Pisces
  const map: Tattva[] = [
    "Fire","Earth","Air","Water",
    "Fire","Earth","Air","Water",
    "Fire","Earth","Air","Water",
  ];
  return map[rashi];
}

export function padaTheme(nakIndex: number, pada: number): string {
  const nav = padaNavamsha(nakIndex, pada);
  const el = padaElement(nakIndex, pada);
  const rashi = RASHIS[nav];
  const themes: Record<Tattva, string> = {
    Fire: "spirit, initiative, dharma",
    Earth: "form, resources, artha",
    Air: "relationship, mind, kama",
    Water: "emotion, moksha, dissolution",
    Ether: "space, boundaryless expansion",
  };
  return `${rashi} navamsha · ${themes[el]}`;
}

// Compatibility scoring by gana/nadi/yoni — for use in a nakshatra dashboard.
export function ganaCompat(a: Gana, b: Gana): { score: number; note: string } {
  if (a === b) return { score: 6, note: "Same gana — natural harmony" };
  if ((a === "Deva" && b === "Manushya") || (a === "Manushya" && b === "Deva"))
    return { score: 5, note: "Deva–Manushya — cordial" };
  if ((a === "Manushya" && b === "Rakshasa") || (a === "Rakshasa" && b === "Manushya"))
    return { score: 1, note: "Manushya–Rakshasa — friction" };
  if ((a === "Deva" && b === "Rakshasa") || (a === "Rakshasa" && b === "Deva"))
    return { score: 0, note: "Deva–Rakshasa — hostile" };
  return { score: 3, note: "Neutral" };
}

export function nadiCompat(a: Nadi, b: Nadi): { score: number; note: string } {
  if (a === b) return { score: 0, note: `Same ${a} nadi — dosha unless cancelled` };
  return { score: 8, note: "Different nadi — full points" };
}

export function yoniCompat(a: Yoni, b: Yoni): { score: number; note: string } {
  if (a === b) return { score: 4, note: "Same yoni — natural bond" };
  const enemies: Record<string, string[]> = {
    Cow: ["Tiger"], Tiger: ["Cow","Deer"],
    Elephant: ["Lion"], Lion: ["Elephant"],
    Horse: ["Buffalo"], Buffalo: ["Horse"],
    Dog: ["Deer"], Deer: ["Dog","Tiger"],
    Cat: ["Rat"], Rat: ["Cat"],
    Sheep: ["Monkey"], Monkey: ["Sheep"],
    Serpent: ["Mongoose"], Mongoose: ["Serpent"],
  };
  if (enemies[a]?.includes(b)) return { score: 0, note: "Enemy yonis — hostility" };
  return { score: 2, note: "Neutral yonis" };
}
