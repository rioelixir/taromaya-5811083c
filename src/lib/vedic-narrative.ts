/**
 * Professional consultation narratives for the deeper Vedic suite.
 *
 * Turns raw classical numbers — Shadbala rupas, Ashtakavarga bindus, divisional
 * chart placements and Vimshottari periods — into composed consultation prose
 * that explains WHY a conclusion applies, HOW it shows up in daily life and
 * WHEN it is active. Plain text only: no markdown symbols, no Roman numerals.
 */

import { RASHIS } from "./vedic";
import type { Ashtakavarga, ShadbalaRow } from "./vedic-deep";

const PLANET_THEMES: Record<string, string> = {
  Sun: "authority, recognition, health of the spine and the confidence to lead",
  Moon: "emotional steadiness, home life, the mother and the quality of rest",
  Mars: "drive, courage, property matters and the willingness to compete",
  Mercury: "communication, commerce, study, contracts and clear thinking",
  Jupiter: "guidance, wisdom, teachers, children, ethics and long-term growth",
  Venus: "relationships, comfort, artistry, money style and personal charm",
  Saturn: "discipline, structure, patience, career endurance and responsibility",
  Rahu: "ambition and unfamiliar territory",
  Ketu: "detachment and inherited skill",
};

const RUPA_ADVICE: Record<string, string> = {
  Sun: "take visible ownership of one responsibility rather than many quiet ones",
  Moon: "protect sleep and keep a settled routine at home",
  Mars: "channel energy into planned effort instead of reactive bursts",
  Mercury: "put agreements in writing and re-read them before signing",
  Jupiter: "seek one experienced advisor rather than many opinions",
  Venus: "invest in relationships and finances with steady, modest commitments",
  Saturn: "keep to schedules and finish what is already started before adding more",
  Rahu: "test ambitions in small steps",
  Ketu: "let go of what has already served its purpose",
};

function pct(ratio: number) {
  return `${Math.round(ratio * 100)} percent of the classical requirement`;
}

function theme(planet: string) {
  return PLANET_THEMES[planet] ?? "its natural areas of life";
}

/** Composed prose for a Shadbala table. */
export function shadbalaNarrative(rows: ShadbalaRow[]): string[] {
  if (!rows.length) return [];
  const sorted = [...rows].sort((a, b) => b.ratio - a.ratio);
  const top = sorted[0];
  const second = sorted[1];
  const weak = sorted[sorted.length - 1];
  const strongCount = rows.filter((r) => r.ratio >= 1).length;

  const out: string[] = [];

  out.push(
    `Shadbala measures each planet on six separate counts and compares the total with the strength the classical texts expect of it. In your chart ${strongCount} of the seven planets meet that standard, so the overall support in the chart is ${
      strongCount >= 5 ? "broad and dependable" : strongCount >= 3 ? "balanced, with clear strong and weak areas" : "concentrated in a few areas and needs conscious support elsewhere"
    }.`,
  );

  out.push(
    `${top.planet} is the strongest influence at ${top.total.toFixed(2)} rupas, which is ${pct(top.ratio)}. This matters because ${top.planet} governs ${theme(
      top.planet,
    )}. In practice these matters tend to move with less friction for you than they do for most people, decisions in this area age well, and other people naturally defer to you here.`,
  );

  if (second && second.ratio >= 1) {
    out.push(
      `${second.planet} follows closely at ${second.total.toFixed(2)} rupas. It reinforces ${theme(
        second.planet,
      )}, and results improve noticeably when you pair it with the ${top.planet} theme rather than treating the two separately.`,
    );
  }

  out.push(
    `${weak.planet} is the area that needs support, at ${weak.total.toFixed(2)} rupas against a requirement of ${weak.required.toFixed(
      2,
    )}. A shortfall here does not mean loss. It means ${theme(
      weak.planet,
    )} asks for deliberate effort instead of running on instinct, and results arrive later than expected rather than not at all. The practical remedy is behavioural before it is ritual: ${
      RUPA_ADVICE[weak.planet] ?? "give this area steady, scheduled attention"
    }.`,
  );

  out.push(
    `On timing, a strong planet gives its best results during its own Vimshottari period and while it transits favourable signs. A weak planet asks for caution in the same windows. Read this table together with your Dasha timeline before committing to a major decision.`,
  );

  return out;
}

/** Composed prose for the Bhinna and Sarva Ashtakavarga tables. */
export function ashtakavargaNarrative(av: Ashtakavarga): string[] {
  if (!av.sarva.length) return [];
  const idx = av.sarva.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const best = idx[0];
  const secondBest = idx[1];
  const worst = idx[idx.length - 1];
  const avg = av.sarvaTotal / 12;

  const out: string[] = [];

  out.push(
    `Ashtakavarga scores every sign of the zodiac by counting benefic points, called bindus, contributed by each planet. The combined Sarva total for your chart is ${av.sarvaTotal}, an average of ${avg.toFixed(
      1,
    )} points per sign. This is the map of where effort is rewarded and where it is absorbed.`,
  );

  out.push(
    `${RASHIS[best.i]} carries the highest support with ${best.v} points${
      secondBest ? `, followed by ${RASHIS[secondBest.i]} with ${secondBest.v}` : ""
    }. When a planet transits this sign, or when work concerns the house that this sign occupies in your chart, outcomes tend to come through with less resistance. These are the periods to launch, negotiate and ask.`,
  );

  out.push(
    `${RASHIS[worst.i]} is the thinnest area with ${worst.v} points. Transits through this sign usually feel slower and costlier in effort. This is not a warning against action, it is guidance on sequence: keep routine and maintenance work for these windows and hold new commitments for the stronger signs.`,
  );

  const richPlanet = [...av.bhinna].sort((a, b) => b.total - a.total)[0];
  if (richPlanet) {
    out.push(
      `Among the individual tables, ${richPlanet.planet} holds the largest personal score at ${richPlanet.total} points, which supports ${theme(
        richPlanet.planet,
      )} throughout life rather than only in one period.`,
    );
  }

  out.push(
    `As a working rule, signs at thirty points or more behave as gain positions, signs between twenty five and twenty nine are ordinary, and signs below twenty five ask for patience. Use the count as a filter on timing, never as a verdict on the outcome itself.`,
  );

  return out;
}

