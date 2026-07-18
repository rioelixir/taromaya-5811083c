import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import jsPDF from "jspdf";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli, RASHIS, NAKSHATRAS, formatDegree } from "@/lib/vedic";
import { computeVimshottari, detectYogas, detectDoshas, fmtDate } from "@/lib/vedic-extended";
import { computeAshtakavarga } from "@/lib/vedic-deep";
import { computeVedicTransits, computeSadeSati } from "@/lib/vedic-transits";
import { computeNumerology } from "@/lib/numerology";
import { loShuGrid } from "@/lib/numerology-deep";
import { REMEDY_CATALOG, prioritiseRemedies } from "@/lib/remedies";
import { findStations, findIngresses, findEclipses, fmtDay } from "@/lib/transits-timeline";
import { FileText, Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reports")({
  component: () => (<PremiumGate featureName="Reports"><ReportsPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Premium Reports — TAROMAYA" },
      { name: "description", content: "Luxury downloadable PDF reports — Life, Career, Love, Wealth, and Yearly — with vector charts, dashas, transits, and remedies." },
    ],
  }),
});

type ReportKey = "grand" | "life" | "career" | "love" | "wealth" | "yearly" | "remedy";

const REPORT_META: Record<ReportKey, { title: string; desc: string; sections: string[] }> = {
  grand:   { title: "Grand Cosmic Blueprint", desc: "The complete dossier — Vedic + Western + Numerology + live transits.", sections: ["Rashi Chart","Planet & House Tables","Vimshottari (live)","Ashtakavarga","Live Gochara & Sade Sati","Yogas & Doshas","Numerology + Lo Shu","12-Month Transits","Remedies"] },
  life:    { title: "Life Blueprint",   desc: "A complete portrait of who you are and why you're here.", sections: ["Rashi Chart","Planet Table","Vimshottari Dasha","Ashtakavarga","Yogas & Doshas","Lo Shu Grid","Guiding Themes"] },
  career:  { title: "Career Compass",   desc: "Your work, calling, and how to move.", sections: ["Rashi Chart","10th House & Sun","Destiny Number","Dasha Windows","Live Transits","Action Plan"] },
  love:    { title: "Love & Union",     desc: "The heart's chart — attraction, patterns, partnership.", sections: ["Rashi Chart","7th House & Venus","Soul Urge Number","Manglik Status","Guidance"] },
  wealth:  { title: "Wealth Portrait",  desc: "Money, resources, and the flow of abundance.", sections: ["Rashi Chart","2nd & 11th Houses","Sarvashtakavarga","Personal Year","Lo Shu Grid","Wealth Rituals"] },
  yearly:  { title: "Yearly Forecast",  desc: "The 12 months ahead, in prose and precise dates.", sections: ["Rashi Chart","Personal Year","Ingresses","Retrogrades & Eclipses","Live Gochara","Monthly Themes"] },
  remedy:  { title: "Remedy Dossier",   desc: "The classical toolkit for your afflicted grahas.", sections: ["Rashi Chart","Priority Planets","Mantras","Gemstones","Charity & Fasting"] },
};

function todayIso() { return new Date().toISOString().slice(0, 10); }

