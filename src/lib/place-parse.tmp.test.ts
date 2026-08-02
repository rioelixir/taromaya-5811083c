import { describe, it, expect } from "vitest";
import { parseSpokenDetails } from "@/lib/voice-parse";
describe("place", () => {
  it("plain in", () => {
    expect(parseSpokenDetails("My name is Ria, born 18 August 1995 at 4:35 in the evening in Mumbai")).toEqual({name:"Ria",date:"1995-08-18",time:"16:35",place:"Mumbai"});
  });
  it("cued", () => {
    expect(parseSpokenDetails("born in Delhi on 2 Jan 2001 at 7:10 am").place).toBe("Delhi");
  });
  it("no place words", () => {
    expect(parseSpokenDetails("How is my work going in the future?").place).toBeUndefined();
  });
});
