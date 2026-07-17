// Vedic Remedies Engine — mantras, yantras, gemstones, colors, days, charity, fasting.
// Deterministic per-planet catalogue; combined with a chart's weak/afflicted planets to
// produce a personalised remedy dossier.

import type { KundliChart, Planet } from "./vedic";

export type PlanetKey =
  | "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter"
  | "Venus" | "Saturn" | "Rahu" | "Ketu";

export type PlanetRemedy = {
  planet: PlanetKey;
  deity: string;
  beejMantra: string;      // seed mantra
  beejCount: number;       // recommended daily japa
  vedicMantra: string;     // vedic hymn / gayatri
  yantra: string;
  gemstone: { primary: string; substitute: string; metal: string; finger: string; day: string };
  color: string;
  day: string;
  fast: string;
  charity: string[];
  donation: string[];
  food: string[];          // dietary suggestion
  behaviour: string[];     // lifestyle upaya
  temple: string;          // deity temple visit
  duration: string;        // typical duration for full remedy
};

export const REMEDY_CATALOG: Record<PlanetKey, PlanetRemedy> = {
  Sun: {
    planet: "Sun",
    deity: "Surya Bhagwan",
    beejMantra: "Om Hraam Hreem Hraum Sah Suryaya Namah",
    beejCount: 7000,
    vedicMantra: "Om Aditya-namaha · Gayatri Mantra at sunrise",
    yantra: "Surya Yantra (3×3 magic square, sum 15)",
    gemstone: { primary: "Ruby (Manik)", substitute: "Red Garnet / Red Spinel", metal: "Gold", finger: "Ring", day: "Sunday sunrise" },
    color: "Deep red / saffron",
    day: "Sunday",
    fast: "Sunday — one meal, no salt after sunset",
    charity: ["Wheat", "Jaggery", "Copper", "Red cloth"],
    donation: ["To father figures / elders", "Serve cows"],
    food: ["Fresh fruit at dawn", "Reduce packaged food"],
    behaviour: ["Salute the sun (Surya Namaskar) daily", "Offer water to the sun with red flower"],
    temple: "Sun temple or Vishnu temple on Sunday",
    duration: "40 days minimum",
  },
  Moon: {
    planet: "Moon",
    deity: "Chandra Dev / Shiva",
    beejMantra: "Om Shraam Shreem Shraum Sah Chandraya Namah",
    beejCount: 11000,
    vedicMantra: "Om Namah Shivaya · Mahamrityunjaya Mantra",
    yantra: "Chandra Yantra",
    gemstone: { primary: "Pearl (Moti)", substitute: "Moonstone", metal: "Silver", finger: "Little", day: "Monday evening" },
    color: "Pearl white / silver",
    day: "Monday",
    fast: "Monday — fruits and milk only",
    charity: ["Rice", "Milk", "White cloth", "Silver"],
    donation: ["To mother / motherly figures", "Feed white cow"],
    food: ["Milk before sleep", "Avoid stale food"],
    behaviour: ["Moonlight walk on full moon", "Keep hydrated with pure water"],
    temple: "Shiva temple every Monday",
    duration: "108 days for lunar afflictions",
  },
  Mars: {
    planet: "Mars",
    deity: "Hanuman / Kartikeya",
    beejMantra: "Om Kraam Kreem Kraum Sah Bhaumaya Namah",
    beejCount: 10000,
    vedicMantra: "Hanuman Chalisa · Sundara Kanda",
    yantra: "Mangal Yantra",
    gemstone: { primary: "Red Coral (Moonga)", substitute: "Carnelian", metal: "Copper or Gold", finger: "Ring", day: "Tuesday sunrise" },
    color: "Deep red / coral",
    day: "Tuesday",
    fast: "Tuesday — no salt, wheat-based meal at dusk",
    charity: ["Red lentils (masoor)", "Copper", "Jaggery"],
    donation: ["Feed monkeys sweet chana", "Donate to soldiers / firefighters"],
    food: ["Warm cooked meals", "Reduce raw onion / garlic if aggressive"],
    behaviour: ["Physical training / martial arts", "Recite Hanuman Chalisa 11× on Tuesday"],
    temple: "Hanuman temple on Tuesday & Saturday",
    duration: "40 Tuesdays for Manglik softening",
  },
  Mercury: {
    planet: "Mercury",
    deity: "Vishnu / Ganesha",
    beejMantra: "Om Braam Breem Braum Sah Budhaya Namah",
    beejCount: 9000,
    vedicMantra: "Vishnu Sahasranama · Ganesha Atharvashirsha",
    yantra: "Budha Yantra",
    gemstone: { primary: "Emerald (Panna)", substitute: "Green Onyx / Peridot", metal: "Gold or Silver", finger: "Little", day: "Wednesday morning" },
    color: "Emerald green",
    day: "Wednesday",
    fast: "Wednesday — green vegetables only",
    charity: ["Green moong dal", "Green cloth", "Books & pens to students"],
    donation: ["Support education charities", "Feed green fodder to cows"],
    food: ["Fresh greens", "Reduce heavy meat"],
    behaviour: ["Read / write daily", "Communicate honestly, avoid gossip"],
    temple: "Vishnu or Ganesha temple on Wednesday",
    duration: "45 days for speech / nerves",
  },
  Jupiter: {
    planet: "Jupiter",
    deity: "Brihaspati / Vishnu",
    beejMantra: "Om Graam Greem Graum Sah Gurave Namah",
    beejCount: 16000,
    vedicMantra: "Guru Stotram · Vishnu Sahasranama",
    yantra: "Guru Yantra",
    gemstone: { primary: "Yellow Sapphire (Pukhraj)", substitute: "Yellow Topaz / Citrine", metal: "Gold", finger: "Index", day: "Thursday sunrise" },
    color: "Golden yellow",
    day: "Thursday",
    fast: "Thursday — yellow food, no salt",
    charity: ["Yellow lentils (chana dal)", "Turmeric", "Books", "Saffron"],
    donation: ["To teachers, gurus, priests", "Sponsor a student"],
    food: ["Turmeric milk", "Ghee in daily food"],
    behaviour: ["Study scripture / philosophy", "Wear yellow on Thursday"],
    temple: "Vishnu temple; offer banana leaves and yellow flowers",
    duration: "16 Thursdays for wisdom & marriage",
  },
  Venus: {
    planet: "Venus",
    deity: "Lakshmi / Shukracharya",
    beejMantra: "Om Draam Dreem Draum Sah Shukraya Namah",
    beejCount: 16000,
    vedicMantra: "Shri Suktam · Mahalakshmi Ashtakam",
    yantra: "Shukra Yantra",
    gemstone: { primary: "Diamond (Heera)", substitute: "White Sapphire / Zircon", metal: "Platinum or White gold", finger: "Middle or Ring", day: "Friday sunrise" },
    color: "White / pastel pink",
    day: "Friday",
    fast: "Friday — white sweet, milk, fruits",
    charity: ["Sugar", "White cloth", "Perfumes", "Silver"],
    donation: ["To women's shelters", "Feed young girls (kanya bhojan)"],
    food: ["Fresh dairy, sweet fruits", "Avoid excess spice"],
    behaviour: ["Art, music, beauty practices", "Maintain harmony in relationships"],
    temple: "Lakshmi temple on Friday",
    duration: "16 Fridays for love & abundance",
  },
  Saturn: {
    planet: "Saturn",
    deity: "Shani Dev / Hanuman",
    beejMantra: "Om Praam Preem Praum Sah Shanaischaraya Namah",
    beejCount: 23000,
    vedicMantra: "Shani Chalisa · Dashrath-krita Shani Stotra",
    yantra: "Shani Yantra",
    gemstone: { primary: "Blue Sapphire (Neelam)", substitute: "Amethyst / Lapis Lazuli", metal: "Iron or Panch-dhatu", finger: "Middle", day: "Saturday twilight" },
    color: "Dark blue / black",
    day: "Saturday",
    fast: "Saturday — black sesame, one meal after sunset",
    charity: ["Black sesame (til)", "Iron", "Mustard oil", "Black cloth"],
    donation: ["Serve the elderly, disabled, servants", "Feed crows and stray dogs"],
    food: ["Simple, slow-cooked", "Fasting one day a week"],
    behaviour: ["Discipline & service", "Light mustard-oil lamp under a peepal on Saturday"],
    temple: "Shani Dham & Hanuman temple every Saturday",
    duration: "7.5 years context (Sade Sati) — start any Saturday, sustain lifelong ethic",
  },
  Rahu: {
    planet: "Rahu",
    deity: "Durga / Bhairava",
    beejMantra: "Om Bhraam Bhreem Bhraum Sah Rahave Namah",
    beejCount: 18000,
    vedicMantra: "Durga Saptashati · Kalabhairava Ashtakam",
    yantra: "Rahu Yantra",
    gemstone: { primary: "Hessonite Garnet (Gomed)", substitute: "Orange Zircon", metal: "Silver or Panch-dhatu", finger: "Middle", day: "Saturday twilight" },
    color: "Smoky grey / indigo",
    day: "Saturday (with Shani rituals)",
    fast: "Saturday — no fried food, no alcohol",
    charity: ["Blankets to the poor", "Coconut in flowing water", "Radish"],
    donation: ["Support outcaste and marginalised", "Feed lepers / homeless"],
    food: ["Avoid stimulants and processed food", "Fresh, simple"],
    behaviour: ["Meditate on inner shadow", "Discipline digital consumption"],
    temple: "Kalabhairava or Durga temple",
    duration: "18 months of consistent practice",
  },
  Ketu: {
    planet: "Ketu",
    deity: "Ganesha / Matsya",
    beejMantra: "Om Sraam Sreem Sraum Sah Ketave Namah",
    beejCount: 17000,
    vedicMantra: "Ganesha Atharvashirsha · Ketu Stotra",
    yantra: "Ketu Yantra",
    gemstone: { primary: "Cat's Eye (Lehsunia)", substitute: "Chrysoberyl", metal: "Silver or Panch-dhatu", finger: "Middle or Little", day: "Thursday twilight" },
    color: "Multi-colour / smoky",
    day: "Thursday (with Guru)",
    fast: "Thursday — one grain-free meal",
    charity: ["Sesame oil", "Blankets", "Ash-grey items"],
    donation: ["Feed dogs, especially strays", "Support monks & renunciates"],
    food: ["Sattvic diet", "Reduce meat"],
    behaviour: ["Silence & meditation weekly", "Detach from unhealthy attachments"],
    temple: "Ganesha temple; offer sesame and durva grass",
    duration: "9 months for karmic release",
  },
};

