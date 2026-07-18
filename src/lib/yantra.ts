// Yantra generator — SVG sacred geometry keyed to the 9 grahas and Sri Yantra.

export type YantraKey =
  | "Sri" | "Sun" | "Moon" | "Mars" | "Mercury"
  | "Jupiter" | "Venus" | "Saturn" | "Rahu" | "Ketu";

export type YantraMeta = {
  key: YantraKey;
  name: string;
  deity: string;
  mantra: string;
  benefit: string;
  color: string;
  glyph: string;
};

export const YANTRAS: Record<YantraKey, YantraMeta> = {
  Sri:     { key: "Sri",     name: "Sri Yantra",     deity: "Tripura Sundari", mantra: "Om Aim Hreem Shreem Namah", benefit: "Wealth, wisdom and moksha in one geometry — the queen of yantras.", color: "#D4AF37", glyph: "श्री" },
  Sun:     { key: "Sun",     name: "Surya Yantra",   deity: "Surya",          mantra: "Om Suryaya Namah",           benefit: "Vitality, authority, father's health, government favour.", color: "#F59E0B", glyph: "☉" },
  Moon:    { key: "Moon",    name: "Chandra Yantra", deity: "Soma",           mantra: "Om Somaya Namah",            benefit: "Mental peace, emotional balance, mother's wellbeing.", color: "#E0E7FF", glyph: "☽" },
  Mars:    { key: "Mars",    name: "Mangal Yantra",  deity: "Mangala",        mantra: "Om Angarakaya Namah",        benefit: "Courage, land, property, victory over enemies.", color: "#DC2626", glyph: "♂" },
  Mercury: { key: "Mercury", name: "Budh Yantra",    deity: "Budha",          mantra: "Om Budhaya Namah",           benefit: "Intellect, speech, trade, success in learning.", color: "#10B981", glyph: "☿" },
  Jupiter: { key: "Jupiter", name: "Guru Yantra",    deity: "Brihaspati",     mantra: "Om Brihaspataye Namah",      benefit: "Wisdom, wealth, progeny, dharma and guru's grace.", color: "#EAB308", glyph: "♃" },
  Venus:   { key: "Venus",   name: "Shukra Yantra",  deity: "Shukra",         mantra: "Om Shukraya Namah",          benefit: "Love, beauty, art, luxury, marital harmony.", color: "#F472B6", glyph: "♀" },
  Saturn:  { key: "Saturn",  name: "Shani Yantra",   deity: "Shani",          mantra: "Om Shanicharaya Namah",      benefit: "Karmic relief, longevity, discipline, Sade Sati protection.", color: "#1E293B", glyph: "♄" },
  Rahu:    { key: "Rahu",    name: "Rahu Yantra",    deity: "Rahu",           mantra: "Om Rahave Namah",            benefit: "Protection from illusion, sudden gains, foreign paths.", color: "#6B21A8", glyph: "☊" },
  Ketu:    { key: "Ketu",    name: "Ketu Yantra",    deity: "Ketu",           mantra: "Om Ketave Namah",            benefit: "Moksha, occult mastery, past-life healing.", color: "#7C3AED", glyph: "☋" },
};

// Classical 3x3 magic-square number sums per graha (traditional Vedic yantras).
export const MAGIC_SQUARES: Record<Exclude<YantraKey, "Sri">, number[][]> = {
  Sun:     [[6,1,8],[7,5,3],[2,9,4]],           // sum 15
  Moon:    [[7,2,9],[8,6,4],[3,10,5]],          // sum 18
  Mars:    [[8,3,10],[9,7,5],[4,11,6]],         // sum 21
  Mercury: [[9,4,11],[10,8,6],[5,12,7]],        // sum 24
  Jupiter: [[10,5,12],[11,9,7],[6,13,8]],       // sum 27
  Venus:   [[11,6,13],[12,10,8],[7,14,9]],      // sum 30
  Saturn:  [[13,8,15],[14,12,10],[9,16,11]],    // sum 36 (Chautisa variant)
  Rahu:    [[14,9,16],[15,13,11],[10,17,12]],   // sum 39
  Ketu:    [[15,10,17],[16,14,12],[11,18,13]],  // sum 42
};
