/**
 * Dream readings written by Taromaya itself, with no AI model.
 *
 * The dream text is scanned for well known symbols. Each symbol has a simple,
 * kind meaning, and the live sky adds today's mood on top.
 */

type Symbol = { test: RegExp; label: string; means: string; do: string };

const SYMBOLS: Symbol[] = [
  { test: /\bwater|sea|ocean|river|rain|flood|swim/i, label: "water", means: "water is feelings. A calm sea means calm inside, a rough one means feelings you have not let out yet", do: "name one feeling out loud today" },
  { test: /\bfall(ing)?|fell|cliff|drop/i, label: "falling", means: "falling shows you are afraid of losing control of something real in your life", do: "write down the one thing you feel is slipping, then pick one part of it you can hold" },
  { test: /\bfly(ing)?|flew|wings/i, label: "flying", means: "flying is freedom and a wish to rise above a heavy situation", do: "give yourself one hour this week that belongs only to you" },
  { test: /\bchase|chased|running|escape|hiding/i, label: "being chased", means: "something you keep avoiding is asking to be faced", do: "do the smallest part of the thing you keep putting off" },
  { test: /\bdeath|dead|dying|funeral|grave/i, label: "death", means: "in dreams death almost never means death. It means one chapter is finishing", do: "let go of one habit that belongs to the old chapter" },
  { test: /\bbaby|child|pregnan|birth/i, label: "a baby", means: "a new part of you, or a new plan, is growing and needs care", do: "protect your new idea from people who laugh at it" },
  { test: /\bsnake|serpent/i, label: "a snake", means: "a snake is change and healing energy, and sometimes a person you do not fully trust", do: "trust your gut about one person this week" },
  { test: /\bhouse|home|room|door|stairs/i, label: "a house", means: "a house is you. Rooms are parts of your mind, and a locked door is a part you have not opened", do: "tidy one small real corner of your home and notice how your mind feels" },
  { test: /\bexam|test|late|missed|train|bus|flight/i, label: "being late or tested", means: "you feel unprepared for something coming, even if you are more ready than you think", do: "make a short list, three lines only, of what actually needs doing" },
  { test: /\bfire|burn|smoke/i, label: "fire", means: "fire is anger and strong desire. It clears and it warms, but it needs a safe place", do: "move that energy through your body with a walk or a workout" },
  { test: /\bmoney|gold|coins|treasure|lost.*purse|wallet/i, label: "money", means: "money in dreams is worth, not rupees. It asks how much you value yourself", do: "say no to one thing that costs you more than it gives" },
  { test: /\bteeth|tooth/i, label: "teeth", means: "teeth show confidence and the words you say. Loose teeth means you feel unsure being heard", do: "speak one clear sentence you have been swallowing" },
  { test: /\bmother|father|family|parent/i, label: "family", means: "family in a dream points to old patterns you learned very young", do: "ask if the rule you are following is yours or someone else's" },
  { test: /\bex\b|lover|partner|marriage|wedding|kiss/i, label: "love", means: "a love scene is about what you want to feel, more than about that exact person", do: "give yourself the warmth you are waiting for from someone else" },
  { test: /\bdark|night|shadow|black/i, label: "darkness", means: "darkness is the part of you that is unknown, not the part that is bad", do: "sit quietly for five minutes without your phone" },
  { test: /\banimal|dog|cat|bird|horse|cow|elephant|lion|tiger/i, label: "an animal", means: "animals are instinct. They show the simple honest need you are ignoring", do: "eat, sleep and move like someone who likes you" },
  { test: /\bschool|class|teacher|office|boss|work/i, label: "school or work", means: "you are being judged in your mind, and the judge is usually you", do: "lower the bar to good enough for one task today" },
  { test: /\bmirror|face|photo/i, label: "a mirror", means: "you are looking at how you see yourself right now", do: "say one true kind thing about yourself" },
];

export type DreamContext = {
  moonSign: string;
  sunSign: string;
  moonPhase: string;
  illumination: number;
  retros: string;
};

const MOODS: Record<string, string> = {
  general: "This one touches your whole life, not only one corner of it.",
  relationships: "This dream is speaking mostly about closeness and trust.",
  career: "This dream is speaking mostly about work and being taken seriously.",
  spiritual: "This dream is speaking mostly about your inner life and quiet faith.",
  shadow: "This dream is showing you the part of yourself you usually hide.",
};

export function offlineDreamReading(input: {
  dream: string;
  mood?: string | null;
  focus?: keyof typeof MOODS | string;
  context: DreamContext;
}): string {
  const dream = input.dream.trim();
  const found = SYMBOLS.filter((s) => s.test.test(dream)).slice(0, 5);
  const focusLine = MOODS[String(input.focus ?? "general")] ?? MOODS.general;
  const c = input.context;

  const main = found[0];
  const parts: string[] = [];

  parts.push(
    `🌙 The biggest picture\n${
      main
        ? `The strongest symbol in your dream is ${main.label}. In simple words, ${main.means}.`
        : "Your dream does not use one loud symbol. That usually means it is simply your mind tidying up the day."
    } ${focusLine}`,
  );

  if (found.length > 1) {
    parts.push(
      `🔍 The other pieces\n${found
        .slice(1)
        .map((s) => `• ${cap(s.label)}: ${s.means}.`)
        .join("\n")}`,
    );
  }

  parts.push(
    `💗 How it felt\n${
      input.mood
        ? `You woke up feeling ${input.mood}. That feeling is the real message. The pictures were only the wrapping.`
        : "Notice the feeling you woke up with. That feeling matters more than the pictures."
    }`,
  );

  parts.push(
    `✨ Tonight's sky\n• The Moon sits in ${c.moonSign} and is ${c.moonPhase.toLowerCase()}, about ${Math.round(
      c.illumination * 100,
    )} out of 100 lit, so feelings run ${c.illumination > 0.6 ? "high and clear" : "quiet and inward"}.\n• The Sun is in ${c.sunSign}, which is where your daytime energy is going.\n• Planets moving backwards right now: ${c.retros}. Backwards means review, not disaster.`,
  );

  parts.push(
    `✅ One small thing to do\n${
      main ? cap(main.do) : "Write the dream down in three lines before you forget it"
    }.`,
  );

  parts.push("💡 Remember\nA dream is a message from you, to you. It never predicts a fixed future.");

  return parts.join("\n\n");
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
