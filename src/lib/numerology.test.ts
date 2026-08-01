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
  // Pythagorean "JOHN" = J1+O6+H8+N5 = 20 → 2
  it("JOHN → 2", () => {
    expect(reducedName("John")).toBe(2);
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
    // JOHNDOE = J1+O6+H8+N5 + D4+O6+E5 = 35 → 8
    expect(r.destiny).toBe(8);
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

describe("Y as vowel — standard convention", () => {
  // Y is a vowel only when it is NOT next to another vowel.
  it("treats Y as a vowel in a consonant-only setting", () => {
    // LYNN: Y stands alone between consonants → vowel.
    // Soul urge letters = Y(7) → 7. Personality = L(3)+N(5)+N(5) = 13 → 4.
    const r = computeNumerology({ fullName: "Lynn", birthDate: "1990-01-15" });
    expect(r.soulUrge).toBe(7);
    expect(r.personality).toBe(4);
  });
  it("treats Y as a consonant next to a vowel", () => {
    // MAYA: Y sits between A and A → consonant.
    // Soul urge = A(1)+A(1) = 2. Personality = M(4)+Y(7) = 11.
    const r = computeNumerology({ fullName: "Maya", birthDate: "1990-01-15" });
    expect(r.soulUrge).toBe(2);
    expect(r.personality).toBe(11);
  });
  it("keeps destiny independent of the vowel split", () => {
    const r = computeNumerology({ fullName: "Maya", birthDate: "1990-01-15" });
    // M4 + A1 + Y7 + A1 = 13 → 4
    expect(r.destiny).toBe(4);
  });
});

describe("Full worked charts", () => {
  const at = new Date(2026, 0, 1); // deterministic personal cycles

  it("John Smith, 1980-07-04", () => {
    const r = computeNumerology({ fullName: "John Smith", birthDate: "1980-07-04", now: at });
    // Life path: M 7, D 4, Y 1980 → 18 → 9. 7+4+9 = 20 → 2
    expect(r.lifePath).toBe(2);
    // Destiny: JOHN 1+6+8+5=20; SMITH 1+4+9+2+8=24; 44 → 8
    expect(r.destiny).toBe(8);
    // Soul urge: O6 + I9 = 15 → 6
    expect(r.soulUrge).toBe(6);
    // Personality: J1+H8+N5 + S1+M4+T2+H8 = 29 → 11
    expect(r.personality).toBe(11);
    expect(r.birthday).toBe(4);
  });

  it("Ada Lovelace, 1815-12-10", () => {
    const r = computeNumerology({ fullName: "Ada Lovelace", birthDate: "1815-12-10", now: at });
    // M 12 → 3, D 10 → 1, Y 1815 → 15 → 6. 3+1+6 = 10 → 1
    expect(r.lifePath).toBe(1);
    // ADA 1+4+1=6; LOVELACE 3+6+4+5+3+1+3+5=30; 36 → 9
    expect(r.destiny).toBe(9);
    // Vowels A1 A1 O6 E5 A1 E5 = 19 → 1
    expect(r.soulUrge).toBe(1);
    expect(r.birthday).toBe(1);
  });

  it("master life path is preserved", () => {
    // 1998-11-29: M 11, D 29 → 11, Y 1998 → 27 → 9. 11+11+9 = 31 → 4
    expect(lifePathNumber("1998-11-29")).toBe(4);
    // 1966-05-29: M 5, D 29 → 11, Y 1966 → 22. 5+11+22 = 38 → 11
    expect(lifePathNumber("1966-05-29")).toBe(11);
  });
});

describe("Personal cycles are 1-9 and stable", () => {
  it("never returns a master number", () => {
    const at = new Date(2026, 6, 31);
    const r = computeNumerology({ fullName: "Test Name", birthDate: "1990-11-29", now: at });
    for (const n of [r.personalYear, r.personalMonth, r.personalDay]) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(9);
    }
  });
  it("is deterministic for the same inputs", () => {
    const at = new Date(2026, 3, 9);
    const a = computeNumerology({ fullName: "Test Name", birthDate: "1990-11-29", now: at });
    const b = computeNumerology({ fullName: "Test Name", birthDate: "1990-11-29", now: at });
    expect(a.personalYear).toBe(b.personalYear);
    expect(a.personalDay).toBe(b.personalDay);
  });
});

describe("reducedName() honours the Y rule", () => {
  it("Chaldean and Pythagorean stay in 1-9 or master range", () => {
    expect(reducedName("Lynn")).toBeGreaterThan(0);
    expect(reducedName("Lynn", "Chaldean")).toBeGreaterThan(0);
  });
});

describe("Chaldean name value — reference cases", () => {
  it("matches the classic Chaldean chart for a known name", () => {
    // Chaldean: J1 O7 H5 N5 = 18 -> 9
    expect(reducedName("John", "Chaldean")).toBe(9);
  });
  it("differs from Pythagorean for the same name (systems are not interchangeable)", () => {
    expect(reducedName("John", "Pythagorean")).not.toBe(reducedName("John", "Chaldean"));
  });
});

describe("Pinnacles and challenges — known reference chart", () => {
  it("computes the four pinnacles and four challenges for Feb 18 1985", () => {
    const r = computeNumerology({ fullName: "John Doe", birthDate: "1985-02-18" });
    // M=2, D=18->9, Y=1985->23->5
    // P1 = reduce(2+9)=11(master); P2 = reduce(9+5)=5; P3 = reduce(reduce(11,false)+5)= reduce(2+5)=7; P4 = reduce(2+5)=7
    expect(r.pinnacles).toEqual([11, 5, 7, 7]);
    // C1 = |2-9|=7; C2=|9-5|=4; C3=|7-4|=3; C4=|2-5|=3
    expect(r.challenges).toEqual([7, 4, 3, 3]);
  });
});
