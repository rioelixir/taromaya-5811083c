import { describe, expect, it } from "vitest";
import {
  computeNumerology,
  lifePathNumber,
  parseBirthDate,
  reduce,
  reducedName,
} from "./numerology";

describe("reduce()", () => {
  it("reduces to single digit", () => {
    expect(reduce(29)).toBe(11); // master preserved
    expect(reduce(29, false)).toBe(2);
    expect(reduce(1986)).toBe(6); // 1+9+8+6=24 → 6
    expect(reduce(0)).toBe(0);
  });
  it("preserves master numbers 11/22/33", () => {
    expect(reduce(11)).toBe(11);
    expect(reduce(22)).toBe(22);
    expect(reduce(33)).toBe(33);
  });
});

describe("parseBirthDate()", () => {
  it("accepts valid ISO dates", () => {
    expect(parseBirthDate("1990-01-15")).toEqual({ y: 1990, m: 1, d: 15 });
  });
  it("rejects impossible dates", () => {
    expect(parseBirthDate("2001-02-30")).toBeNull();
    expect(parseBirthDate("2001-13-01")).toBeNull();
    expect(parseBirthDate("bad")).toBeNull();
    expect(parseBirthDate("")).toBeNull();
  });
  it("rejects future dates", () => {
    expect(parseBirthDate("2999-12-31")).toBeNull();
  });
});

describe("lifePathNumber() — reference cases", () => {
  // Feb 18, 1985 → M=2, D=18→9, Y=1985→23→5. Sum 2+9+5 = 16 → 7
  it("Feb 18 1985 → 7", () => {
    expect(lifePathNumber("1985-02-18")).toBe(7);
  });
  // Jul 4, 1976 → M=7, D=4, Y=1976→23→5. 7+4+5=16 → 7
  it("Jul 4 1976 → 7", () => {
    expect(lifePathNumber("1976-07-04")).toBe(7);
  });
  // Dec 24, 1980 → M=12→3, D=24→6, Y=1980→18→9. 3+6+9=18 → 9
  it("Dec 24 1980 → 9", () => {
    expect(lifePathNumber("1980-12-24")).toBe(9);
  });
  // Master-preserving day: Nov 29 1970 → M=11 (master), D=29→11 (master),
  // Y=1970→17→8. 11+11+8=30 → 3.
  it("Nov 29 1970 → 3 (with master intermediates)", () => {
    expect(lifePathNumber("1970-11-29")).toBe(3);
  });
  // Master final: Feb 8 1974 → M=2, D=8, Y=1974→21→3. 2+8+3=13 → 4. Not master.
  it("Feb 8 1974 → 4", () => {
    expect(lifePathNumber("1974-02-08")).toBe(4);
  });
  // Master final example: Oct 4 1968 → M=1, D=4, Y=1968→24→6. 1+4+6=11 (master).
  it("Oct 4 1968 → 11 (master preserved at total)", () => {
    expect(lifePathNumber("1968-10-04")).toBe(11);
  });
});

describe("reducedName()", () => {
  // Pythagorean "JOHN" = 1+6+5+5 = 17 → 8
  it("JOHN → 8", () => {
    expect(reducedName("John")).toBe(8);
  });
  // "MARY" = 4+1+9+7 = 21 → 3
  it("MARY → 3", () => {
    expect(reducedName("Mary")).toBe(3);
  });
  // Diacritics normalise: "José" = "JOSE" = 1+6+1+5 = 13 → 4
  it("José → 4 (diacritic normalised)", () => {
    expect(reducedName("José")).toBe(4);
  });
});

describe("computeNumerology() — full report", () => {
  const r = computeNumerology({ fullName: "John Doe", birthDate: "1985-02-18" });
  it("life path 7", () => {
    expect(r.lifePath).toBe(7);
  });
  it("birthday reduces day-of-month", () => {
    expect(r.birthday).toBe(9); // 18 → 9
  });
  it("expression = reduced full-name letter sum", () => {
    // JOHNDOE = 1+6+5+5 + 4+6+5 = 32 → 5
    expect(r.destiny).toBe(5);
  });
  it("soul urge = vowels only", () => {
    // OOE = 6+6+5 = 17 → 8
    expect(r.soulUrge).toBe(8);
  });
  it("returns 0s for invalid dates without crashing", () => {
    const bad = computeNumerology({ fullName: "X", birthDate: "not-a-date" });
    expect(bad.lifePath).toBe(0);
    expect(bad.personalYear).toBe(0);
  });
});
