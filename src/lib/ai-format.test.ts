import { describe, expect, it } from "vitest";
import { PLAIN_ELI10_RULES, romanToArabicText, toPlainText } from "./ai-format";

describe("Roman numerals never reach the reader", () => {
  it("turns Roman numerals into plain numbers", () => {
    expect(romanToArabicText("House XII and IX, card XXI")).toBe("House 12 and 9, card 21");
    expect(romanToArabicText("Chapter IV, part VII")).toBe("Chapter 4, part 7");
    expect(romanToArabicText("I am II years in")).toBe("I am 2 years in");
  });

  it("leaves real words alone", () => {
    for (const word of ["MIX", "DID", "LIVID", "CIVIC", "MIXED", "DIVIDE", "VIVID"]) {
      expect(romanToArabicText(word)).toBe(word);
    }
  });

  it("cleans Roman numerals while stripping markdown", () => {
    expect(toPlainText("**Card XVI** means change")).toBe("Card 16 means change");
    expect(toPlainText("# House VIII\n- steady growth")).toBe("House 8\n• steady growth");
  });

  it("tells the model to avoid Roman numerals", () => {
    expect(PLAIN_ELI10_RULES).toMatch(/Roman numerals/);
  });
});
