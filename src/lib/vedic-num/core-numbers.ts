/**
 * The full core-number sheet for the Vedic Numerology product.
 *
 * Everything here is derived from the audited engines in `numerology.ts`,
 * `vedic-numerology.ts` and `name-numerology-pro.ts`; this module only
 * arranges them into one labelled sheet with the working shown, so the
 * interface never has to recompute anything itself.
 */
import { computeNumerology, reduce, parseBirthDate, NUMBER_MEANINGS } from "@/lib/numerology";
import { vedicNumerology, VEDIC_PLANETS } from "@/lib/vedic-numerology";
import { personalCycles } from "@/lib/numerology-dasha";

export type CoreNumber = {
  key: string;
  label: string;
  value: number;
  planet: string;
  how: string;
  meaning: string;
  group: "birth" | "name" | "cycle" | "advanced";
};

const PY: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};
const VOWELS = new Set("AEIOU");

function clean(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z ]/g, " ");
}
function digits(n: number): number {
  return String(Math.abs(Math.trunc(n))).split("").reduce((s, c) => s + Number(c), 0);
}
function planetOf(n: number): string {
  return VEDIC_PLANETS[reduce(n, false)] ?? "—";
}
function meaningOf(n: number): string {
  return NUMBER_MEANINGS[n] ?? NUMBER_MEANINGS[reduce(n, false)] ?? "";
}

/** Most frequent letter value in a name — the hidden passion. */
export function hiddenPassion(name: string): number {
  const tally = new Map<number, number>();
  for (const ch of clean(name).replace(/ /g, "")) {
    const v = PY[ch];
    if (!v) continue;
    tally.set(v, (tally.get(v) ?? 0) + 1);
  }
  let best = 0;
  let bestCount = -1;
  for (const [v, c] of tally) if (c > bestCount || (c === bestCount && v > best)) { best = v; bestCount = c; }
  return best;
}

/** Balance number — the initials of every word in the name. */
export function balanceNumber(name: string): number {
  const initials = clean(name).split(/\s+/).filter(Boolean).map((w) => PY[w[0] ?? ""] ?? 0);
  return reduce(initials.reduce((s, x) => s + x, 0), false);
}

/** Rational thought — first name letters plus the day of birth. */
export function rationalThought(name: string, birthDate: string): number {
  const first = clean(name).split(/\s+/).filter(Boolean)[0] ?? "";
  const letters = [...first].reduce((s, c) => s + (PY[c] ?? 0), 0);
  const parsed = parseBirthDate(birthDate);
  return reduce(letters + (parsed?.d ?? 0), false);
}

/** Attitude number — birth month plus birth day. */
export function attitudeNumber(birthDate: string): number {
  const p = parseBirthDate(birthDate);
  if (!p) return 0;
  return reduce(digits(p.m) + digits(p.d), false);
}

/** Karmic number — the pre-reduction total of the full name. */
export function karmicNumber(name: string): number {
  const total = [...clean(name).replace(/ /g, "")].reduce((s, c) => s + (PY[c] ?? 0), 0);
  return total;
}

/** Essence for a given age — letters of the name cycling by their value. */
export function essenceAt(name: string, birthDate: string, when: Date = new Date()): number {
  const p = parseBirthDate(birthDate);
  if (!p) return 0;
  const letters = [...clean(name).replace(/ /g, "")];
  if (letters.length === 0) return 0;
  const age = Math.max(0, when.getUTCFullYear() - p.y - (when.getUTCMonth() + 1 < p.m ? 1 : 0));
  let cursor = 0;
  let i = 0;
  // Each letter is "active" for as many years as its value.
  while (cursor <= age && i < letters.length * 40) {
    cursor += PY[letters[i % letters.length] ?? ""] ?? 1;
    if (cursor > age) break;
    i += 1;
  }
  return reduce(PY[letters[i % letters.length] ?? ""] ?? 0, false);
}

export type CoreSheet = {
  numbers: CoreNumber[];
  byKey: Record<string, CoreNumber>;
  pinnacles: number[];
  challenges: number[];
  masters: number[];
  karmicDebts: number[];
};

