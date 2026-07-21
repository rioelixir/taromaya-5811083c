import { describe, it } from "vitest";
import { computeWesternChart } from "./western";
describe("d", () => { it("p", () => {
  const c = computeWesternChart({year:1990,month:1,day:1,hour:12,minute:0,seconds:0,tzOffsetHours:0,latitude:51.5074,longitude:0},"placidus");
  console.log("ASC=",c.tropicalAscendant,"MC=",c.midheaven);
  c.cusps.forEach((v,i)=>console.log(`cusp${i+1}=${v.toFixed(4)}`));
})});
