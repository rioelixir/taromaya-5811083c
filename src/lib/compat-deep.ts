// Deep compatibility extras beyond the 36-point Ashtakoot:
// Nadi dosha exceptions, Manglik cancellation refinements,
// Mahendra / Vedha / Rajju / Stree-Dirgha yogas, and Papasamya (papa dosha balance).
import type { KundliChart } from "./vedic";

// ---- Nakshatra pada tables (indices 0..26) ----
const NAK_LORD = [
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
];

// Vedha nakshatra pairs (mutual obstruction) — classical list.
const VEDHA_PAIRS: [number, number][] = [
  [0,17],[1,16],[2,15],[3,14],[4,13],[5,12],[6,11],[7,10],[8,9],
  [18,26],[19,25],[20,24],[21,23],
];

// Rajju classification by nakshatra: 0=Pada(feet),1=Katti(waist),2=Nabhi(navel),3=Kantha(throat),4=Shira(head)
const RAJJU_BY_NAK = [
  0,1,2,3,4,3,2,1,0, 0,1,2,3,4,3,2,1,0, 0,1,2,3,4,3,2,1,0,
];
const RAJJU_NAMES = ["Pada","Katti","Nabhi","Kantha","Shira"];

// Aroha (ascending 0..8) / Avaroha (descending 9..17) / Sama (equal 18..26)
function rajjuFlow(nakIdx: number): "Aroha" | "Avaroha" | "Sama" {
  if (nakIdx < 9) return "Aroha";
  if (nakIdx < 18) return "Avaroha";
  return "Sama";
}

// Stree-Dirgha: girl's nakshatra should be >= 9 nakshatras ahead of boy's for longevity of marriage.
export function streeDirgha(boyNak: number, girlNak: number) {
  const gap = ((girlNak - boyNak + 27) % 27);
  const ok = gap >= 9 && gap <= 18; // classical range 9..18 counted forward
  return { ok, gap, note: ok
    ? `Girl's nakshatra is ${gap} ahead of boy — Stree-Dirgha present (auspicious for longevity of marriage).`
    : `Gap ${gap} — Stree-Dirgha absent; classical texts consider this mildly weakening.` };
}

// Mahendra: count from boy's janma nakshatra to girl's — 4, 7, 10, 13, 16, 19, 22, 25 gives Mahendra yoga (progeny, wealth).
export function mahendra(boyNak: number, girlNak: number) {
  const count = ((girlNak - boyNak + 27) % 27) + 1; // 1-indexed classical count
  const ok = [4,7,10,13,16,19,22,25].includes(count);
  return { ok, count, note: ok
    ? `Count ${count} from boy's nakshatra — Mahendra yoga present (progeny & prosperity).`
    : `Count ${count} — Mahendra yoga absent.` };
}

// Vedha: mutual obstruction — inauspicious if boy & girl nakshatras form a vedha pair.
export function vedhaDosha(boyNak: number, girlNak: number) {
  const hit = VEDHA_PAIRS.some(([a,b]) =>
    (a === boyNak && b === girlNak) || (b === boyNak && a === girlNak));
  return { present: hit, note: hit
    ? "Vedha dosha — mutual obstruction between janma nakshatras. Remedies advised."
    : "No Vedha dosha between janma nakshatras." };
}

// Rajju: dangerous if both fall in the same Rajju part with the same flow.
// Shira Rajju = danger to husband, Kantha = obstacles, Nabhi = progeny loss,
// Katti = poverty, Pada = wandering. Same-flow same-Rajju is the classical dosha.
export function rajjuDosha(boyNak: number, girlNak: number) {
  const bR = RAJJU_BY_NAK[boyNak], gR = RAJJU_BY_NAK[girlNak];
  const bF = rajjuFlow(boyNak), gF = rajjuFlow(girlNak);
  const same = bR === gR && bF === gF;
  const severity: Record<string, string> = {
    Shira: "severe — affects husband's life",
    Kantha: "moderate — struggles & obstacles",
    Nabhi: "moderate — progeny concerns",
    Katti: "mild — financial constraints",
    Pada: "mild — restlessness & travel",
  };
  return {
    present: same,
    part: RAJJU_NAMES[bR],
    girlPart: RAJJU_NAMES[gR],
    flow: { boy: bF, girl: gF },
    note: same
      ? `Rajju dosha in ${RAJJU_NAMES[bR]} (${severity[RAJJU_NAMES[bR]]}).`
      : `No Rajju dosha — different parts or flows (${RAJJU_NAMES[bR]}/${bF} vs ${RAJJU_NAMES[gR]}/${gF}).`,
  };
}

