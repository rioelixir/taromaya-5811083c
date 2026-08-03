import jsPDF from "jspdf";
import type { NameAnalysis } from "./engine";

const MARGIN = 46;
const GOLD: [number, number, number] = [176, 137, 60];
const INDIGO: [number, number, number] = [64, 64, 190];
const INK: [number, number, number] = [31, 41, 55];
const SOFT: [number, number, number] = [107, 114, 128];

/** Builds the professional name numerology report and downloads it. */
export function downloadNamePdf(a: NameAnalysis): void {
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
    nl(size + 26);
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

  const para = (
    text: string,
    opts: { bold?: boolean; size?: number; colour?: [number, number, number] } = {},
  ) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 10.5);
    doc.setTextColor(...(opts.colour ?? INK));
    const lines = doc.splitTextToSize(text, pageW - MARGIN * 2) as string[];
    for (const line of lines) {
      nl(15);
      doc.text(line, MARGIN, y);
      y += 14;
    }
  };

  const gap = (h = 10) => {
    y += h;
  };

  const rows = (items: { label: string; value: string }[]) => {
    for (const it of items) {
      nl(16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...SOFT);
      doc.text(it.label, MARGIN, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...INK);
      const lines = doc.splitTextToSize(it.value, pageW - MARGIN * 2 - 170) as string[];
      lines.forEach((line, i) => {
        if (i > 0) {
          y += 13;
          nl(14);
        }
        doc.text(line, MARGIN + 170, y);
      });
      y += 16;
    }
  };

  const bars = (items: { label: string; value: number }[]) => {
    for (const it of items) {
      nl(22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...INK);
      doc.text(it.label, MARGIN, y);
      doc.setTextColor(...SOFT);
      doc.text(`${it.value}`, pageW - MARGIN - 16, y);
      y += 5;
      const w = pageW - MARGIN * 2;
      doc.setFillColor(232, 232, 238);
      doc.roundedRect(MARGIN, y, w, 5, 2.5, 2.5, "F");
      doc.setFillColor(...INDIGO);
      doc.roundedRect(MARGIN, y, (w * it.value) / 100, 5, 2.5, 2.5, "F");
      y += 15;
    }
  };

  // ── Cover ─────────────────────────────────────────────────────────────────
  doc.setFillColor(250, 250, 252);
  doc.rect(0, 0, pageW, 210, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INDIGO);
  doc.text("NAME NUMEROLOGY REPORT", MARGIN, 74);
  doc.setFontSize(30);
  doc.setTextColor(...INK);
  doc.text(a.input.toUpperCase(), MARGIN, 116, { maxWidth: pageW - MARGIN * 2 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...SOFT);
  doc.text(
    `${a.system} system  ·  Compound ${a.compound}  ·  Name number ${a.root}  ·  ${a.planet.planet}  ·  Rating ${a.rating} of 100`,
    MARGIN,
    142,
    { maxWidth: pageW - MARGIN * 2 },
  );
  doc.text(`Prepared ${new Date().toISOString().slice(0, 10)}`, MARGIN, 162);
  y = 240;

  heading("1. Calculation");
  rows([
    { label: "Name analysed", value: a.input },
    { label: "System", value: a.system },
    ...a.steps.map((s) => ({ label: s.label, value: `${s.value} — ${s.note}` })),
  ]);
  gap();

  heading("2. Letter breakdown");
  para(
    a.letters.map((l) => `${l.letter} ${l.value} ${l.planet}`).join("   ·   "),
    { size: 10 },
  );
  gap();

  heading("3. Planet analysis");
  rows([
    { label: "Ruling planet", value: `${a.planet.planet} (number ${a.root})` },
    { label: "Nature", value: a.planet.nature },
    { label: "Strengths", value: a.planet.strengths.join(", ") },
    { label: "Weaknesses", value: a.planet.weaknesses.join(", ") },
    { label: "Leadership", value: a.planet.leadership },
    { label: "Communication", value: a.planet.communication },
    { label: "Money pattern", value: a.planet.money },
    { label: "Relationships", value: a.planet.relationships },
    { label: "Career style", value: a.planet.career },
    { label: "Learning style", value: a.planet.learning },
  ]);
  gap();

  heading("4. Personality analysis");
  for (const s of a.personality) {
    para(s.title, { bold: true, size: 11, colour: INK });
    para(s.body, { colour: INK });
    gap(6);
  }

  heading("5. Career suitability");
  bars(a.careers.slice(0, 12).map((c) => ({ label: c.field, value: c.score })));
  gap(4);
  for (const c of a.careers.slice(0, 5)) {
    para(`${c.field} — ${c.score} of 100`, { bold: true, size: 10.5 });
    para(`Reason: ${c.reason}`);
    para(`Strength: ${c.strength}`);
    para(`Challenge: ${c.challenge}`);
    gap(6);
  }

  heading("6. Relationships");
  bars(a.relationships.map((r) => ({ label: r.area, value: r.score })));
  gap();

  heading("7. Financial analysis");
  bars(a.finance.map((f) => ({ label: f.area, value: f.score })));
  gap();

  heading("8. Correction study");
  para(a.correction.balanced ? "This spelling is balanced. No change is advised." : "This spelling shows imbalance. The observations below explain why.", { bold: true });
  for (const w of a.correction.weakAreas) para(`· ${w}`);
  gap(4);
  para("Suggested additions", { bold: true });
  for (const s of a.correction.additions) para(`· ${s}`);
  para("Suggested removals", { bold: true });
  for (const s of a.correction.removals) para(`· ${s}`);
  if (a.correction.alternatives.length) {
    para("Alternative spellings", { bold: true });
    for (const alt of a.correction.alternatives)
      para(`· ${alt.spelling} — compound ${alt.compound}, number ${alt.root}, score ${alt.score}`);
  }
  para(`Confidence in this study: ${a.correction.confidence} of 100`, { bold: true });
  gap();

  heading("9. Lucky elements");
  rows(a.lucky.map((c) => ({ label: c.label, value: c.value })));
  gap();

  heading("10. Strength meters");
  bars(a.strengths.map((s) => ({ label: s.key, value: s.value })));
  gap();

  heading("11. Summary");
  rows([
    { label: "Overall rating", value: `${a.summary.rating} of 100 (${a.luckLevel})` },
    { label: "Planet", value: a.summary.planet },
    { label: "Best strength", value: a.summary.bestStrength },
    { label: "Main challenge", value: a.summary.mainChallenge },
    { label: "Most suitable career", value: a.summary.career },
    { label: "Relationship nature", value: a.summary.relationship },
    { label: "Financial potential", value: a.summary.finance },
    { label: "Life advice", value: a.summary.advice },
    { label: "Affirmation", value: a.summary.affirmation },
  ]);

  const safe = a.input.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "report";
  doc.save(`name-numerology-${safe}.pdf`);
}
