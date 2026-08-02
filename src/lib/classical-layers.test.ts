import { describe, it, expect } from "vitest";
import { computePanchang } from "@/lib/panchang";
import { chandramasa, samvatAndEpochs, rituAndAyana, dayMeasures, varjyamAndAmrit, raviYoga, extraMuhurtas, vasaAndShool, gowriPanchangam, ghattaChakra, nextSunriseAfter, taraBalam } from "@/lib/panchang-calendars";
import { computeKundli } from "@/lib/vedic";
import { compositeFriendship, ascendantReport, sudarshanaChakra, praharOfBirth } from "@/lib/kundli-classical";

describe("classical layers", () => {
  const p = computePanchang({ date: new Date(2026, 7, 2, 12), latitude: 28.6139, longitude: 77.209 });
  it("samvat", () => {
    const m = chandramasa(p.refMoment, p.tithi.paksha);
    const s = samvatAndEpochs(p.refMoment, m.amanta);
    expect(s.shaka).toBe(1948);
    expect(s.vikram).toBe(2083);
    expect(s.kaliyuga).toBe(5127);
    expect(s.julianDay).toBeGreaterThan(2461000);
    expect(rituAndAyana(p.refMoment, m.amanta).drikAyana).toBe("Dakshinayana");
    expect(["Varsha","Grishma","Sharad"]).toContain(rituAndAyana(p.refMoment, m.amanta).drikRitu);
  });
  it("timings", () => {
    const nr = nextSunriseAfter(p, 28.6139, 77.209);
    const dm = dayMeasures(p, nr);
    expect(dm.dinamana!.hours).toBeGreaterThan(11);
    const vj = varjyamAndAmrit(p.refMoment)!;
    expect(vj.varjyam[1].getTime()).toBeGreaterThan(vj.varjyam[0].getTime());
    expect(vj.amritKalam[0].getTime()).toBeGreaterThan(vj.varjyam[0].getTime());
    expect(raviYoga(p.refMoment).suryaPada).toBeGreaterThanOrEqual(1);
    expect(extraMuhurtas(p, nr).length).toBeGreaterThan(3);
    const g = gowriPanchangam(p, nr);
    expect(g.day).toHaveLength(8);
    expect(g.night).toHaveLength(8);
    expect(vasaAndShool(p).agnivasa).toBeTruthy();
    expect(ghattaChakra(3).vaar).toBeTruthy();
    expect(taraBalam(5, 5).name).toBe("Janma");
  });
  it("kundli classical", () => {
    const c = computeKundli({ year: 1995, month: 6, day: 15, hour: 7, minute: 45, tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.209 });
    const f = compositeFriendship(c);
    expect(f.planets).toHaveLength(7);
    expect(f.table["Sun"]["Moon"].natural).toBe("Friend");
    expect(f.table["Saturn"]["Sun"].natural).toBe("Enemy");
    const a = ascendantReport(c);
    expect(a.luckyStone).toBeTruthy();
    expect(a.planetaryLord).toBeTruthy();
    const s = sudarshanaChakra(c);
    expect(s.lagna.houses).toHaveLength(12);
    const pr = praharOfBirth(new Date(1995,5,15,7,45), new Date(1995,5,15,5,24), new Date(1995,5,15,19,20), null);
    expect(pr.partOfDay).toBe("day");
    expect(pr.index).toBe(1);
  });
});
