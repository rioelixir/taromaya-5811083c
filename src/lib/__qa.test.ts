import { it } from "vitest";
import fs from "node:fs";
import { buildPdf } from "@/routes/reports";

it("builds every report", () => {
  const b = { name: "Test Seeker", date: "1990-01-15", time: "10:30", tz: "5.5", lat: "28.6139", lon: "77.2090", place: "New Delhi" };
  for (const k of ["brihat", "varsha", "lalkitab", "numbers"] as const) {
    const pdf = buildPdf(k, b);
    fs.writeFileSync(`/tmp/qa/${k}.pdf`, Buffer.from(pdf.output("arraybuffer")));
  }
});
