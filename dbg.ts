import { computeWesternChart } from "./src/lib/western";
const c = computeWesternChart({year:1990,month:1,day:1,hour:12,minute:0,seconds:0,tzOffsetHours:0,latitude:51.5074,longitude:0},"placidus");
console.log("Asc:", c.tropicalAscendant.toFixed(3), "MC:", c.midheaven.toFixed(3));
c.cusps.forEach((v,i)=>console.log(`c${i+1}=${v.toFixed(3)}`));
