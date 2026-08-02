import jsPDF from "jspdf";
import { GRID_LAYOUT, type Digit, type LoShuAnalysis } from "./types";
import { MISSING_PROFILES, NUMBER_PROFILES } from "./numbers";
import {
  careerAnalysis,
  financialAnalysis,
  healthObservations,
  luckyFactors,
  personalitySummary,
  relationshipAnalysis,
  remedies,
  type Section,
} from "./interpret";

const MARGIN = 46;
const GOLD: [number, number, number] = [176, 137, 60];
const INK: [number, number, number] = [32, 32, 38];
const SOFT: [number, number, number] = [110, 110, 122];

/** Builds the full professional Lo Shu report and triggers the download. */
export function downloadLoShuPdf(a: LoShuAnalysis): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = MARGIN;

  const nl = (h: number) => {
    if (y + h > pageH - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const heading = (text: string, size = 15) => {
    nl(size + 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...GOLD);
    doc.text(text, MARGIN, y);
    y += 6;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.7);
    doc.line(MARGIN, y, pageW - MARGIN, y);
    y += 16;
  };

  const para = (text: string, opts: { bold?: boolean; size?: number; colour?: [number, number, number] } = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 10.5);
    doc.setTextColor(...(opts.colour ?? INK));
    const lines = doc.splitTextToSize(text, pageW - MARGIN * 2);
    for (const line of lines) {
      nl(15);
      doc.text(line, MARGIN, y);
      y += 14;
    }
  };

  const sections = (items: Section[]) => {
    for (const s of items) {
      para(s.heading, { bold: true, size: 11 });
      para(s.body);
      y += 5;
    }
  };

  const bullets = (items: string[]) => {
    for (const item of items) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...INK);
      const lines = doc.splitTextToSize(item, pageW - MARGIN * 2 - 14);
      lines.forEach((line: string, i: number) => {
        nl(15);
        if (i === 0) {
          doc.setTextColor(...GOLD);
          doc.text("-", MARGIN, y);
          doc.setTextColor(...INK);
        }
        doc.text(line, MARGIN + 14, y);
        y += 14;
      });
    }
    y += 5;
  };

  // Cover page
  doc.setFillColor(250, 247, 240);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.4);
  doc.rect(MARGIN / 1.6, MARGIN / 1.6, pageW - MARGIN * 1.25, pageH - MARGIN * 1.25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...GOLD);
  doc.text("Lo Shu Grid Analysis", pageW / 2, pageH / 2 - 70, { align: "center" });
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(a.input.fullName, pageW / 2, pageH / 2 - 32, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...SOFT);
  doc.text(`Date of birth ${a.input.birthDate}`, pageW / 2, pageH / 2 - 10, { align: "center" });
  doc.text(
    `Day number ${a.birthNumber}   Life path ${a.lifePathNumber}   Energy score ${a.energyScore} of 100`,
    pageW / 2,
    pageH / 2 + 12,
    { align: "center" },
  );
  doc.text(`Prepared on ${new Date().toISOString().slice(0, 10)}`, pageW / 2, pageH - MARGIN - 10, {
    align: "center",
  });

  doc.addPage();
  y = MARGIN;

  heading("Your details");
  para(`Full name: ${a.input.fullName}`);
  para(`Date of birth: ${a.input.birthDate}`);
  if (a.input.gender) para(`Gender: ${a.input.gender}`);
  if (a.input.notes) para(`Notes: ${a.input.notes}`);
  para(`Digits used: ${a.digitsUsed.join(" ")} (zeros are ignored)`);
  y += 6;

  // Grid drawing
  heading("Lo Shu grid");
  const cell = 84;
  const gridX = MARGIN;
  nl(cell * 3 + 20);
  const gridTop = y;
  GRID_LAYOUT.forEach((row, r) => {
    row.forEach((digit, c) => {
      const x = gridX + c * cell;
      const yy = gridTop + r * cell;
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.6);
      doc.rect(x, yy, cell, cell);
      const count = a.counts[digit as Digit];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...SOFT);
      doc.text(String(digit), x + 6, yy + 12);
      if (count > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(count > 3 ? 15 : 19);
        doc.setTextColor(...INK);
        doc.text(String(digit).repeat(count), x + cell / 2, yy + cell / 2 + 8, { align: "center" });
      }
    });
  });
  y = gridTop + cell * 3 + 22;

  heading("Key figures");
  bullets([
    `Day or birth number: ${a.birthNumber}`,
    `Life path number: ${a.lifePathNumber}`,
    `Total digits counted: ${a.totalDigits}`,
    `Missing numbers: ${a.missing.length ? a.missing.join(", ") : "none"}`,
    `Repeated numbers: ${a.repeated.length ? a.repeated.map((d) => `${d} appears ${a.counts[d]} times`).join(", ") : "none"}`,
    `Strongest number: ${a.strongest}`,
    `Weakest present number: ${a.weakest}`,
    `Overall energy score: ${a.energyScore} of 100`,
  ]);

  heading("Energy zones");
  for (const z of a.zones) {
    para(`${z.label} — ${z.percent} percent`, { bold: true, size: 11 });
    para(z.interpretation);
    y += 4;
  }

  heading("Numbers present in your grid");
  for (const d of [1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]) {
    if (!a.counts[d]) continue;
    const p = NUMBER_PROFILES[d];
    para(`Number ${d} — ${p.title} (${p.planet}, ${p.element}) appears ${a.counts[d]} time${a.counts[d] > 1 ? "s" : ""}`, {
      bold: true,
      size: 11,
    });
    bullets([
      `Positive traits: ${p.positive.join(", ")}`,
      `Watch points: ${p.negative.join(", ")}`,
      `Career: ${p.career}`,
      `Leadership: ${p.leadership}`,
      `Relationships: ${p.relationships}`,
      `Marriage: ${p.marriage}`,
      `Communication: ${p.communication}`,
      `Finance: ${p.finance}`,
      `Health tendencies: ${p.health}`,
      `Spiritual lesson: ${p.spiritualLesson}`,
      `Improvement: ${p.tips.join("; ")}`,
    ]);
  }

  if (a.missing.length) {
    heading("Missing numbers");
    for (const d of a.missing) {
      const m = MISSING_PROFILES[d];
      para(`Number ${d} is missing`, { bold: true, size: 11 });
      bullets([
        `Meaning: ${m.meaning}`,
        `Weakness: ${m.weakness}`,
        `Personality impact: ${m.personality}`,
        `Career impact: ${m.careerImpact}`,
        `Relationship impact: ${m.relationshipImpact}`,
        `Financial impact: ${m.financialImpact}`,
        `Health tendencies: ${m.health}`,
        `Life lesson: ${m.lifeLesson}`,
        `Balancing advice: ${m.balancing}`,
        `Suggested remedies: ${m.remedies.join("; ")}`,
      ]);
    }
  }

  heading("Repeated numbers");
  bullets(a.repeats.map((r) => `Number ${r.digit} appears ${r.count} time${r.count > 1 ? "s" : ""} — ${r.label}. ${r.reading}`));

  heading("Arrows");
  for (const arrow of a.arrows) {
    para(`${arrow.name} (${arrow.line.join("-")}) — ${arrow.status === "formed" ? "present" : "not present"}`, {
      bold: true,
      size: 11,
    });
    bullets([
      `Meaning: ${arrow.meaning}`,
      `Strengths: ${arrow.strengths}`,
      `Weaknesses: ${arrow.weaknesses}`,
      `Career: ${arrow.career}`,
      `Relationships: ${arrow.relationships}`,
      `Money: ${arrow.money}`,
      `Health: ${arrow.health}`,
      `Advice: ${arrow.advice}`,
    ]);
  }

  heading("Personality summary");
  sections(personalitySummary(a));

  heading("Career analysis");
  bullets(
    careerAnalysis(a)
      .slice(0, 10)
      .map((c) => `${c.field}: ${c.detail}`),
  );

  heading("Relationship analysis");
  sections(relationshipAnalysis(a));

  heading("Financial analysis");
  sections(financialAnalysis(a));

  heading("Health and lifestyle observations");
  sections(healthObservations(a));

  const lucky = luckyFactors(a);
  heading("Lucky factors");
  bullets([
    `Lucky numbers: ${lucky.numbers.join(", ")}`,
    `Lucky colours: ${lucky.colours.join(", ")}`,
    `Lucky days: ${lucky.days.join(", ")}`,
    `Lucky directions: ${lucky.directions.join(", ")}`,
    `Lucky activities: ${lucky.activities.join("; ")}`,
    `Supportive habits: ${lucky.habits.join("; ")}`,
  ]);

  const rem = remedies(a);
  heading("Remedies");
  para("Lifestyle", { bold: true, size: 11 });
  bullets(rem.lifestyle);
  para("Colour", { bold: true, size: 11 });
  bullets(rem.colour);
  para("Meditation", { bold: true, size: 11 });
  bullets(rem.meditation);
  para("Affirmations", { bold: true, size: 11 });
  bullets(rem.affirmations);
  para("Breathing", { bold: true, size: 11 });
  bullets(rem.breathing);
  para("Charity", { bold: true, size: 11 });
  bullets(rem.charity);
  para("Nature", { bold: true, size: 11 });
  bullets(rem.nature);
  para("Daily habits", { bold: true, size: 11 });
  bullets(rem.daily);
  para("Weekly practices", { bold: true, size: 11 });
  bullets(rem.weekly);

  heading("Closing summary");
  para(
    `Your grid holds ${a.totalDigits} counted digits with ${9 - a.missing.length} of the nine numbers present, an overall energy score of ${a.energyScore} of 100, and number ${a.strongest} as the leading force. Work with the strengths listed above, treat the missing numbers as skills under construction, and review this report once a year.`,
  );
  para(
    "This report is prepared for reflection and self development. It offers lifestyle observations only and is not medical, legal or financial advice.",
    { colour: SOFT, size: 9.5 },
  );

  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...SOFT);
    doc.text(`Lo Shu Grid Analysis — ${a.input.fullName}`, MARGIN, pageH - 22);
    doc.text(`${i} of ${total}`, pageW - MARGIN, pageH - 22, { align: "right" });
  }

  const safe = a.input.fullName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "report";
  doc.save(`lo-shu-${safe}.pdf`);
}
