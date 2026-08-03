import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Sparkles, Gauge, MapPin, HeartHandshake, FileText, Cloud, MousePointerClick,
  Phone, Cpu, Activity, ClipboardCheck, ArrowRight, Printer, Share2, Download,
  Check, ChevronRight,
} from "lucide-react";
import {
  Reveal, MnSection, MnCard, MnMeter, MnDial, MnPill, MnButton, PhoneShowpiece,
} from "@/components/mobile-num/mn-kit";
import { MN_MODULES } from "@/lib/mobile-num/modules";
import { analyseNumber } from "@/lib/vedic-num/applied";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/mobile-numerology/")({
  head: () => ({
    meta: [
      { title: "Mobile Numerology Intelligence — AI Number Analysis" },
      {
        name: "description",
        content:
          "Decode any mobile number with AI numerology: energy score, position reading, planetary influence, compatibility, lucky digits and a professional report.",
      },
      { property: "og:title", content: "Mobile Numerology Intelligence — AI Number Analysis" },
      {
        property: "og:description",
        content:
          "Energy score, digit position reading, planetary influence, compatibility and a printable professional report for any mobile number.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MobileNumerologyPage,
});

const WHY = [
  { icon: Sparkles, title: "Instant AI Analysis", body: "Generate a complete mobile number report within seconds, no manual working required." },
  { icon: MapPin, title: "Position-Based Reading", body: "Understand the significance of every digit according to the position it occupies." },
  { icon: HeartHandshake, title: "Compatibility Engine", body: "Check how well the number agrees with the person who will actually carry it." },
  { icon: FileText, title: "Professional Reports", body: "Beautiful printable reports built for consultants presenting to real clients." },
  { icon: Cloud, title: "Cloud Processing", body: "Fast calculations on a secure cloud architecture, available on every device." },
  { icon: MousePointerClick, title: "Simple Interface", body: "Designed so a beginner and a working professional both get value immediately." },
];

const STEPS = [
  { icon: Phone, title: "Enter Mobile Number", body: "Type or dictate the number with its country code." },
  { icon: Cpu, title: "AI Processes Every Digit", body: "Each digit is mapped to its planet, position and weight." },
  { icon: Activity, title: "Energy Pattern Calculation", body: "Totals, tails, repeats and gaps become measurable scores." },
  { icon: ClipboardCheck, title: "Complete Professional Report", body: "A written verdict with reasoning, timing and remedies." },
];

const BENEFITS = [
  "Faster decisions", "Better mobile number selection", "Professional consultation support",
  "Accurate calculations", "Easy understanding", "Printable reports",
  "Cloud synchronisation", "AI-powered insights",
];

const FAQS = [
  {
    q: "How is mobile numerology calculated?",
    a: "Every digit of the number is added, then reduced to a single value between one and nine. That value carries a ruling planet. The last four digits are reduced separately because they carry the strongest daily effect, and each position block is read on its own. The result is then compared with the owner's driver number to judge support.",
  },
  {
    q: "Can I analyse multiple numbers?",
    a: "Yes. Numbers can be analysed one after another and compared side by side, which is the usual way to choose between a shortlist offered by a provider. Saved profiles keep the owner's birth details so each comparison is judged against the same person.",
  },
  {
    q: "Does the report include remedies?",
    a: "It does. Remedies stay practical and planetary: the supporting weekday, colour, a mantra count and simple usage discipline such as routing income through one number. Nothing fearful and nothing that asks you to spend heavily.",
  },
  {
    q: "Can I download reports?",
    a: "Every report can be exported as a PDF, sent to a printer or shared as a link. The layout is built for client presentation, with a cover page, charts and a recommendation section.",
  },
  {
    q: "Is my data secure?",
    a: "Numbers and birth details are stored against your own account only, protected by row level security so no other account can read them. Nothing is sold or shared, and a report is only visible to someone else if you deliberately share its link.",
  },
];

function MobileNumerologyPage() {
  return (
    <div className="min-h-dvh bg-mnbg text-mnink">
      <Hero />
      <WhyChoose />
      <HowItWorks />
      <Modules />
      <Analyzer />
      <ReportPreview />
      <DashboardPreview />
      <Benefits />
      <Faq />
      <FinalCta />
    </div>
  );
}

/* ------------------------------- 1. hero ------------------------------- */

function Hero() {
  return (
    <section className="mn-wash px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <MnPill>
            <Sparkles className="h-3 w-3 text-mngold" /> AI numerology engine
          </MnPill>
          <h1 className="mt-5 text-[34px] font-semibold leading-[1.08] tracking-tight text-mnink sm:text-[54px]">
            Mobile Numerology
            <span className="block bg-gradient-to-r from-mnindigo via-mnindigo to-mngold bg-clip-text text-transparent">
              Intelligence
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-mnink-soft sm:text-base">
            Decode the hidden vibrations of every mobile number using advanced AI-powered
            numerology analysis. Instantly discover strengths, weaknesses, compatibility, lucky
            combinations, communication energy, financial potential and personalised
            recommendations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#analyzer">
              <MnButton>
                Analyze Mobile Number <ArrowRight className="h-4 w-4" />
              </MnButton>
            </a>
            <a href="#report">
              <MnButton variant="ghost">View Sample Report</MnButton>
            </a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3">
            {[
              ["17", "analysis modules"],
              ["9", "planetary mappings"],
              ["3", "languages"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="text-2xl font-semibold text-mnink">{n}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-mnink-soft">{l}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={120}>
          <PhoneShowpiece />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------- 2. why choose ---------------------------- */

function WhyChoose() {
  return (
    <MnSection
      eyebrow="Why choose this software"
      title="Built for consultants who have to justify every answer"
      lead="Each result names the digits, positions and planets behind it, so a reading can be defended in front of a client rather than merely asserted."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WHY.map((c, i) => (
          <Reveal key={c.title} delay={i * 70}>
            <MnCard className="h-full transition-transform duration-300 hover:-translate-y-1">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mnindigo/10 text-mnindigo">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[17px] font-semibold text-mnink">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mnink-soft">{c.body}</p>
            </MnCard>
          </Reveal>
        ))}
      </div>
    </MnSection>
  );
}

/* --------------------------- 3. how it works --------------------------- */

function HowItWorks() {
  return (
    <MnSection
      tinted
      eyebrow="How mobile numerology works"
      title="Four steps from a raw number to a written verdict"
    >
      <div className="relative">
        <div
          aria-hidden
          className="absolute left-6 top-0 hidden h-px w-full bg-gradient-to-r from-mnindigo/40 via-mngold/50 to-transparent lg:block"
        />
        <div className="grid gap-5 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <MnCard glass className="h-full">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-mnindigo text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <s.icon className="h-5 w-5 text-mngold" />
                </div>
                <h3 className="mt-4 text-[17px] font-semibold text-mnink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mnink-soft">{s.body}</p>
              </MnCard>
            </Reveal>
          ))}
        </div>
      </div>
    </MnSection>
  );
}

/* ---------------------------- 4. modules ---------------------------- */

function Modules() {
  return (
    <MnSection
      eyebrow="Premium analysis modules"
      title="Seventeen modules, each with its own detail page"
      lead="Open any module to see exactly what it reads, how it is calculated and when to rely on it."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MN_MODULES.map((m, i) => (
          <Reveal key={m.slug} delay={Math.min(i * 40, 320)}>
            <Link
              to="/mobile-numerology/module/$slug"
              params={{ slug: m.slug }}
              className="mncard group flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:border-mnindigo/40"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mngold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-[16px] font-semibold leading-snug text-mnink">{m.title}</h3>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-mnink-soft">{m.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-mnindigo">
                Open analysis
                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </MnSection>
  );
}

/* ---------------------------- 5. analyzer ---------------------------- */

/** Dial codes for the markets this product serves. */
const DIAL_CODES: { dial: string; name: string }[] = [
  { dial: "+91", name: "India" },
  { dial: "+1", name: "United States / Canada" },
  { dial: "+44", name: "United Kingdom" },
  { dial: "+61", name: "Australia" },
  { dial: "+64", name: "New Zealand" },
  { dial: "+65", name: "Singapore" },
  { dial: "+971", name: "United Arab Emirates" },
  { dial: "+974", name: "Qatar" },
  { dial: "+966", name: "Saudi Arabia" },
  { dial: "+60", name: "Malaysia" },
  { dial: "+27", name: "South Africa" },
  { dial: "+977", name: "Nepal" },
  { dial: "+94", name: "Sri Lanka" },
  { dial: "+880", name: "Bangladesh" },
  { dial: "+49", name: "Germany" },
  { dial: "+33", name: "France" },
  { dial: "+81", name: "Japan" },
];

const LUCKY_DAY: Record<number, string> = {
  1: "Sunday", 2: "Monday", 3: "Thursday", 4: "Saturday", 5: "Wednesday",
  6: "Friday", 7: "Monday", 8: "Saturday", 9: "Tuesday",
};

function Analyzer() {
  const [dial, setDial] = useState("+91");
  const [raw, setRaw] = useState("");
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");

  const result = useMemo(() => (phase === "done" ? analyseNumber("mobile", raw) : null), [phase, raw]);

  const run = () => {
    if (raw.replace(/\D/g, "").length < 6) return;
    setPhase("loading");
    window.setTimeout(() => setPhase("done"), 1100);
  };

  const talk = result?.energies.find((e) => e.label === "Communication energy")?.value ?? 0;
  const money = result?.energies.find((e) => e.label === "Money energy")?.value ?? 0;

  return (
    <MnSection
      id="analyzer"
      tinted
      eyebrow="Interactive analyzer"
      title="Analyse a number right here"
      lead="The calculation runs on the same engine used for full reports, so the score you see is the score the report will print."
    >
      <Reveal>
        <MnCard glass className="p-6 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-[150px_1fr_auto]">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-mnink-soft">
                Country code
              </span>
              <select
                value={dial}
                onChange={(e) => setDial(e.target.value)}
                className="h-11 w-full rounded-xl border border-mnline bg-mnsurface px-3 text-sm text-mnink outline-none focus:border-mnindigo"
              >
                {DIAL_CODES.map((c) => (
                  <option key={c.dial} value={c.dial}>
                    {c.dial} {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-mnink-soft">
                Enter mobile number
              </span>
              <input
                inputMode="numeric"
                value={raw}
                onChange={(e) => {
                  setRaw(e.target.value);
                  setPhase("idle");
                }}
                onKeyDown={(e) => e.key === "Enter" && run()}
                placeholder="98765 43210"
                maxLength={18}
                className="h-11 w-full rounded-xl border border-mnline bg-mnsurface px-4 text-base tracking-[0.12em] text-mnink outline-none placeholder:text-mnink-soft/60 focus:border-mnindigo"
              />
            </label>
            <div className="flex items-end">
              <MnButton onClick={run} className="w-full sm:w-auto">
                {phase === "loading" ? "Analysing…" : "Analyze"}
              </MnButton>
            </div>
          </div>

          {phase === "loading" && (
            <div className="mt-8 space-y-3" aria-live="polite">
              {["Mapping digits to planets", "Reducing totals and tail", "Scoring energy pattern"].map((t, i) => (
                <div key={t} className="flex items-center gap-3">
                  <span
                    className="h-2 w-2 rounded-full bg-mnindigo"
                    style={{ animation: `pulse 1s ${i * 220}ms infinite` }}
                  />
                  <span className="text-sm text-mnink-soft">{t}</span>
                </div>
              ))}
              <div className="h-1.5 overflow-hidden rounded-full bg-mnline">
                <div className="h-full w-1/2 animate-[slide-in-right_1.1s_ease-out] rounded-full bg-gradient-to-r from-mnindigo to-mngold" />
              </div>
            </div>
          )}

          {result && (
            <div className="mt-8 grid gap-6 lg:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-4">
                <MnDial value={result.score} label="energy" caption={`Ruling number ${result.reduced}`} size={150} />
                <span className="rounded-full bg-mnemerald/12 px-3 py-1 text-xs font-semibold text-mnemerald">
                  {result.score}% lucky vibration
                </span>
              </div>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Fact label="Planet influence" value={result.planet} />
                  <Fact label="Lucky colour" value={result.colour} />
                  <Fact label="Lucky day" value={LUCKY_DAY[result.reduced] ?? "—"} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Fact label="Lucky number" value={String(result.reduced)} />
                  <Fact label="Digit total" value={String(result.total)} />
                  <Fact label="Last four" value={result.lastFour ? `${result.lastFour.value} → ${result.lastFour.reduced}` : "—"} />
                </div>
                <div className="space-y-3 pt-1">
                  <MnMeter label="Strength" value={result.score} />
                  <MnMeter label="Compatibility with communication" value={talk} tone="emerald" />
                  <MnMeter label="Financial vibration" value={money} tone="gold" />
                </div>
                <div className="rounded-2xl border border-mnindigo/20 bg-mnindigo/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mnindigo">Key advice</p>
                  <p className="mt-2 text-sm leading-relaxed text-mnink">{result.recommendation}</p>
                  {result.suggestions[0] && (
                    <p className="mt-2 text-sm leading-relaxed text-mnink-soft">{result.suggestions[0]}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </MnCard>
      </Reveal>
    </MnSection>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-mnline bg-mnsurface px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mnink-soft">{label}</p>
      <p className="mt-1 text-sm font-semibold text-mnink">{value}</p>
    </div>
  );
}

/* -------------------------- 6. report preview -------------------------- */

const REPORT_PAGES = [
  { title: "Cover page", body: "Number, owner, energy band and date of analysis." },
  { title: "Energy summary", body: "Headline score with the two strongest contributors." },
  { title: "Digit position analysis", body: "Opening, middle and closing blocks read in sequence." },
  { title: "Planet mapping", body: "Dominant, supporting and missing planets in a table." },
  { title: "Strength graph", body: "Bar chart of the six energy channels." },
  { title: "Weakness graph", body: "The same channels ranked by exposure." },
  { title: "Compatibility result", body: "Number against owner, stated as a percentage." },
  { title: "Recommendations", body: "Keep, adjust or replace, with the reasoning." },
  { title: "Lucky combinations", body: "Preferred tails and digit substitutions." },
  { title: "Remedies", body: "Weekday, colour, mantra count and usage discipline." },
];

function ReportPreview() {
  return (
    <MnSection
      id="report"
      eyebrow="Professional report preview"
      title="A document you can hand to a client"
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <div className="mncard overflow-hidden p-0">
            <div className="mn-wash border-b border-mnline p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-mnindigo">
                Mobile numerology report
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-[0.14em] text-mnink">98•••43210</p>
              <p className="mt-2 text-sm text-mnink-soft">Ruling number 6 · Venus · Favourable</p>
              <div className="mt-5 flex items-center gap-3">
                <MnDial value={87} label="score" size={104} />
                <div className="flex-1 space-y-2">
                  <MnMeter label="Communication" value={92} />
                  <MnMeter label="Finance" value={78} tone="gold" />
                  <MnMeter label="Harmony" value={84} tone="emerald" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 p-5">
              <MnButton className="flex-1">
                <Download className="h-4 w-4" /> PDF
              </MnButton>
              <MnButton variant="ghost">
                <Printer className="h-4 w-4" /> Print
              </MnButton>
              <MnButton variant="ghost">
                <Share2 className="h-4 w-4" /> Share
              </MnButton>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <MnCard className="h-full">
            <ol className="divide-y divide-mnline">
              {REPORT_PAGES.map((p, i) => (
                <li key={p.title} className="flex gap-4 py-3.5 first:pt-0 last:pb-0">
                  <span className="mt-0.5 text-[11px] font-semibold text-mngold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-mnink">{p.title}</p>
                    <p className="text-[13px] leading-relaxed text-mnink-soft">{p.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </MnCard>
        </Reveal>
      </div>
    </MnSection>
  );
}

/* ------------------------- 7. dashboard preview ------------------------- */

function DashboardPreview() {
  const bars = [62, 78, 91, 55, 84, 70, 46, 88, 73];
  const trend = [38, 52, 47, 66, 61, 79, 74, 88];
  return (
    <MnSection
      tinted
      eyebrow="Dashboard preview"
      title="Every measurement on one quiet screen"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal>
          <MnCard glass className="h-full">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mnink-soft">Energy wheel</p>
            <div className="mt-4 flex justify-center">
              <EnergyWheel />
            </div>
          </MnCard>
        </Reveal>
        <Reveal delay={80}>
          <MnCard glass className="h-full">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mnink-soft">Digit heatmap</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d, i) => (
                <div
                  key={d}
                  className="grid aspect-square place-items-center rounded-xl text-sm font-semibold"
                  style={{
                    background: `color-mix(in oklab, var(--color-mnindigo) ${6 + ((bars[i] ?? 0) / 100) * 46}%, white)`,
                    color: (bars[i] ?? 0) > 70 ? "white" : "var(--color-mnink)",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <MnDial value={87} label="score" size={82} />
              <MnDial value={74} label="money" size={82} />
              <MnDial value={91} label="talk" size={82} />
            </div>
          </MnCard>
        </Reveal>
        <Reveal delay={160}>
          <MnCard glass className="h-full">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mnink-soft">Channel strength</p>
            <div className="mt-5 flex h-32 items-end gap-2">
              {bars.map((b, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-mnindigo/35 to-mnindigo"
                  style={{ height: `${b}%` }}
                />
              ))}
            </div>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-mnink-soft">Numerology timeline</p>
            <svg viewBox="0 0 240 70" className="mt-3 w-full" role="img" aria-label="Trend of energy score across periods">
              <polyline
                fill="none"
                stroke="var(--color-mngold)"
                strokeWidth="2.5"
                strokeLinecap="round"
                points={trend.map((v, i) => `${(i * 240) / (trend.length - 1)},${70 - (v / 100) * 62}`).join(" ")}
              />
              {trend.map((v, i) => (
                <circle key={i} cx={(i * 240) / (trend.length - 1)} cy={70 - (v / 100) * 62} r="2.6" fill="var(--color-mnindigo)" />
              ))}
            </svg>
          </MnCard>
        </Reveal>
      </div>
    </MnSection>
  );
}

function EnergyWheel() {
  const planets = ["Sun", "Moon", "Jup", "Rahu", "Merc", "Ven", "Ket", "Sat", "Mars"];
  return (
    <div className="relative h-56 w-56">
      <div className="absolute inset-0 rounded-full border border-mnindigo/25" />
      <div className="absolute inset-6 rounded-full border border-mngold/40" />
      <div className="absolute inset-12 rounded-full border border-mnindigo/15" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-3xl font-semibold text-mnink">6</p>
          <p className="text-[10px] uppercase tracking-[0.22em] text-mnink-soft">Venus</p>
        </div>
      </div>
      {planets.map((p, i) => {
        const a = (i / planets.length) * Math.PI * 2 - Math.PI / 2;
        return (
          <span
            key={p}
            className="absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-mnline bg-mnsurface text-[9px] font-semibold text-mnink-soft shadow-sm"
            style={{ left: `${50 + Math.cos(a) * 42}%`, top: `${50 + Math.sin(a) * 42}%` }}
          >
            {p}
          </span>
        );
      })}
    </div>
  );
}

/* ---------------------------- 8. benefits ---------------------------- */

function Benefits() {
  return (
    <MnSection eyebrow="Benefits" title="What changes once the numbers are measurable">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((b, i) => (
          <Reveal key={b} delay={i * 55}>
            <div className="mncard flex h-full items-start gap-3 p-5">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mnemerald/12 text-mnemerald">
                <Check className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm font-medium leading-snug text-mnink">{b}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </MnSection>
  );
}

/* ------------------------------- 9. faq ------------------------------- */

function Faq() {
  return (
    <MnSection tinted eyebrow="Frequently asked questions" title="The answers consultants ask for first">
      <Reveal>
        <MnCard className="p-2 sm:p-4">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`} className="border-mnline">
                <AccordionTrigger className="px-3 text-left text-[15px] font-semibold text-mnink hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="px-3 text-sm leading-relaxed text-mnink-soft">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </MnCard>
      </Reveal>
    </MnSection>
  );
}

/* ----------------------------- 10. final cta ----------------------------- */

function FinalCta() {
  return (
    <MnSection>
      <Reveal>
        <div className="mncard mn-wash relative overflow-hidden p-8 text-center sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-mnindigo/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-mngold/12 blur-3xl"
          />
          <Gauge className="mx-auto h-8 w-8 text-mngold" />
          <h2 className="mx-auto mt-5 max-w-2xl text-[26px] font-semibold leading-tight tracking-tight text-mnink sm:text-4xl">
            Ready to Discover Your Mobile Number Energy?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-mnink-soft">
            Generate a detailed AI-powered numerology report in seconds with professional insights,
            advanced calculations and personalised recommendations.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#analyzer">
              <MnButton>
                Start Analysis <ArrowRight className="h-4 w-4" />
              </MnButton>
            </a>
            <a href="#report">
              <MnButton variant="ghost">Explore Demo</MnButton>
            </a>
          </div>
        </div>
      </Reveal>
    </MnSection>
  );
}