// Nadi dosha exceptions (classical parihara):
//  1. Same nakshatra but different pada (rare — needs pada info; here we approximate by pada from longitude).
//  2. Same nakshatra name (all 4 padas same) but different rashi (impossible → skip).
//  3. Boy & girl nakshatra lord is same planet — annuls nadi dosha.
//  4. If moon rashi is same but janma nakshatra differs — dosha weakened.
export function nadiDoshaAnalysis(boy: KundliChart, girl: KundliChart) {
  const bNak = boy.moonNakshatra.index, gNak = girl.moonNakshatra.index;
  const bMoon = boy.planets[1].rashi, gMoon = girl.planets[1].rashi;
  const bLord = NAK_LORD[bNak], gLord = NAK_LORD[gNak];
  const bPada = boy.moonNakshatra.pada, gPada = girl.moonNakshatra.pada;

  const nadiEq = (bNak % 3) === (gNak % 3); // approximation of nadi group equality
  if (!nadiEq) return { doshaPresent: false, cancelled: false, notes: ["No Nadi dosha — different nadi groups."] };

  const notes: string[] = ["Nadi dosha present — same nadi group."];
  let cancelled = false;

  if (bNak === gNak && bPada !== gPada) {
    cancelled = true;
    notes.push("Parihara: same nakshatra but different pada — Nadi dosha annulled.");
  }
  if (bLord === gLord && bNak !== gNak) {
    cancelled = true;
    notes.push(`Parihara: shared nakshatra lord (${bLord}) — Nadi dosha annulled.`);
  }
  if (bMoon === gMoon && bNak !== gNak) {
    notes.push("Weakening: shared Moon rashi but different nakshatra — dosha reduced in intensity.");
  }
  return { doshaPresent: true, cancelled, notes };
}

// Manglik cancellation refinements beyond "both Manglik".
// Common classical parihara: Mars/Saturn in the same house as the other's Mars,
// benefic aspect on Mars, or Mars in own/exalted sign.
export function manglikCancellation(boy: KundliChart, girl: KundliChart) {
  const bMars = boy.planets[2], gMars = girl.planets[2];
  const bMarsHouse = ((bMars.rashi - boy.ascendant.rashi + 12) % 12) + 1;
  const gMarsHouse = ((gMars.rashi - girl.ascendant.rashi + 12) % 12) + 1;
  const boyM = [1,2,4,7,8,12].includes(bMarsHouse);
  const girlM = [1,2,4,7,8,12].includes(gMarsHouse);
  const reasons: string[] = [];
  // Both manglik
  if (boyM && girlM) reasons.push("Both are Manglik — mutual cancellation (classical rule).");
  // Mars in own sign (Aries=0 / Scorpio=7) or exaltation (Capricorn=9)
  if (boyM && [0,7,9].includes(bMars.rashi)) reasons.push("Boy's Mars in own/exalted sign — dosha diluted.");
  if (girlM && [0,7,9].includes(gMars.rashi)) reasons.push("Girl's Mars in own/exalted sign — dosha diluted.");
  // Saturn in same house as Mars in the other chart
  const bSatHouse = ((boy.planets[6].rashi - boy.ascendant.rashi + 12) % 12) + 1;
  const gSatHouse = ((girl.planets[6].rashi - girl.ascendant.rashi + 12) % 12) + 1;
  if (boyM && bSatHouse === bMarsHouse) reasons.push("Saturn with Mars in boy's chart — dosha softened.");
  if (girlM && gSatHouse === gMarsHouse) reasons.push("Saturn with Mars in girl's chart — dosha softened.");

  const cancelled = reasons.length > 0 && (boyM || girlM);
  return { boyM, girlM, cancelled, reasons };
}

// Papasamya — count of malefics (Sun, Mars, Saturn, Rahu, Ketu) in Manglik-like houses 1,2,4,7,8,12.
// If both charts have similar papa-weight, the union is balanced.
const MALEFIC_IDX = [0, 2, 6, 7, 8]; // Sun, Mars, Saturn, Rahu, Ketu (in vedic planets order)
export function papasamya(boy: KundliChart, girl: KundliChart) {
  const weightFor = (c: KundliChart) => {
    let w = 0;
    for (const i of MALEFIC_IDX) {
      const h = ((c.planets[i].rashi - c.ascendant.rashi + 12) % 12) + 1;
      if ([1,2,4,7,8,12].includes(h)) w += 1;
    }
    return w;
  };
  const b = weightFor(boy), g = weightFor(girl);
  const diff = Math.abs(b - g);
  const balanced = diff <= 1;
  return { boy: b, girl: g, diff, balanced, note: balanced
    ? "Papasamya balanced — malefic burden is comparable across both charts."
    : `Papasamya imbalance (${b} vs ${g}) — the lighter chart may absorb the other's karmic weight.` };
}

export type DeepCompat = ReturnType<typeof deepCompat>;
export function deepCompat(boy: KundliChart, girl: KundliChart) {
  const bNak = boy.moonNakshatra.index, gNak = girl.moonNakshatra.index;
  return {
    streeDirgha: streeDirgha(bNak, gNak),
    mahendra: mahendra(bNak, gNak),
    vedha: vedhaDosha(bNak, gNak),
    rajju: rajjuDosha(bNak, gNak),
    nadi: nadiDoshaAnalysis(boy, girl),
    manglik: manglikCancellation(boy, girl),
    papasamya: papasamya(boy, girl),
  };
}