const VARGA_MEANING: Record<number, { area: string; why: string }> = {
  1: { area: "the whole life and the physical body", why: "it is the foundation every other chart is measured against" },
  2: { area: "wealth, resources and family support", why: "it shows how earnings are held rather than how they are made" },
  3: { area: "siblings, courage and initiative", why: "it reveals the support network you can call on under pressure" },
  7: { area: "children and creative continuation", why: "it describes what you bring into being and hand on" },
  9: { area: "marriage, dharma and the strength behind every promise", why: "a planet weak here rarely delivers what the main chart appears to promise" },
  10: { area: "career, standing and professional results", why: "it separates the work you enjoy from the work that actually builds reputation" },
  12: { area: "parents and inherited circumstances", why: "it explains the starting conditions you built on" },
  16: { area: "vehicles, comforts and material happiness", why: "it shows how possessions affect peace of mind" },
  20: { area: "spiritual practice and inner discipline", why: "it indicates which practice will actually hold your attention" },
  24: { area: "education, learning capacity and skill", why: "it shows how knowledge is absorbed and applied" },
  27: { area: "underlying strength and stamina", why: "it measures resilience rather than opportunity" },
  30: { area: "difficulties, stress and vulnerability", why: "it names where strain concentrates so it can be managed early" },
  40: { area: "maternal inheritance and auspicious support", why: "it traces support arriving through the mother's line" },
  45: { area: "paternal inheritance and character", why: "it traces support and expectation arriving through the father's line" },
  60: { area: "accumulated karma and the fine detail of results", why: "it is the final refinement classical astrology applies before giving a verdict" },
};

export function vargaNarrative(
  n: number,
  ascRashi: number,
  planets: Array<{ name: string; rashi: number; house: number }>,
): string[] {
  const meta = VARGA_MEANING[n];
  if (!meta) return [];
  const out: string[] = [];
  const label = n === 1 ? "The Rashi chart" : `The D${n} divisional chart`;

  out.push(
    `${label} is read for ${meta.area}. It is consulted because ${meta.why}. The rising sign here is ${RASHIS[ascRashi]}, which sets the tone for how these matters are approached.`,
  );

  const first = planets.filter((p) => p.house === 1).map((p) => p.name);
  const tenth = planets.filter((p) => p.house === 10).map((p) => p.name);
  const seventh = planets.filter((p) => p.house === 7).map((p) => p.name);

  if (first.length) {
    out.push(
      `${first.join(" and ")} occupy the first position of this chart, so ${theme(
        first[0],
      )} shapes your personal approach to ${meta.area} directly rather than through other people.`,
    );
  }
  if (tenth.length) {
    out.push(
      `${tenth.join(" and ")} sit in the tenth position, which is where visible results appear. Progress in ${meta.area} therefore tends to be public and measurable, and it responds to consistency more than to intensity.`,
    );
  }
  if (seventh.length) {
    out.push(
      `${seventh.join(" and ")} stand in the seventh position, so partnerships and agreements carry unusual weight in ${meta.area}. Choose counterparts carefully and keep terms explicit.`,
    );
  }
  if (!first.length && !tenth.length && !seventh.length) {
    out.push(
      `No planet occupies the leading positions of this chart, which usually means ${meta.area} develops quietly and steadily, guided by the ruler of ${RASHIS[ascRashi]} rather than by dramatic events.`,
    );
  }

  out.push(
    `Read this alongside the Rashi chart. A promise that appears in the main chart is confirmed when the same planet also holds a strong position here, and it stays largely theoretical when it does not.`,
  );

  return out;
}

/** Composed prose for the currently running Vimshottari periods. */
export function dashaNarrative(maha: string, antar: string, pratyantar: string, endsOn: Date): string[] {
  const out: string[] = [];
  out.push(
    `You are in the ${maha} major period, with ${antar} as the sub period and ${pratyantar} as the current sub sub period. The major period sets the decade long agenda, the sub period decides the events inside it, and the sub sub period explains the mood of the present weeks.`,
  );
  out.push(
    `Because ${maha} governs ${theme(maha)}, this is the chapter of life in which those matters take priority whether or not you choose them. ${antar} governs ${theme(
      antar,
    )}, and it decides the form the chapter takes: expect the ${maha} agenda to arrive through ${theme(antar)}.`,
  );
  out.push(
    `The present sub period runs until ${endsOn.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}. Decisions made inside a period tend to carry its character, so time significant commitments to a sub period whose lord is well placed in your chart and well supported in Shadbala.`,
  );
  return out;
}
