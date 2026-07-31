import { describe, expect, it } from "vitest";
import { toPlainText, romanToArabicText } from "@/lib/ai-format";
describe("roman", () => {
  it("converts", () => {
    expect(romanToArabicText("House XII and IX, card XXI")).toBe("House 12 and 9, card 21");
    expect(romanToArabicText("MIX DID a LIVID mix")).toBe("MIX DID a LIVID mix");
    expect(toPlainText("**Card XVI** means change")).toBe("Card 16 means change");
    expect(romanToArabicText("I am II years")).toBe("I am 2 years");
  });
});
