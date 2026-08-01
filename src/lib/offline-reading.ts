import { meaningsIn, type Meaning } from "./offline-meanings";

/**
 * Writes a reading from facts the app already calculated, with no AI model.
 *
 * The call sites all send the same two things an AI would have received: a
 * short "who you are" note and a prompt full of computed facts. Here those
 * facts are turned into simple, kind English with no symbols.
 */

/** Stable number from a string, so the same reading reads the same way twice. */
function seed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = ((h ^ text.charCodeAt(i)) * 16777619) >>> 0;
  return h;
}

function pick<T>(list: T[], n: number): T {
  return list[n % list.length];
}

/** Facts worth repeating back, cleaned of symbols and labels. */
function factsFrom(prompt: string, limit = 8): string[] {
  const out: string[] = [];
  for (const raw of prompt.split(/\n|;/)) {
    let line = raw
      .replace(/^[-*•\s]+/, "")
      .replace(/[*_#`]+/g, "")
      .trim();
    if (!line || line.length < 6 || line.length > 160) continue;
    if (/^(question|write|reply|return|keep it|do not|never|use only|shape of|rules?)\b/i.test(line)) continue;
    if (/json|markdown|word[s]? ?limit|under \d+ words/i.test(line)) continue;
    line = line.replace(/\s+/g, " ").replace(/[.:;,]+$/, "");
    out.push(line);
    if (out.length >= limit) break;
  }
  return out;
}

const OPENERS = [
  "Here is the simple version.",
  "In plain words, here is what your chart is saying.",
  "Let us keep this easy to follow.",
  "Here is what stands out right now.",
];

const CLOSERS = [
  "Nothing here is fixed. Your choices still steer the ship.",
  "Take what helps and leave the rest. You know your life best.",
  "Small steady steps work better than one big jump.",
  "Come back to this in a week and see what has changed.",
];

const TOPIC_LINES: Array<{ test: RegExp; line: string }> = [
  { test: /transit|current sky|now/i, line: "This is about the sky today, not your whole life. It passes." },
  { test: /numerolog|life path|mulank|bhagyank|loshu|lo shu/i, line: "These are your birth numbers. They show habits, not fate." },
  { test: /compat|match|synastry|kundli match|guna/i, line: "Two charts always have easy parts and hard parts. Both are normal." },
  { test: /horoscope|day ahead|week/i, line: "Think of this as the weather for your mood, so you can dress for it." },
  { test: /progress|solar arc|varsh/i, line: "This is your slow inner growth, the part that changes over years." },
  { test: /nakshatra|star/i, line: "Your birth star adds flavour to everything else in the chart." },
  { test: /panchang|muhurat|timing|tithi/i, line: "This is about good and quiet times of the day for what you plan." },
  { test: /dasha|period/i, line: "A life period is like a season. It has its own jobs and its own gifts." },
];

export function offlineReading(input: { system?: string; prompt: string }): string {
  const prompt = input.prompt ?? "";
  const all = `${input.system ?? ""}\n${prompt}`;
  const n = seed(all);
  const facts = factsFrom(prompt);
  const meanings: Meaning[] = meaningsIn(all, 6);
  const topic = TOPIC_LINES.find((t) => t.test.test(all))?.line;

  const parts: string[] = [];

  parts.push(`🌟 The short answer\n${pick(OPENERS, n)}${topic ? ` ${topic}` : ""}`);

  if (facts.length) {
    parts.push(
      `🔍 What your chart shows\n${facts.map((f) => `• ${f}`).join("\n")}`,
    );
  }

  if (meanings.length) {
    parts.push(
      `🙂 What that means for you\n${meanings.map((m) => `• ${cap(m.is)}, so ${m.feels}.`).join("\n")}`,
    );
    parts.push(
      `✅ What to do\n${meanings.slice(0, 4).map((m) => `• ${cap(m.does)}.`).join("\n")}`,
    );
  } else {
    parts.push(
      "✅ What to do\n• Pick the one thing above that feels most true and act on it today.\n• Write down how it goes, so you can spot the pattern later.",
    );
  }

  parts.push(`💡 Remember\n${pick(CLOSERS, n >> 3)}`);

  return parts.join("\n\n");
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