function ReportsPage() {
  const [birth, setBirth] = useState({
    name: "Seeker", date: "1990-01-15", time: "10:30", tz: "5.5",
    lat: "28.6139", lon: "77.2090", place: "New Delhi",
  });
  const [downloading, setDownloading] = useState<ReportKey | null>(null);

  const generate = async (key: ReportKey) => {
    setDownloading(key);
    try {
      await new Promise(r => setTimeout(r, 30));
      const pdf = buildPdf(key, birth);
      pdf.save(`TAROMAYA-${REPORT_META[key].title.replace(/\s+/g, "_")}-${todayIso()}.pdf`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <PageShell
      eyebrow="Premium Reports"
      title="Downloadable PDF reports"
      subtitle="Luxury dossiers with vector rashi charts, dashas, transits, and remedies — computed live from your birth data."
    >
      <GlassCard title="Your details">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name" value={birth.name} onChange={(v) => setBirth({...birth, name: v})} />
          <Field label="Date" type="date" value={birth.date} onChange={(v) => setBirth({...birth, date: v})} />
          <Field label="Time" type="time" value={birth.time} onChange={(v) => setBirth({...birth, time: v})} />
          <Field label="TZ (h east of UTC)" value={birth.tz} onChange={(v) => setBirth({...birth, tz: v})} />
          <Field label="Latitude" value={birth.lat} onChange={(v) => setBirth({...birth, lat: v})} />
          <Field label="Longitude" value={birth.lon} onChange={(v) => setBirth({...birth, lon: v})} />
          <Field label="Place" value={birth.place} onChange={(v) => setBirth({...birth, place: v})} />
        </div>
      </GlassCard>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(REPORT_META) as ReportKey[]).map((k) => {
          const m = REPORT_META[k];
          const busy = downloading === k;
          return (
            <div key={k} className="glass rounded-3xl p-6 flex flex-col">
              <div className="flex items-start justify-between">
                <FileText className="h-5 w-5 text-gold" />
                <span className="text-[10px] uppercase tracking-widest text-gold/70">PDF</span>
              </div>
              <div className="mt-4 font-display text-xl text-pearl">{m.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{m.desc}</div>
              <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                {m.sections.map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-gold/70" /> {s}
                  </li>
                ))}
              </ul>
              <button
                disabled={busy}
                onClick={() => generate(k)}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium py-2.5 hover:brightness-110 disabled:opacity-60"
              >
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparing…</> : <><Download className="h-4 w-4" /> Download PDF</>}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-xs text-muted-foreground">
        Reports render locally in your browser — nothing about your birth chart is uploaded during PDF generation.
      </div>
    </PageShell>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="text-xs uppercase tracking-widest text-muted-foreground">
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-pearl" />
    </label>
  );
}

/* ================= PDF renderer ================= */

type Birth = { name: string; date: string; time: string; tz: string; lat: string; lon: string; place: string };

// Palette (midnight + gold)
const BG:      [number, number, number] = [12, 13, 28];
const CARD:    [number, number, number] = [17, 19, 38];
const GOLD:    [number, number, number] = [212, 175, 55];
const GOLD_SOFT: [number, number, number] = [235, 210, 130];
const PEARL:   [number, number, number] = [240, 235, 220];
const MUTED:   [number, number, number] = [160, 155, 140];
const LINE:    [number, number, number] = [70, 65, 90];

function buildPdf(key: ReportKey, b: Birth) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  const margin = 48;
  const meta = REPORT_META[key];

  const [Y, M, D] = b.date.split("-").map(Number);
  const [hh, mm] = b.time.split(":").map(Number);
  const chart = computeKundli({
    year: Y, month: M, day: D, hour: hh, minute: mm,
    tzOffsetHours: Number(b.tz), latitude: Number(b.lat), longitude: Number(b.lon),
  });
  const num = computeNumerology({ fullName: b.name, birthDate: b.date });
  const priorities = prioritiseRemedies(chart);
  const yogas = detectYogas(chart);
  const doshas = detectDoshas(chart);

  const moon = chart.planets.find(p => p.name === "Moon")!;
  const NAK_SPAN = 360 / 27;
  const moonDegInNak = moon.longitude - chart.moonNakshatra.index * NAK_SPAN;
  const birthDate = new Date(Date.UTC(Y, (M - 1), D, hh - Number(b.tz), mm));
  const dasha = computeVimshottari(birthDate, chart.moonNakshatra.index, moonDegInNak);

  // ---------- cursor state ----------
  let y = margin;
  const setBG = () => { pdf.setFillColor(...BG); pdf.rect(0, 0, w, h, "F"); };
  const newPage = () => {
    pdf.addPage();
    setBG();
    // running header
    pdf.setTextColor(...GOLD);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("TAROMAYA", margin, 30, { charSpace: 3 });
    pdf.text(meta.title.toUpperCase(), w - margin, 30, { align: "right", charSpace: 3 });
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.3);
    pdf.line(margin, 40, w - margin, 40);
    y = 72;
  };
  const ensureRoom = (need = 60) => {
    if (y > h - need) newPage();
  };

  const drawH = (label: string) => {
    ensureRoom(80);
    pdf.setTextColor(...GOLD);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(label.toUpperCase(), margin, y, { charSpace: 3 });
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y + 5, margin + 72, y + 5);
    y += 28;
  };
  const drawSub = (label: string) => {
    ensureRoom(40);
    pdf.setTextColor(...GOLD_SOFT);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(label.toUpperCase(), margin, y, { charSpace: 2 });
    y += 16;
  };
  const drawP = (text: string, size = 10.5) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(230, 225, 210);
    const lines = pdf.splitTextToSize(text, w - margin * 2) as string[];
    for (const ln of lines) {
      ensureRoom(size + 12);
      pdf.text(ln, margin, y);
      y += size + 4;
    }
    y += 6;
  };
  const drawKV = (rows: [string, string][], keyWidth = 170) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    for (const [k, v] of rows) {
      ensureRoom(24);
      pdf.setTextColor(...MUTED);
      pdf.text(k, margin, y);
      pdf.setTextColor(...PEARL);
      const lines = pdf.splitTextToSize(v, w - margin * 2 - keyWidth) as string[];
      lines.forEach((ln, i) => {
        if (i > 0) { ensureRoom(20); y += 14; }
        pdf.text(ln, margin + keyWidth, y);
      });
      y += 16;
    }
    y += 6;
  };
  const drawTable = (headers: string[], rows: string[][], colWidths?: number[]) => {
    const totalW = w - margin * 2;
    const cols = colWidths ?? headers.map(() => totalW / headers.length);
    ensureRoom(30 + rows.length * 16);
    // header
    pdf.setFillColor(...CARD);
    pdf.rect(margin, y - 12, totalW, 22, "F");
    pdf.setTextColor(...GOLD);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    let x = margin + 8;
    headers.forEach((h, i) => { pdf.text(h.toUpperCase(), x, y + 2, { charSpace: 1 }); x += cols[i]; });
    y += 18;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    rows.forEach((r, idx) => {
      ensureRoom(20);
      if (idx % 2 === 0) {
        pdf.setFillColor(20, 22, 44);
        pdf.rect(margin, y - 10, totalW, 16, "F");
      }
      pdf.setTextColor(...PEARL);
      let cx = margin + 8;
      r.forEach((cell, ci) => {
        const cellLines = pdf.splitTextToSize(cell ?? "", cols[ci] - 12) as string[];
        pdf.text(cellLines[0] ?? "", cx, y + 2);
        cx += cols[ci];
      });
      y += 16;
    });
    y += 10;
  };

  // ============ COVER ============
  setBG();
  // gold ornamental hairlines
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.8);
  pdf.line(margin, 120, w - margin, 120);
  pdf.line(margin, h - 140, w - margin, h - 140);
  pdf.setLineWidth(0.3);
  pdf.line(margin, 128, w - margin, 128);
  pdf.line(margin, h - 148, w - margin, h - 148);

  pdf.setTextColor(...GOLD);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("TAROMAYA · COSMIC INTELLIGENCE", margin, 96, { charSpace: 4 });

  pdf.setTextColor(...PEARL);
  pdf.setFontSize(40);
  pdf.setFont("helvetica", "bold");
  pdf.text(meta.title, margin, 220);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.setTextColor(200, 195, 180);
  pdf.text(meta.desc, margin, 252, { maxWidth: w - margin * 2 });

  // ornament star
  drawStar(pdf, w - margin - 40, 190, 24);

  // Prepared for
  pdf.setTextColor(...GOLD);
  pdf.setFontSize(9);
  pdf.text("PREPARED FOR", margin, h - 200, { charSpace: 3 });
  pdf.setTextColor(...PEARL);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text(b.name, margin, h - 180);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(200, 195, 180);
  pdf.text(`${b.date}  ·  ${b.time}  ·  ${b.place}`, margin, h - 162);
  pdf.setTextColor(...MUTED);
  pdf.setFontSize(9);
  pdf.text(`Generated ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`, margin, h - 100);
  pdf.text("taromaya.app", w - margin, h - 100, { align: "right" });

  // ============ PAGE 2: Snapshot + Chart ============
  newPage();
  drawH("Birth Snapshot");
  drawKV([
    ["Name", b.name],
    ["Date & Time", `${b.date} · ${b.time} (UTC${Number(b.tz) >= 0 ? "+" : ""}${b.tz})`],
    ["Place", `${b.place}  (${b.lat}°, ${b.lon}°)`],
    ["Ayanamsa (Lahiri)", `${chart.ayanamsa.toFixed(4)}°`],
    ["Ascendant (Lagna)", `${RASHIS[chart.ascendant.rashi]} · ${formatDegree(chart.ascendant.degreeInRashi)}`],
    ["Moon Nakshatra", `${NAKSHATRAS[chart.moonNakshatra.index]} · pada ${chart.moonNakshatra.pada} · lord ${chart.moonNakshatra.lord}`],
    ["Life Path / Destiny / Soul", `${num.lifePath}  ·  ${num.destiny}  ·  ${num.soulUrge}`],
  ]);

  drawH("Rashi Chart · South Indian");
  const chartSize = Math.min(w - margin * 2, 320);
  const cx = (w - chartSize) / 2;
  ensureRoom(chartSize + 40);
  drawSouthIndianChart(pdf, cx, y, chartSize, chart);
  y += chartSize + 18;

  // ============ PAGE 3: Planet Table ============
  newPage();
  drawH("Planet Positions");
  const planetRows = chart.planets.map((p) => {
    const houseNumber = ((p.rashi - chart.ascendant.rashi + 12) % 12) + 1;
    return [
      p.name,
      RASHIS[p.rashi],
      formatDegree(p.degreeInRashi),
      `H${houseNumber}`,
      p.retrograde ? "R" : "—",
    ];
  });
  drawTable(
    ["Planet", "Sign", "Degree", "House", "Motion"],
    planetRows,
    [90, 120, 100, 60, 70],
  );

  // Houses table
  drawH("Bhava Chart (Whole-Sign)");
  const houseRows = chart.houses.map((rashiIdx, i) => {
    const occupants = chart.planets.filter(p => p.rashi === rashiIdx).map(p => p.name).join(", ");
    return [`H${i + 1}`, RASHIS[rashiIdx], occupants || "—"];
  });
  drawTable(["House", "Sign", "Planets"], houseRows, [80, 130, 240]);

  // ============ Vimshottari Dasha ============
  newPage();
  drawH("Vimshottari Dasha · Live Status");
  const cm = dasha.currentMaha, ca = dasha.currentAntar, cp = dasha.currentPratyantar;
  if (cm && ca) {
    drawKV([
      ["Current Mahadasha", `${cm.lord}   (${fmtDate(cm.start)} → ${fmtDate(cm.end)})`],
      ["Current Antardasha", `${ca.lord}   (${fmtDate(ca.start)} → ${fmtDate(ca.end)})`],
      ...(cp ? ([["Current Pratyantar", `${cp.lord}   (${fmtDate(cp.start)} → ${fmtDate(cp.end)})`]] as [string, string][]) : []),
    ]);
  }

  drawSub("Upcoming Mahadasha Sequence");
  const now = new Date();
  const upcoming = dasha.maha.filter(m => m.end > now).slice(0, 5);
  drawTable(
    ["Lord", "Start", "End", "Years"],
    upcoming.map(m => [
      m.lord, fmtDate(m.start), fmtDate(m.end),
      ((m.end.getTime() - m.start.getTime()) / (365.25 * 86400000)).toFixed(1),
    ]),
    [120, 130, 130, 70],
  );

  // Current antar breakdown
  if (cm) {
    drawSub(`${cm.lord} Mahadasha · Antardashas`);
    drawTable(
      ["Antar", "Start", "End"],
      cm.antar.slice(0, 9).map(a => [a.lord, fmtDate(a.start), fmtDate(a.end)]),
      [120, 170, 170],
    );
  }

  // ============ Yogas / Doshas ============
  const yogasPresent = yogas.filter(y => y.present);
  const doshasPresent = doshas.filter(d => d.present);
  if (yogasPresent.length || doshasPresent.length) {
    newPage();
    if (yogasPresent.length) {
      drawH("Yogas Detected");
      for (const yg of yogasPresent.slice(0, 10)) {
        drawSub(`${yg.name}  ·  ${yg.category}`);
        drawP(yg.detail ?? "");
      }
    }
    if (doshasPresent.length) {
      drawH("Doshas Flagged");
      for (const d of doshasPresent.slice(0, 8)) {
        drawSub(`${d.name}${d.severity ? "  ·  " + d.severity : ""}`);
        drawP(d.detail ?? "");
        if (d.remedy) drawP(`Remedy: ${d.remedy}`);
      }
    }
  }

  // ============ Ashtakavarga (Sarva bindus) ============
  if (key === "grand" || key === "life" || key === "wealth") {
    newPage();
    drawH("Ashtakavarga · Sarva Bindus");
    drawP("The Sarvashtakavarga totals combined-strength points per sign (max 337). Signs with 30+ bindus are areas of favor; below 25 need protection.");
    try {
      const av = computeAshtakavarga(chart);
      drawTable(
        ["Sign", "Bindus", "Notes"],
        av.sarva.map((v, i) => [RASHIS[i], String(v), v >= 30 ? "Strong" : v >= 25 ? "Balanced" : "Fragile"]),
        [140, 100, 230],
      );
      drawP(`Total: ${av.sarvaTotal} bindus.`);
    } catch { drawP("Ashtakavarga computation unavailable."); }
  }

  // ============ 12-month transits (yearly / life / career / grand) ============
  if (key === "yearly" || key === "life" || key === "career" || key === "grand") {
    newPage();
    const from = new Date();
    const to = new Date(from.getTime() + 365 * 86400000);
    drawH("12-Month Transit Highlights");
    drawSub("Retrograde Stations");
    const stations = findStations(from, to);
    if (stations.length) {
      drawTable(
        ["Planet", "Date", "Kind", "Sign"],
        stations.map(s => [s.planet, fmtDay(s.date), s.kind, s.sign]),
        [90, 130, 130, 130],
      );
    } else drawP("None in window.");

    drawSub("Sign Ingresses (outer planets)");
    const ing = findIngresses(from, to).filter(x => ["Mars","Jupiter","Saturn"].includes(x.planet));
    if (ing.length) {
      drawTable(
        ["Planet", "Date", "From → To"],
        ing.map(i => [i.planet, fmtDay(i.date), `${i.fromSign} → ${i.toSign}`]),
        [100, 150, 230],
      );
    } else drawP("None in window.");

    drawSub("Eclipses");
    const ec = findEclipses(from, to);
    if (ec.length) {
      drawTable(
        ["Date", "Kind", "Variety"],
        ec.map(e => [fmtDay(e.date), e.kind, e.variety]),
        [150, 100, 230],
      );
    } else drawP("None in window.");
  }

  // ============ Live Gochara + Sade Sati ============
  if (key === "yearly" || key === "grand" || key === "career") {
    try {
      newPage();
      drawH("Live Sky · Gochara from Moon");
      const report = computeVedicTransits(chart, Number(b.lat), Number(b.lon), null, new Date());
      const ss = computeSadeSati(moon.rashi, new Date());
      drawKV([
        ["Sade Sati", ss.active
          ? `ACTIVE — ${ss.phase} phase (${ss.intensity}) · ~${ss.yearsRemaining.toFixed(1)}y remaining`
          : "Not active"],
        ["Dasha-lord transits", report.dashaResonance.length
          ? report.dashaResonance.map(r => `${r.planet} · h${r.houseFromMoon}`).join(", ")
          : "None currently"],
      ]);
      drawSub("Transiting Grahas");
      drawTable(
        ["Planet", "Sign", "House(Moon)", "Verdict", "AV"],
        report.transits.map(t => [
          t.planet + (t.retrograde ? " (R)" : ""),
          RASHIS[t.transitRashi],
          `H${t.houseFromMoon}`,
          t.favorable ? (t.vedhaBy ? `Vedha by ${t.vedhaBy}` : "Favorable") : "Testing",
          String(t.bindus ?? "—"),
        ]),
        [90, 120, 90, 130, 50],
      );
    } catch { /* ignore */ }
  }

  // ============ Lo Shu Grid ============
  if (key === "grand" || key === "life" || key === "wealth") {
    try {
      newPage();
      drawH("Lo Shu · Birth Grid");
      drawP("The 3x3 Lo Shu grid maps your birthdate's numbers onto ancient Chinese magic-square positions. Missing numbers reveal karmic lessons; repeated numbers reveal strengths.");
      const grid = loShuGrid(b.date);
      const gx = (w - 220) / 2;
      const gy = y;
      drawLoShu(pdf, gx, gy, 220, grid);
      y += 260;
      if (grid.missing?.length) drawP(`Missing: ${grid.missing.join(", ")} — karmic focus areas.`);
      if (grid.strong?.length) drawP(`Repeated: ${grid.strong.map(n => `${n}×${grid.counts[n]}`).join(", ")} — natural strengths.`);
    } catch { /* ignore */ }
  }


  // ============ Report-specific interpretation ============
  newPage();
  drawH("Interpretation");

  if (key === "life") {
    drawSub("Guiding Themes");
    drawP(`Your Life Path ${num.lifePath} sets the meta-arc of this incarnation. Combined with a ${RASHIS[chart.ascendant.rashi]} Lagna and Moon in ${NAKSHATRAS[chart.moonNakshatra.index]}, you carry an unusual signature: rooted, yet drawn upward. The Dasha of ${cm?.lord ?? "—"} colours the current chapter — its themes are the doorway.`);
    drawP("The way in is patience. The way through is practice. The way forward is service.");
    drawSub("Priority Grahas");
    for (const p of priorities.slice(0, 3)) drawKV([[p.planet, p.reasons.join(" · ") || "Baseline focus for this life."]]);
  }

  if (key === "career") {
    drawSub("The 10th House & Sun");
    const sun = chart.planets.find(p => p.name === "Sun")!;
    drawP(`Your Sun sits in ${RASHIS[sun.rashi]} at ${formatDegree(sun.degreeInRashi)}, shaping the ambition profile. Your Destiny Number ${num.destiny} names the outer contribution — the work the world will remember you for. The current Mahadasha of ${cm?.lord ?? "—"} sets the tone of your professional weather for years to come.`);
    drawSub("Action Plan");
    drawP("• Choose one project that expresses your Destiny Number this quarter.\n• Track a weekly ritual on the day of your strongest planet.\n• Once a year, review with your chart, not your peers.");
  }

  if (key === "love") {
    drawSub("The 7th House & Venus");
    const venus = chart.planets.find(p => p.name === "Venus")!;
    drawP(`Venus sits in ${RASHIS[venus.rashi]} at ${formatDegree(venus.degreeInRashi)} — this is the tone of your love language. Your Soul Urge is ${num.soulUrge}: the private, unspoken longing that must be met.`);
    const manglik = doshas.find(d => /manglik|mangal/i.test(d.name));
    drawKV([["Manglik Status", manglik ? "Present — see remedies" : "Not detected"]]);
    drawSub("Guidance");
    drawP("Love wants a witness, not a fixer. Ask for what the Soul Urge wants; give what the 7th house offers.");
  }

  if (key === "wealth") {
    drawSub("Wealth Houses");
    const h2 = chart.houses[1], h11 = chart.houses[10];
    drawP(`Rashi of the 2nd from Lagna: ${RASHIS[h2]}. Rashi of the 11th: ${RASHIS[h11]}. Money follows attention placed on both — earning (2nd) and networks (11th).`);
    drawSub("Personal Year");
    drawP(`Your Personal Year is ${num.personalYear}. ${personalYearNote(num.personalYear)}`);
    drawSub("Wealth Rituals");
    drawP("• Friday evening — light a ghee lamp before Lakshmi.\n• Weekly — donate one item you have loved but no longer need.\n• Monthly — write your 3 top clients or supporters a gratitude note.");
  }

  if (key === "yearly") {
    drawSub("Personal Year Overview");
    drawP(`You are in Personal Year ${num.personalYear}. ${personalYearNote(num.personalYear)}`);
    drawSub("Monthly Themes");
    const monthRows: string[][] = [];
    for (let mo = 1; mo <= 12; mo++) {
      const pm = ((num.personalYear + mo - 1 - 1) % 9) + 1;
      monthRows.push([`Month ${mo}`, `PM ${pm}`, monthNote(pm)]);
    }
    drawTable(["Month", "Personal Month", "Theme"], monthRows, [100, 130, 250]);
  }

  if (key === "remedy") {
    drawSub("Priority Planets");
    for (const p of priorities.slice(0, 4)) drawKV([[p.planet, p.reasons.join(" · ") || "Universal upaya recommended."]]);
    for (const p of priorities.slice(0, 3)) {
      const r = REMEDY_CATALOG[p.planet];
      if (!r) continue;
      drawSub(`${p.planet}  ·  ${r.deity}`);
      drawKV([
        ["Beej Mantra", `${r.beejMantra}  (${r.beejCount.toLocaleString()}× · ${r.duration})`],
        ["Gemstone", `${r.gemstone.primary} · ${r.gemstone.metal} · ${r.gemstone.finger} finger`],
        ["Colour / Day", `${r.color} · ${r.day}`],
        ["Fast", r.fast],
        ["Charity", r.charity.join(", ")],
        ["Behaviour", r.behaviour.join("; ")],
      ]);
    }
  }

  // Footer on every content page
  const pages = pdf.getNumberOfPages();
  for (let i = 2; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...MUTED);
    pdf.text(`Page ${i - 1} of ${pages - 1}`, w - margin, h - 24, { align: "right" });
    pdf.text("TAROMAYA · taromaya.app", margin, h - 24);
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.3);
    pdf.line(margin, h - 36, w - margin, h - 36);
  }
  return pdf;
}

