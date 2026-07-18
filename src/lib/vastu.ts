// Vastu Shastra Compass Engine.
//
// Follows the Vastu Purusha Mandala tradition: 8 cardinal + intercardinal
// directions, each governed by a deity (Ashta-Dikpalaka) and an element.
// The engine takes the home's facing direction (the direction one steps OUT
// while leaving the main door) and returns room-by-room recommendations plus
// a dosha severity score.

export const DIRECTIONS = ["N","NE","E","SE","S","SW","W","NW"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export type DirectionMeta = {
  dir: Direction;
  angle: number;         // bearing degrees
  deity: string;         // Ashta-Dikpalaka
  element: string;
  planet: string;
  best: string[];        // rooms/functions
  avoid: string[];
  color: string;         // tailwind gradient
};

export const DIR_META: Record<Direction, DirectionMeta> = {
  N:  { dir: "N",  angle: 0,   deity: "Kubera",   element: "Water",  planet: "Mercury",
        best: ["Cash locker", "Home office", "Study desk facing N"],
        avoid: ["Toilet", "Storage of stale items"],
        color: "from-sky-400 to-blue-500" },
  NE: { dir: "NE", angle: 45,  deity: "Ishana (Shiva)", element: "Water+Ether", planet: "Jupiter",
        best: ["Pooja room / altar", "Meditation nook", "Water source", "Front entrance (auspicious)"],
        avoid: ["Kitchen", "Toilet", "Bedroom", "Staircase", "Heavy storage"],
        color: "from-amber-300 to-yellow-400" },
  E:  { dir: "E",  angle: 90,  deity: "Indra",    element: "Air",    planet: "Sun",
        best: ["Main entrance", "Living room", "Verandah", "Balcony"],
        avoid: ["Toilet in extreme east", "Tall trees blocking sunlight"],
        color: "from-rose-400 to-orange-400" },
  SE: { dir: "SE", angle: 135, deity: "Agni",     element: "Fire",   planet: "Venus",
        best: ["Kitchen (cook facing east)", "Electrical panel", "Boiler"],
        avoid: ["Pooja room", "Bedroom", "Water tank", "Cash locker"],
        color: "from-red-500 to-rose-600" },
  S:  { dir: "S",  angle: 180, deity: "Yama",     element: "Fire",   planet: "Mars",
        best: ["Master bedroom", "Heavy furniture", "Storage of grains"],
        avoid: ["Main entrance (unless Vedic remedy)", "Water tank", "Open windows to south only"],
        color: "from-orange-500 to-red-600" },
  SW: { dir: "SW", angle: 225, deity: "Nairitya", element: "Earth",  planet: "Rahu",
        best: ["Master bedroom of the head-of-family", "Heavy safes", "Bookshelves"],
        avoid: ["Toilet with cut", "Front entrance", "Lightweight furniture", "Open pit or bore-well"],
        color: "from-stone-500 to-amber-800" },
  W:  { dir: "W",  angle: 270, deity: "Varuna",   element: "Water",  planet: "Saturn",
        best: ["Children's bedroom", "Dining room", "Study for kids"],
        avoid: ["Main entrance without remedy", "Kitchen"],
        color: "from-indigo-400 to-violet-500" },
  NW: { dir: "NW", angle: 315, deity: "Vayu",     element: "Air",    planet: "Moon",
        best: ["Guest bedroom", "Storage of grains", "Cattle / vehicles"],
        avoid: ["Pooja room", "Master bedroom", "Cash locker"],
        color: "from-emerald-400 to-teal-500" },
};

export type Room =
  | "Entrance" | "Kitchen" | "Master Bedroom" | "Children Bedroom"
  | "Pooja Room" | "Living Room" | "Study" | "Toilet"
  | "Water Tank" | "Cash Locker" | "Staircase" | "Dining";

export const ROOM_IDEAL: Record<Room, Direction[]> = {
  "Entrance":         ["N", "E", "NE"],
  "Kitchen":          ["SE"],
  "Master Bedroom":   ["SW", "S"],
  "Children Bedroom": ["W", "NW"],
  "Pooja Room":       ["NE"],
  "Living Room":      ["E", "N", "NE"],
  "Study":            ["N", "E", "NE"],
  "Toilet":           ["NW", "W"],
  "Water Tank":       ["NE", "N"],
  "Cash Locker":      ["N", "NE"],   // opening toward N
  "Staircase":        ["S", "SW", "W"],
  "Dining":           ["W", "E"],
};

export const ROOM_FORBIDDEN: Record<Room, Direction[]> = {
  "Entrance":         ["SW"],
  "Kitchen":          ["NE", "SW"],
  "Master Bedroom":   ["NE"],
  "Children Bedroom": ["SW"],
  "Pooja Room":       ["S", "SW", "SE"],
  "Living Room":      ["SW"],
  "Study":            ["S"],
  "Toilet":           ["NE", "SE", "S"],
  "Water Tank":       ["SE", "SW"],
  "Cash Locker":      ["S", "SE"],
  "Staircase":        ["NE"],
  "Dining":           [],
};

export type Placement = { room: Room; direction: Direction };

export type VastuFinding = {
  room: Room;
  direction: Direction;
  status: "Ideal" | "Neutral" | "Dosha";
  severity: number; // 0..3
  note: string;
};

export type VastuReport = {
  facing: Direction;
  facingNote: string;
  score: number;      // 0..100 harmony
  findings: VastuFinding[];
  primaryDosha: string | null;
  remedies: string[];
};

const FACING_NOTE: Record<Direction, string> = {
  N:  "North-facing homes bless wealth and career (Kubera). Keep the north-east open.",
  NE: "The most auspicious facing. Guard the NE from heaviness, kitchens, toilets.",
  E:  "East-facing invites the Sun and social recognition. Keep the east clean and low.",
  SE: "SE-facing is Agni-dominated — needs a strong SW anchor and Ganesha at entrance.",
  S:  "South-facing needs a Vedic threshold — a Ganesha panel, red brick and a raised sill.",
  SW: "SW-facing is challenging — the door of Nairitya. Requires Vastu remedies and a heavy SW corner.",
  W:  "West-facing is stable and rewarding for later life. Balance with an east window.",
  NW: "NW-facing suits travellers and business. Keep the SW heavy to anchor the home.",
};

export function analyzeVastu(facing: Direction, placements: Placement[]): VastuReport {
  const findings: VastuFinding[] = [];
  let doshaCount = 0;
  let idealCount = 0;

  for (const p of placements) {
    const ideal = ROOM_IDEAL[p.room];
    const forbidden = ROOM_FORBIDDEN[p.room];
    if (forbidden.includes(p.direction)) {
      findings.push({
        room: p.room, direction: p.direction, status: "Dosha", severity: 3,
        note: `${p.room} in ${p.direction} is a classical Vastu dosha (${DIR_META[p.direction].deity}, ${DIR_META[p.direction].element}). Consider relocation or a mirror/salt remedy.`,
      });
      doshaCount++;
    } else if (ideal.includes(p.direction)) {
      findings.push({
        room: p.room, direction: p.direction, status: "Ideal", severity: 0,
        note: `${p.room} in ${p.direction} is aligned with ${DIR_META[p.direction].deity} — auspicious.`,
      });
      idealCount++;
    } else {
      findings.push({
        room: p.room, direction: p.direction, status: "Neutral", severity: 1,
        note: `${p.room} in ${p.direction} is workable. Ideal: ${ideal.join(", ")}.`,
      });
    }
  }

  const total = placements.length || 1;
  const score = Math.round(((idealCount * 100 + (total - idealCount - doshaCount) * 60) / total) - (doshaCount * 15));
  const clampedScore = Math.max(0, Math.min(100, score));

  const primaryDosha = findings.find((f) => f.status === "Dosha")?.room ?? null;

  const remedies: string[] = [];
  if (findings.some((f) => f.room === "Kitchen" && f.status === "Dosha")) {
    remedies.push("Place a small red Ganesha idol on the SE wall of the kitchen; keep the stove SE within the room.");
  }
  if (findings.some((f) => f.room === "Toilet" && f.status === "Dosha")) {
    remedies.push("Keep a bowl of rock salt in the offending toilet; replace every 15 days.");
  }
  if (findings.some((f) => f.room === "Pooja Room" && f.direction !== "NE")) {
    remedies.push("Hang a NE-oriented brass Om or Sri Yantra on the wall of the current altar.");
  }
  if (findings.some((f) => f.room === "Master Bedroom" && f.direction === "NE")) {
    remedies.push("Do not sleep with head to NE — reorient the bed head to south or west.");
  }
  if (findings.some((f) => f.room === "Entrance" && f.status === "Dosha")) {
    remedies.push("Fix a copper Ganesha strip on the threshold; keep a bright light burning at dusk.");
  }
  if (remedies.length === 0) remedies.push("Overall alignment is favourable. Maintain clean NE and heavy SW.");

  return {
    facing,
    facingNote: FACING_NOTE[facing],
    score: clampedScore,
    findings,
    primaryDosha,
    remedies,
  };
}
