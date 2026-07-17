// Chinese zodiac: animal × element (Heavenly Stems + Earthly Branches)
export const CHINESE_ANIMALS = [
  "Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig",
] as const;
export const CHINESE_ELEMENTS = ["Wood","Fire","Earth","Metal","Water"] as const;

export type ChineseSign = {
  animal: typeof CHINESE_ANIMALS[number];
  element: typeof CHINESE_ELEMENTS[number];
  year: number;
  yinYang: "Yang" | "Yin";
};

export function chineseSign(year: number): ChineseSign {
  const animal = CHINESE_ANIMALS[(year - 4) % 12 < 0 ? ((year - 4) % 12 + 12) % 12 : (year - 4) % 12];
  const stemIndex = ((year - 4) % 10 + 10) % 10;
  const element = CHINESE_ELEMENTS[Math.floor(stemIndex / 2)];
  const yinYang = stemIndex % 2 === 0 ? "Yang" : "Yin";
  return { animal, element, year, yinYang };
}

export const CHINESE_TRAITS: Record<typeof CHINESE_ANIMALS[number], string> = {
  Rat: "Clever, adaptable, resourceful. A quick, observant mind.",
  Ox: "Steady, dependable, methodical. Strength through patience.",
  Tiger: "Brave, magnetic, unpredictable. A natural leader.",
  Rabbit: "Gentle, artistic, diplomatic. Attracts elegance.",
  Dragon: "Charismatic, ambitious, larger-than-life.",
  Snake: "Intuitive, mysterious, wise. Deep inner knowing.",
  Horse: "Free-spirited, energetic, honest. Loves adventure.",
  Goat: "Sensitive, creative, kind. Craves harmony.",
  Monkey: "Witty, curious, inventive. Restless intelligence.",
  Rooster: "Confident, precise, hard-working. A perfectionist.",
  Dog: "Loyal, protective, sincere. A moral compass.",
  Pig: "Generous, sincere, comfort-loving. Enjoys abundance.",
};

export const CHINESE_COMPATIBLE: Record<typeof CHINESE_ANIMALS[number], typeof CHINESE_ANIMALS[number][]> = {
  Rat: ["Dragon", "Monkey", "Ox"],
  Ox: ["Snake", "Rooster", "Rat"],
  Tiger: ["Horse", "Dog", "Pig"],
  Rabbit: ["Goat", "Pig", "Dog"],
  Dragon: ["Rat", "Monkey", "Rooster"],
  Snake: ["Ox", "Rooster", "Monkey"],
  Horse: ["Tiger", "Goat", "Dog"],
  Goat: ["Rabbit", "Horse", "Pig"],
  Monkey: ["Rat", "Dragon", "Snake"],
  Rooster: ["Ox", "Snake", "Dragon"],
  Dog: ["Tiger", "Rabbit", "Horse"],
  Pig: ["Rabbit", "Goat", "Tiger"],
};