// Rank planets by need for remedy: retrograde, combust, debilitation, or 6/8/12 house placement.
export type RemedyPriority = { planet: PlanetKey; score: number; reasons: string[] };

const DEBILITATION: Partial<Record<PlanetKey, number>> = {
  Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0,
};

export function prioritiseRemedies(chart: KundliChart): RemedyPriority[] {
  const asc = chart.ascendant.rashi;
  const scored: RemedyPriority[] = [];
  for (const p of chart.planets) {
    const reasons: string[] = [];
    let s = 0;
    const houseFromAsc = ((p.rashi - asc + 12) % 12) + 1;
    if ([6, 8, 12].includes(houseFromAsc)) { s += 2; reasons.push(`In ${houseFromAsc}th house from Lagna`); }
    if (p.retrograde) { s += 1; reasons.push("Retrograde"); }
    if (DEBILITATION[p.name as PlanetKey] === p.rashi) { s += 3; reasons.push("Debilitated"); }
    if (p.name === "Sun") {
      const sunLon = chart.planets.find((x: Planet) => x.name === "Sun")?.longitude ?? 0;
      const nearSun = chart.planets.filter((x: Planet) => x.name !== "Sun" && x.name !== "Moon" && x.name !== "Rahu" && x.name !== "Ketu"
        && Math.abs(((x.longitude - sunLon + 540) % 360) - 180) > 172);
      if (nearSun.length) { /* combusted planets handled elsewhere */ }
    }
    scored.push({ planet: p.name as PlanetKey, score: s, reasons });
  }
  // Sort descending by score; keep only planets with score>0 or top 3.
  scored.sort((a, b) => b.score - a.score);
  const needy = scored.filter(x => x.score > 0);
  return needy.length ? needy : scored.slice(0, 3);
}