/* ---------- Vector rashi chart (South Indian) ---------- */

function drawSouthIndianChart(
  pdf: jsPDF, x: number, y: number, size: number,
  chart: ReturnType<typeof computeKundli>,
) {
  const cell = size / 4;

  // background card
  pdf.setFillColor(...CARD);
  pdf.rect(x, y, size, size, "F");
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.8);
  pdf.rect(x, y, size, size);

  // grid — outer 4x4, inner 2x2 hollow (South Indian style)
  pdf.setDrawColor(...LINE);
  pdf.setLineWidth(0.4);
  // vertical lines at 1 and 3 cells from left; horizontal at 1 and 3 from top
  pdf.line(x + cell,     y,           x + cell,     y + size);
  pdf.line(x + 3 * cell, y,           x + 3 * cell, y + size);
  pdf.line(x,            y + cell,    x + size,     y + cell);
  pdf.line(x,            y + 3 * cell,x + size,     y + 3 * cell);

  // South Indian: sign positions are FIXED (Pisces top-left, Aries top-second, clockwise)
  // Layout of 12 signs on 4x4 border (row, col) with 0-index:
  // row0: Pisces(11) Aries(0) Taurus(1) Gemini(2)
  // row1: Aquarius(10)                     Cancer(3)
  // row2: Capricorn(9)                     Leo(4)
  // row3: Sagittarius(8) Scorpio(7) Libra(6) Virgo(5)
  const signCells: Record<number, [number, number]> = {
    11: [0, 0], 0: [0, 1], 1: [0, 2], 2: [0, 3],
    10: [1, 0], 3: [1, 3],
    9:  [2, 0], 4: [2, 3],
    8:  [3, 0], 7: [3, 1], 6: [3, 2], 5: [3, 3],
  };

  const shortSign = ["Ar","Ta","Ge","Cn","Le","Vi","Li","Sc","Sg","Cp","Aq","Pi"];
  const shortPlanet: Record<string, string> = {
    Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me",
    Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
  };

  for (let sign = 0; sign < 12; sign++) {
    const [r, c] = signCells[sign];
    const cx = x + c * cell;
    const cy = y + r * cell;

    // sign label
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...MUTED);
    pdf.text(shortSign[sign], cx + 4, cy + 9);

    // Lagna marker
    if (sign === chart.ascendant.rashi) {
      pdf.setDrawColor(...GOLD);
      pdf.setLineWidth(0.8);
      // small "AS" corner mark
      pdf.setTextColor(...GOLD);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.text("As", cx + cell - 14, cy + 9);
      pdf.line(cx + 2, cy + 12, cx + 14, cy + 12);
    }

    // planets in this sign
    const occ = chart.planets.filter(p => p.rashi === sign);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...PEARL);
    occ.forEach((p, i) => {
      const px = cx + 4 + (i % 3) * (cell - 8) / 3;
      const py = cy + 22 + Math.floor(i / 3) * 11;
      const label = shortPlanet[p.name] ?? p.name.slice(0, 2);
      pdf.text(p.retrograde ? `${label}\u2094` : label, px, py);
    });
  }

  // caption
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...MUTED);
  pdf.text(`Lagna: ${RASHIS[chart.ascendant.rashi]}  ·  Moon: ${NAKSHATRAS[chart.moonNakshatra.index]}`, x + size / 2, y + size + 14, { align: "center" });
}

function drawStar(pdf: jsPDF, cx: number, cy: number, r: number) {
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.6);
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    pdf.line(x1, y1, x2, y2);
  }
}

function personalYearNote(n: number): string {
  const m: Record<number, string> = {
    1: "A seeding year — new identity, new starts.",
    2: "A partnership year — patience, cooperation, listening.",
    3: "A creative year — expression, joy, visibility.",
    4: "A foundation year — build, structure, discipline.",
    5: "A change year — travel, freedom, restlessness.",
    6: "A responsibility year — home, love, service.",
    7: "A retreat year — study, spirit, solitude.",
    8: "A power year — wealth, authority, results.",
    9: "A release year — completion, closure, generosity.",
  };
  return m[n] ?? "";
}
function monthNote(n: number): string {
  const m: Record<number, string> = {
    1: "Initiate.", 2: "Cooperate.", 3: "Express.", 4: "Ground.",
    5: "Change.", 6: "Serve.", 7: "Reflect.", 8: "Execute.", 9: "Release.",
  };
  return m[n] ?? "";
}