export function coreSheet(fullName: string, birthDate: string, when: Date = new Date()): CoreSheet {
  const py = computeNumerology({ fullName, birthDate, now: when }, "Pythagorean");
  const vedic = (() => {
    try { return vedicNumerology(birthDate, fullName); } catch { return null; }
  })();
  const cycles = (() => {
    try { return personalCycles(birthDate, when); } catch { return null; }
  })();
  const p = parseBirthDate(birthDate);
  const uy = reduce(digits(when.getUTCFullYear()), false);
  const um = reduce(uy + (when.getUTCMonth() + 1), false);
  const ud = reduce(um + when.getUTCDate(), false);

  const rows: CoreNumber[] = [
    { key: "birth", label: "Birth number", value: p ? reduce(p.d, false) : 0, group: "birth",
      how: "The day of the month you were born, reduced to one digit.", meaning: meaningOf(p ? reduce(p.d, false) : 0), planet: planetOf(p?.d ?? 0) },
    { key: "driver", label: "Driver number (Mulank)", value: vedic?.mulank ?? 0, group: "birth",
      how: "Birth day reduced. It drives your everyday temperament.", meaning: meaningOf(vedic?.mulank ?? 0), planet: planetOf(vedic?.mulank ?? 0) },
    { key: "conductor", label: "Conductor number (Bhagyank)", value: vedic?.bhagyank ?? 0, group: "birth",
      how: "Whole birth date summed and reduced. It conducts your destiny.", meaning: meaningOf(vedic?.bhagyank ?? 0), planet: planetOf(vedic?.bhagyank ?? 0) },
    { key: "psychic", label: "Psychic number", value: vedic?.mulank ?? 0, group: "birth",
      how: "The inner self as you experience it — the same value as the driver.", meaning: meaningOf(vedic?.mulank ?? 0), planet: planetOf(vedic?.mulank ?? 0) },
    { key: "lifePath", label: "Life path number", value: py.lifePath, group: "birth",
      how: "Month, day and year reduced separately, then summed. Master numbers are kept.", meaning: meaningOf(py.lifePath), planet: planetOf(py.lifePath) },
    { key: "destiny", label: "Destiny number", value: py.destiny, group: "name",
      how: "Every letter of the full name, summed and reduced.", meaning: meaningOf(py.destiny), planet: planetOf(py.destiny) },
    { key: "expression", label: "Expression number", value: py.destiny, group: "name",
      how: "The same letter total as destiny, read as how you show up in the world.", meaning: meaningOf(py.destiny), planet: planetOf(py.destiny) },
    { key: "soulUrge", label: "Soul urge number", value: py.soulUrge, group: "name",
      how: "Only the vowels of the name.", meaning: meaningOf(py.soulUrge), planet: planetOf(py.soulUrge) },
    { key: "personality", label: "Personality number", value: py.personality, group: "name",
      how: "Only the consonants of the name.", meaning: meaningOf(py.personality), planet: planetOf(py.personality) },
    { key: "maturity", label: "Maturity number", value: py.maturity, group: "advanced",
      how: "Life path plus destiny — the theme of the second half of life.", meaning: meaningOf(py.maturity), planet: planetOf(py.maturity) },
    { key: "attitude", label: "Attitude number", value: attitudeNumber(birthDate), group: "advanced",
      how: "Birth month plus birth day — the first impression you give.", meaning: meaningOf(attitudeNumber(birthDate)), planet: planetOf(attitudeNumber(birthDate)) },
    { key: "challenge", label: "Challenge number", value: py.challenges[0] ?? 0, group: "advanced",
      how: "The difference between reduced month and day — the lesson you keep meeting.", meaning: meaningOf(py.challenges[0] ?? 0), planet: planetOf(py.challenges[0] ?? 0) },
    { key: "karmic", label: "Karmic number", value: karmicNumber(fullName), group: "advanced",
      how: "The name total before reduction. 13, 14, 16 and 19 carry a karmic debt.", meaning: "Read together with the karmic debts listed below.", planet: planetOf(karmicNumber(fullName)) },
    { key: "balance", label: "Balance number", value: balanceNumber(fullName), group: "advanced",
      how: "The initials of each word in the name — how you steady yourself under strain.", meaning: meaningOf(balanceNumber(fullName)), planet: planetOf(balanceNumber(fullName)) },
    { key: "hidden", label: "Hidden passion number", value: hiddenPassion(fullName), group: "advanced",
      how: "The letter value that repeats most often in the name.", meaning: meaningOf(hiddenPassion(fullName)), planet: planetOf(hiddenPassion(fullName)) },
    { key: "rational", label: "Rational thought number", value: rationalThought(fullName, birthDate), group: "advanced",
      how: "First name letters plus the birth day — how you reason things out.", meaning: meaningOf(rationalThought(fullName, birthDate)), planet: planetOf(rationalThought(fullName, birthDate)) },
    { key: "essence", label: "Essence number", value: essenceAt(fullName, birthDate, when), group: "cycle",
      how: "The name letter active at your present age.", meaning: meaningOf(essenceAt(fullName, birthDate, when)), planet: planetOf(essenceAt(fullName, birthDate, when)) },
    { key: "pinnacle", label: "Pinnacle number (current)", value: py.pinnacles[1] ?? 0, group: "cycle",
      how: "The pinnacle governing your present life stage.", meaning: meaningOf(py.pinnacles[1] ?? 0), planet: planetOf(py.pinnacles[1] ?? 0) },
    { key: "personalYear", label: "Personal year", value: cycles?.personalYear ?? py.personalYear, group: "cycle",
      how: "Birth month plus birth day plus this calendar year.", meaning: cycles?.theme ?? "", planet: planetOf(cycles?.personalYear ?? 0) },
    { key: "personalMonth", label: "Personal month", value: cycles?.personalMonth ?? py.personalMonth, group: "cycle",
      how: "Personal year plus the present month.", meaning: meaningOf(cycles?.personalMonth ?? 0), planet: planetOf(cycles?.personalMonth ?? 0) },
    { key: "personalDay", label: "Personal day", value: cycles?.personalDay ?? py.personalDay, group: "cycle",
      how: "Personal month plus today's date.", meaning: meaningOf(cycles?.personalDay ?? 0), planet: planetOf(cycles?.personalDay ?? 0) },
    { key: "universalYear", label: "Universal year", value: uy, group: "cycle",
      how: "The calendar year reduced — the mood everyone shares.", meaning: meaningOf(uy), planet: planetOf(uy) },
    { key: "universalMonth", label: "Universal month", value: um, group: "cycle",
      how: "Universal year plus the present month.", meaning: meaningOf(um), planet: planetOf(um) },
    { key: "universalDay", label: "Universal day", value: ud, group: "cycle",
      how: "Universal month plus today's date.", meaning: meaningOf(ud), planet: planetOf(ud) },
  ];

  const byKey: Record<string, CoreNumber> = {};
  for (const r of rows) byKey[r.key] = r;

  return {
    numbers: rows,
    byKey,
    pinnacles: py.pinnacles,
    challenges: py.challenges,
    masters: py.masterNumbers,
    karmicDebts: py.karmicDebts,
  };
}
