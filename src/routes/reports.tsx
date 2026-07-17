import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import jsPDF from "jspdf";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli } from "@/lib/vedic";
import { computeNumerology } from "@/lib/numerology";
import { REMEDY_CATALOG, prioritiseRemedies } from "@/lib/remedies";
import { FileText, Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reports")({
  component: () => (<PremiumGate featureName="Reports"><ReportsPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Premium Reports — TAROMAYA" },
      { name: "description", content: "Luxury downloadable PDF reports — Life, Career, Love, Wealth, and Yearly — combining Vedic, Western, and Numerology insight." },
    ],
  }),
});

type ReportKey = "life" | "career" | "love" | "wealth" | "yearly" | "remedy";

const REPORT_META: Record<ReportKey, { title: string; desc: string; sections: string[] }> = {
  life:    { title: "Life Blueprint",   desc: "A complete portrait of who you are and why you're here.", sections: ["Birth Snapshot","Lagna & Moon","Life Path Number","Priority Grahas","Guiding Themes"] },
  career:  { title: "Career Compass",   desc: "Your work, calling, and how to move.", sections: ["Birth Snapshot","10th House & Sun","Destiny Number","Strengths","Action Plan"] },
  love:    { title: "Love & Union",     desc: "The heart's chart — attraction, patterns, partnership.", sections: ["Birth Snapshot","7th House & Venus","Soul Urge Number","Manglik Status","Guidance"] },
  wealth:  { title: "Wealth Portrait",  desc: "Money, resources, and the flow of abundance.", sections: ["Birth Snapshot","2nd & 11th Houses","Personal Year","Dhana Yogas","Wealth Rituals"] },
  yearly:  { title: "Yearly Forecast",  desc: "The 12 months ahead, in prose.", sections: ["Birth Snapshot","Personal Year","Key Transits","Auspicious Windows","Monthly Themes"] },
  remedy:  { title: "Remedy Dossier",   desc: "The classical toolkit for your afflicted grahas.", sections: ["Birth Snapshot","Priority Planets","Mantras","Gemstones","Charity & Fasting"] },
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
      subtitle="Luxury dossiers with charts, remedies, and prose — computed live from your birth data."
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

/* ---------- PDF renderer ---------- */

type Birth = { name: string; date: string; time: string; tz: string; lat: string; lon: string; place: string };

function buildPdf(key: ReportKey, b: Birth) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  // Cover background — deep midnight rectangle
  pdf.setFillColor(9, 10, 24);
  pdf.rect(0, 0, w, h, "F");
  // Gold hairlines
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.6);
  pdf.line(margin, 120, w - margin, 120);
  pdf.line(margin, h - 120, w - margin, h - 120);

  pdf.setTextColor(212, 175, 55);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("TAROMAYA · COSMIC INTELLIGENCE", margin, 96, { charSpace: 3 });

  pdf.setTextColor(240, 235, 220);
  pdf.setFontSize(34);
  pdf.text(REPORT_META[key].title, margin, 200);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.setTextColor(180, 175, 160);
  pdf.text(REPORT_META[key].desc, margin, 232, { maxWidth: w - margin * 2 });

  pdf.setTextColor(240, 235, 220);
  pdf.setFontSize(11);
  pdf.text(`Prepared for  ${b.name}`, margin, h - 168);
  pdf.text(`${b.date}  ·  ${b.time}  ·  ${b.place}`, margin, h - 150);
  pdf.text(`Generated  ${new Date().toLocaleDateString()}`, margin, h - 132);

  // ---- Content pages ----
  pdf.addPage();
  y = margin;
  pdf.setFillColor(15, 16, 32);
  pdf.rect(0, 0, w, h, "F");
  pdf.setTextColor(212, 175, 55);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("TAROMAYA", margin, 30, { charSpace: 3 });
  pdf.text(REPORT_META[key].title.toUpperCase(), w - margin, 30, { align: "right", charSpace: 3 });

  const [Y, M, D] = b.date.split("-").map(Number);
  const [hh, mm] = b.time.split(":").map(Number);
  const chart = computeKundli({
    year: Y, month: M, day: D, hour: hh, minute: mm,
    tzOffsetHours: Number(b.tz), latitude: Number(b.lat), longitude: Number(b.lon),
  });
  const num = computeNumerology({ fullName: b.name, birthDate: b.date });
  const priorities = prioritiseRemedies(chart);

  const drawH = (label: string) => {
    if (y > h - 100) { pdf.addPage(); pdf.setFillColor(15, 16, 32); pdf.rect(0, 0, w, h, "F"); y = margin; }
    pdf.setTextColor(212, 175, 55);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(label.toUpperCase(), margin, y, { charSpace: 3 });
    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(0.4);
    pdf.line(margin, y + 4, margin + 60, y + 4);
    y += 26;
  };

  const drawP = (text: string, size = 11) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(230, 225, 210);
    const lines = pdf.splitTextToSize(text, w - margin * 2) as string[];
    for (const ln of lines) {
      if (y > h - 60) { pdf.addPage(); pdf.setFillColor(15, 16, 32); pdf.rect(0, 0, w, h, "F"); y = margin; }
      pdf.text(ln, margin, y);
      y += size + 4;
    }
    y += 6;
  };

  const drawKV = (rows: [string, string][]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    for (const [k, v] of rows) {
      if (y > h - 60) { pdf.addPage(); pdf.setFillColor(15, 16, 32); pdf.rect(0, 0, w, h, "F"); y = margin; }
      pdf.setTextColor(160, 155, 140);
      pdf.text(k, margin, y);
      pdf.setTextColor(240, 235, 220);
      pdf.text(v, margin + 160, y, { maxWidth: w - margin * 2 - 160 });
      y += 16;
    }
    y += 8;
  };

  y = 80;
  drawH("Birth Snapshot");
  drawKV([
    ["Name", b.name],
    ["Date & Time", `${b.date} · ${b.time}`],
    ["Place", `${b.place} (${b.lat}, ${b.lon})`],
    ["Ascendant (Lagna)", `${chart.ascendant.degreeInRashi.toFixed(2)}° in rashi ${chart.ascendant.rashi + 1}`],
    ["Moon Nakshatra", `${chart.moonNakshatra.index + 1} · pada ${chart.moonNakshatra.pada} · lord ${chart.moonNakshatra.lord}`],
    ["Life Path", String(num.lifePath)],
    ["Destiny", String(num.destiny)],
    ["Soul Urge", String(num.soulUrge)],
  ]);

  // Sections per report type
  if (key === "life") {
    drawH("Guiding Themes");
    drawP(`Your Life Path ${num.lifePath} sets the meta-arc of this lifetime. Combined with a ${labelRashi(chart.ascendant.rashi)} Lagna and a Moon in ${chart.moonNakshatra.index + 1}th nakshatra, you carry an unusual signature: rooted, yet drawn upward. This report follows that thread across body, mind, and destiny.`);
    drawP("The way in is patience. The way through is practice. The way forward is service.");
    drawH("Priority Grahas");
    for (const p of priorities.slice(0, 3)) {
      drawKV([[p.planet, p.reasons.join(" · ") || "Baseline focus for this life."]]);
    }
  }

  if (key === "career") {
    drawH("The 10th House & Sun");
    drawP(`Your Sun sits in rashi ${(chart.planets.find(p=>p.name==="Sun")?.rashi ?? 0) + 1}, shaping the ambition profile. Your Destiny Number ${num.destiny} names the outer contribution — the work the world will remember you for.`);
    drawH("Action Plan");
    drawP("• Choose one project that expresses your Destiny Number this quarter.\n• Track a weekly ritual on the day of your strongest planet.\n• Once a year, review with your chart, not your peers.");
  }

  if (key === "love") {
    drawH("The 7th House & Venus");
    const venus = chart.planets.find(p => p.name === "Venus");
    drawP(`Venus sits in rashi ${(venus?.rashi ?? 0) + 1} at ${(venus?.degreeInRashi ?? 0).toFixed(1)}° — this is the tone of your love language. Your Soul Urge is ${num.soulUrge}: the private, unspoken longing that must be met.`);
    drawH("Guidance");
    drawP("Love wants a witness, not a fixer. Ask for what the Soul Urge wants; give what the 7th house offers.");
  }

  if (key === "wealth") {
    drawH("Wealth Houses");
    drawP(`Rashi of the 2nd from Lagna: ${(chart.ascendant.rashi + 1) % 12 + 1}. Rashi of the 11th: ${(chart.ascendant.rashi + 10) % 12 + 1}. Money follows attention placed on both — earning (2nd) and networks (11th).`);
    drawH("Personal Year");
    drawP(`Your Personal Year is ${num.personalYear}. ${personalYearNote(num.personalYear)}`);
    drawH("Wealth Rituals");
    drawP("• Friday evening — light a ghee lamp before Lakshmi.\n• Weekly — donate one item you have loved but no longer need.\n• Monthly — write your 3 top clients or supporters a gratitude note.");
  }

  if (key === "yearly") {
    drawH("Personal Year Overview");
    drawP(`You are in Personal Year ${num.personalYear}. ${personalYearNote(num.personalYear)}`);
    drawH("Monthly Themes");
    for (let mo = 1; mo <= 12; mo++) {
      const pm = ((num.personalYear + mo - 1 - 1) % 9) + 1;
      drawKV([[`Month ${mo}`, `Personal Month ${pm} — ${monthNote(pm)}`]]);
    }
  }

  if (key === "remedy") {
    drawH("Priority Planets");
    for (const p of priorities.slice(0, 4)) {
      drawKV([[p.planet, p.reasons.join(" · ") || "Universal upaya recommended."]]);
    }
    for (const p of priorities.slice(0, 3)) {
      const r = REMEDY_CATALOG[p.planet];
      drawH(`${p.planet} · ${r.deity}`);
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
    pdf.setTextColor(120, 118, 108);
    pdf.text(`Page ${i - 1} of ${pages - 1}`, w - margin, h - 24, { align: "right" });
    pdf.text("TAROMAYA · taromaya.app", margin, h - 24);
  }
  return pdf;
}

const RASHI_NAMES = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
function labelRashi(i: number) { return RASHI_NAMES[i % 12] ?? "—"; }

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
