import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown, BadgeCheck, Banknote, BookOpen, Brain, Briefcase, ChevronDown,
  Compass, Crown, Download, Gem, GraduationCap, HeartHandshake, Landmark,
  Lightbulb, MessageCircle, Pencil, Save, Share2, Sparkles, TrendingUp, Users,
} from "lucide-react";
import { MnButton, MnDial, MnMeter, MnSection, Reveal } from "@/components/mobile-num/mn-kit";
import { LanguageSwitcher } from "@/components/language-switcher";
import { analyseName, EDUCATION, type NameAnalysis } from "@/lib/name-num/engine";
import { downloadNamePdf } from "@/lib/name-num/pdf";
import type { NameSystem } from "@/lib/name-numerology-pro";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/name-numerology")({
  head: () => ({
    meta: [
      { title: "Name Numerology Analysis — Taromaya" },
      {
        name: "description",
        content:
          "Professional name numerology: letter breakdown, compound and single number, planet analysis, career, relationship and money reports, correction study and a downloadable report.",
      },
      { property: "og:title", content: "Name Numerology Analysis — Taromaya" },
      {
        property: "og:description",
        content:
          "Read any name letter by letter: compound number, ruling planet, career fit, money pattern, correction suggestions and a premium report.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NameNumerologyPage,
});

const STORE = "taromaya.nameNumerology";

// ── small local pieces ──────────────────────────────────────────────────────

function Expandable({
  title,
  children,
  defaultOpen = false,
  right,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  right?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mncard overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full min-h-14 items-center gap-3 px-5 py-4 text-left"
      >
        <span className="min-w-0 flex-1 text-[15px] font-semibold text-mnink">{title}</span>
        {right}
        <ChevronDown
          className={cn("size-5 shrink-0 text-mnink-soft transition-transform duration-300", open && "rotate-180")}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-500 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 text-[15px] leading-relaxed text-mnink-soft">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-mnline bg-mnsurface px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mnink-soft">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-mnink">{value}</p>
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone?: "gold" | "emerald" | "indigo" }) {
  return (
    <div className="rounded-[18px] border border-mnline bg-white/80 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mnink-soft">{label}</p>
      <p
        className={cn(
          "mt-1 text-[19px] font-semibold",
          tone === "gold" ? "text-mngold" : tone === "emerald" ? "text-mnemerald" : "text-mnink",
        )}
      >
        {value}
      </p>
    </div>
  );
}

const PLANET_ICON: Record<string, typeof Crown> = {
  Nature: Sparkles,
  Strengths: BadgeCheck,
  Weaknesses: Lightbulb,
  "Leadership style": Crown,
  Communication: MessageCircle,
  "Money pattern": Banknote,
  Relationships: HeartHandshake,
  "Career style": Briefcase,
  "Learning style": GraduationCap,
};

const ICON_TONE: Record<string, string> = {
  Nature: "bg-mnindigo/10 text-mnindigo",
  Strengths: "bg-mnemerald/12 text-mnemerald",
  Weaknesses: "bg-mngold/15 text-mngold",
  "Leadership style": "bg-mnindigo/10 text-mnindigo",
  Communication: "bg-mnemerald/12 text-mnemerald",
  "Money pattern": "bg-mngold/15 text-mngold",
  Relationships: "bg-mnindigo/10 text-mnindigo",
  "Career style": "bg-mnemerald/12 text-mnemerald",
  "Learning style": "bg-mngold/15 text-mngold",
};

// ── page ────────────────────────────────────────────────────────────────────

function NameNumerologyPage() {
  const [name, setName] = useState("");
  const [system, setSystem] = useState<NameSystem>("Chaldean");
  const [editing, setEditing] = useState(true);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return;
      const saved = JSON.parse(raw) as { name?: string; system?: NameSystem };
      if (saved.name) {
        setName(saved.name);
        setDraft(saved.name);
        setEditing(false);
      }
      if (saved.system) setSystem(saved.system);
    } catch {
      /* first visit */
    }
  }, []);

  const analysis: NameAnalysis | null = useMemo(
    () => (name.trim().length >= 2 ? analyseName(name, system) : null),
    [name, system],
  );

  const apply = () => {
    const next = draft.trim();
    if (next.length < 2) {
      toast.error("Please write at least two letters of the name.");
      return;
    }
    setName(next);
    setEditing(false);
  };

  const save = () => {
    localStorage.setItem(STORE, JSON.stringify({ name, system }));
    toast.success("Profile saved on this device.");
  };

  const share = async () => {
    if (!analysis) return;
    const text = `${analysis.input} — name number ${analysis.root} (${analysis.planet.planet}), compound ${analysis.compound}, rating ${analysis.rating} of 100.`;
    try {
      if (navigator.share) await navigator.share({ title: "Name numerology", text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Summary copied.");
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="min-h-dvh bg-mnbg text-mnink">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-mnline/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-8">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mnindigo">
              Name numerology
            </p>
            <p className="truncate text-[15px] font-semibold text-mnink">
              {name || "Add a name to begin"}
            </p>
          </div>
          <div className="shrink-0">
            <LanguageSwitcher compact />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 pb-3 sm:px-8">
          <button
            type="button"
            onClick={() => {
              setDraft(name);
              setEditing(true);
            }}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-mnline bg-mnsurface px-4 text-[13px] font-semibold text-mnink"
          >
            <Pencil className="size-4" /> Edit name
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!analysis}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-mnline bg-mnsurface px-4 text-[13px] font-semibold text-mnink disabled:opacity-40"
          >
            <Save className="size-4" /> Save profile
          </button>
          <button
            type="button"
            onClick={share}
            disabled={!analysis}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-mnline bg-mnsurface px-4 text-[13px] font-semibold text-mnink disabled:opacity-40"
          >
            <Share2 className="size-4" /> Share report
          </button>
          <button
            type="button"
            onClick={() => analysis && downloadNamePdf(analysis)}
            disabled={!analysis}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-mnindigo px-4 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            <Download className="size-4" /> Report
          </button>
        </div>
      </header>

      {/* Name entry */}
      {(editing || !analysis) && (
        <section className="px-5 pt-8 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mnglass p-6">
              <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-mnink sm:text-3xl">
                Read a name, letter by letter
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-mnink-soft">
                Write the name exactly as it is spelled on documents. Every letter is valued,
                totalled and explained, and nothing is suggested without a reason.
              </p>
              <label htmlFor="nn-name" className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-mnink-soft">
                Full name
              </label>
              <input
                id="nn-name"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder="Aarav Sharma"
                autoComplete="name"
                className="mt-2 min-h-12 w-full rounded-[18px] border border-mnline bg-white px-4 text-[17px] text-mnink outline-none placeholder:text-mnink-soft/60 focus:border-mnindigo"
              />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {(["Chaldean", "Pythagorean"] as NameSystem[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSystem(s)}
                    className={cn(
                      "min-h-10 rounded-full px-4 text-[13px] font-semibold transition-colors",
                      system === s
                        ? "bg-mnink text-white"
                        : "border border-mnline bg-mnsurface text-mnink-soft",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <MnButton className="mt-5 w-full sm:w-auto" onClick={apply}>
                Analyse name
              </MnButton>
            </div>
          </div>
        </section>
      )}

      {analysis && !editing && <Report a={analysis} />}

      {analysis && !editing && (
        <footer className="px-5 pb-16 text-center sm:px-8">
          <p className="text-[13px] text-mnink-soft">
            Deterministic analysis. The same spelling always gives the same reading.
          </p>
        </footer>
      )}
    </div>
  );
}

function Report({ a }: { a: NameAnalysis }) {
  const planetRows: { label: string; value: string }[] = [
    { label: "Nature", value: a.planet.nature },
    { label: "Strengths", value: a.planet.strengths.join(" · ") },
    { label: "Weaknesses", value: a.planet.weaknesses.join(" · ") },
    { label: "Leadership style", value: a.planet.leadership },
    { label: "Communication", value: a.planet.communication },
    { label: "Money pattern", value: a.planet.money },
    { label: "Relationships", value: a.planet.relationships },
    { label: "Career style", value: a.planet.career },
    { label: "Learning style", value: a.planet.learning },
  ];

  return (
    <>
      {/* Hero analysis card */}
      <section className="px-5 pt-6 sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <Reveal>
            <div className="mnglass overflow-hidden p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mnindigo">
                Name analysis
              </p>
              <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight text-mnink sm:text-4xl">
                {a.input}
              </h1>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <StatBox label="Name number" value={String(a.root)} />
                <StatBox label="Compound" value={String(a.compound)} tone="indigo" />
                <StatBox label="Planet" value={a.planet.planet} tone="gold" />
                <StatBox label="Lucky level" value={a.luckLevel} tone="emerald" />
              </div>
              <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
                <MnDial value={a.rating} label="Rating" caption="Overall name strength" size={158} />
                <div className="w-full max-w-sm space-y-4">
                  <MnMeter label="Harmony meter" value={a.harmony} tone="gold" />
                  <MnMeter label="Overall rating" value={a.rating} />
                  <MnMeter
                    label="Balance of inner and outer"
                    value={Math.min(99, Math.round((Math.min(a.chart.vowelTotal, a.chart.consonantTotal) / Math.max(1, Math.max(a.chart.vowelTotal, a.chart.consonantTotal))) * 100))}
                    tone="emerald"
                  />
                </div>
              </div>
              <p className="mt-6 rounded-[18px] bg-mnindigo/[0.06] p-4 text-[14px] leading-relaxed text-mnink">
                {a.compoundMeaning}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 1. Letter breakdown */}
      <MnSection
        eyebrow="Section 1"
        title="Name breakdown"
        lead="Every letter, its value, its planet and the energy it adds to the whole name."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {a.letters.map((l, i) => (
            <Reveal key={`${l.letter}-${i}`} delay={Math.min(400, i * 35)}>
              <div className="mncard flex items-center gap-3 p-4">
                <div
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-[14px] text-[18px] font-semibold",
                    l.isVowel ? "bg-mngold/15 text-mngold" : "bg-mnindigo/10 text-mnindigo",
                  )}
                >
                  {l.letter}
                </div>
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold text-mnink">{l.value}</p>
                  <p className="truncate text-[12px] text-mnink-soft">
                    {l.planet} · {l.energy}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Chip label="Vowel total" value={`${a.chart.vowelTotal} → ${a.chart.vowelRoot}`} />
          <Chip label="Consonant total" value={`${a.chart.consonantTotal} → ${a.chart.consonantRoot}`} />
          <Chip
            label="Missing values"
            value={a.chart.missingValues.length ? a.chart.missingValues.join(", ") : "None"}
          />
        </div>
      </MnSection>

      {/* 2. Total calculation */}
      <MnSection
        tinted
        eyebrow="Section 2"
        title="Total calculation"
        lead="Each step shown in order, so the final number can be checked by hand."
      >
        <div className="mx-auto max-w-2xl">
          {a.steps.map((s, i) => (
            <Reveal key={s.label} delay={Math.min(500, i * 90)}>
              <div className="mncard p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mnindigo">
                  {s.label}
                </p>
                <p className="mt-1 break-words text-[20px] font-semibold text-mnink">{s.value}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-mnink-soft">{s.note}</p>
              </div>
              {i < a.steps.length - 1 && (
                <div className="flex justify-center py-3">
                  <ArrowDown className="size-5 animate-bounce text-mngold" />
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </MnSection>

      {/* 3. Planet analysis */}
      <MnSection
        eyebrow="Section 3"
        title={`Ruling planet: ${a.planet.planet}`}
        lead={`Number ${a.root} is governed by ${a.planet.planet}. This is the tone the name carries into every room.`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {planetRows.map((row, i) => {
            const Icon = PLANET_ICON[row.label] ?? Sparkles;
            return (
              <Reveal key={row.label} delay={Math.min(400, i * 50)}>
                <div className="mncard flex h-full gap-4 p-5">
                  <div className={cn("grid size-10 shrink-0 place-items-center rounded-[14px]", ICON_TONE[row.label])}>
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-mnink">{row.label}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-mnink-soft">{row.value}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </MnSection>

      {/* 4. Personality report */}
      <MnSection
        tinted
        eyebrow="Section 4"
        title="Personality report"
        lead="Eighteen readings, each explaining what the number does and why it behaves that way."
      >
        <div className="space-y-3">
          {a.personality.map((s, i) => (
            <Reveal key={s.title} delay={Math.min(300, i * 25)}>
              <Expandable title={s.title} defaultOpen={i === 0}>
                {s.body}
              </Expandable>
            </Reveal>
          ))}
        </div>
      </MnSection>

      {/* 5. Career */}
      <MnSection
        eyebrow="Section 5"
        title="Career analysis"
        lead="Seventeen professions scored for this name, each with the reason, the strength it gives you and the challenge it brings."
      >
        <div className="space-y-3">
          {a.careers.map((c, i) => (
            <Reveal key={c.field} delay={Math.min(300, i * 20)}>
              <Expandable
                title={c.field}
                right={
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold",
                      c.score >= 82
                        ? "bg-mnemerald/12 text-mnemerald"
                        : c.score >= 66
                          ? "bg-mnindigo/10 text-mnindigo"
                          : "bg-mngold/15 text-mngold",
                    )}
                  >
                    {c.score}
                  </span>
                }
              >
                <div className="space-y-3">
                  <MnMeter label="Suitability" value={c.score} />
                  <p><span className="font-semibold text-mnink">Reason. </span>{c.reason}</p>
                  <p><span className="font-semibold text-mnink">Strength. </span>{c.strength}</p>
                  <p><span className="font-semibold text-mnink">Challenge. </span>{c.challenge}</p>
                </div>
              </Expandable>
            </Reveal>
          ))}
        </div>
      </MnSection>

      {/* 6. Relationships */}
      <MnSection
        tinted
        eyebrow="Section 6"
        title="Relationship analysis"
        lead="How this name behaves in closeness, commitment and conversation."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {a.relationships.map((r, i) => (
            <Reveal key={r.area} delay={Math.min(320, i * 40)}>
              <div className="mncard h-full p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-mnindigo/10 text-mnindigo">
                    <Users className="size-4" />
                  </span>
                  <p className="min-w-0 flex-1 text-[15px] font-semibold text-mnink">{r.area}</p>
                </div>
                <div className="mt-4">
                  <MnMeter label="Score" value={r.score} tone="emerald" />
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-mnink-soft">{r.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </MnSection>

      {/* 7. Financial */}
      <MnSection
        eyebrow="Section 7"
        title="Financial analysis"
        lead="Earning, keeping and growing money under this vibration."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {a.finance.map((f, i) => (
            <Reveal key={f.area} delay={Math.min(320, i * 40)}>
              <div className="mncard h-full p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-mngold/15 text-mngold">
                    <TrendingUp className="size-4" />
                  </span>
                  <p className="min-w-0 flex-1 text-[15px] font-semibold text-mnink">{f.area}</p>
                </div>
                <div className="mt-4">
                  <MnMeter label="Score" value={f.score} tone="gold" />
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-mnink-soft">{f.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </MnSection>

      {/* 8. Lucky */}
      <MnSection
        tinted
        eyebrow="Section 8"
        title="Lucky information"
        lead="Supportive elements drawn from the ruling planet of this name."
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {a.lucky.map((c, i) => (
            <Reveal key={c.label} delay={Math.min(320, i * 30)}>
              <Chip label={c.label} value={c.value} />
            </Reveal>
          ))}
        </div>
        <p className="mt-5 flex items-start gap-2 text-[13px] text-mnink-soft">
          <Gem className="mt-0.5 size-4 shrink-0 text-mngold" />
          Gemstones are a preference, not a prescription. Test any stone for a week before wearing it daily.
        </p>
      </MnSection>

      {/* 9. Correction */}
      <MnSection
        eyebrow="Section 9"
        title="Correction study"
        lead="Nothing is recommended without the reason and the expected effect shown beside it."
      >
        <Reveal>
          <div className="mnglass p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatBox label="Current name" value={a.input} />
              <StatBox
                label="Verdict"
                value={a.correction.balanced ? "Balanced, no change" : "Study advised"}
                tone={a.correction.balanced ? "emerald" : "gold"}
              />
            </div>
            <div className="mt-5">
              <MnMeter label="Confidence in this study" value={a.correction.confidence} tone="emerald" />
            </div>
          </div>
        </Reveal>
        <div className="mt-4 space-y-3">
          <Expandable title="Weak areas found" defaultOpen>
            <ul className="space-y-2">
              {a.correction.weakAreas.map((w) => (
                <li key={w} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-mngold" />
                  {w}
                </li>
              ))}
            </ul>
          </Expandable>
          <Expandable title="Suggested letter additions">
            <ul className="space-y-2">
              {a.correction.additions.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </Expandable>
          <Expandable title="Suggested letter removals">
            <ul className="space-y-2">
              {a.correction.removals.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </Expandable>
          <Expandable title="Alternative spellings and improved compounds">
            {a.correction.alternatives.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {a.correction.alternatives.map((alt) => (
                  <div key={alt.spelling} className="rounded-[18px] border border-mnline bg-mnsurface p-4">
                    <p className="text-[16px] font-semibold text-mnink">{alt.spelling}</p>
                    <p className="mt-1 text-[13px] text-mnink-soft">
                      Compound {alt.compound} → number {alt.root} · score {alt.score}
                    </p>
                    <p className="mt-2 text-[13px] text-mnink-soft">{alt.change}</p>
                  </div>
                ))}
              </div>
            ) : (
              "No alternative scores better than the current spelling, so keep the name as it is."
            )}
          </Expandable>
          <Expandable title="Expected improvements">
            <ul className="space-y-2">
              {a.correction.expected.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </Expandable>
        </div>
      </MnSection>

      {/* 10. Timeline */}
      <MnSection
        tinted
        eyebrow="Section 10"
        title="Phases of this name"
        lead="The order in which a name usually delivers its results."
      >
        <div className="relative mx-auto max-w-3xl pl-6">
          <span className="absolute left-[7px] top-2 bottom-2 w-px bg-mnline" aria-hidden />
          <div className="space-y-4">
            {a.timeline.map((t, i) => (
              <Reveal key={t.phase} delay={Math.min(400, i * 70)}>
                <div className="relative">
                  <span className="absolute -left-6 top-6 size-3.5 rounded-full border-2 border-white bg-mnindigo shadow" />
                  <div className="mncard p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mnindigo">
                      {t.window}
                    </p>
                    <p className="mt-1 text-[17px] font-semibold text-mnink">{t.phase}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-mnink-soft">{t.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </MnSection>

      {/* 11. Strength meters */}
      <MnSection
        eyebrow="Section 11"
        title="Strength meters"
        lead="Ten qualities scored from the name number and the compound total."
      >
        <Reveal>
          <div className="mncard grid gap-5 p-6 sm:grid-cols-2">
            {a.strengths.map((s, i) => (
              <MnMeter
                key={s.key}
                label={s.key}
                value={s.value}
                tone={i % 3 === 0 ? "indigo" : i % 3 === 1 ? "emerald" : "gold"}
              />
            ))}
          </div>
        </Reveal>
      </MnSection>

      {/* 12. Summary */}
      <MnSection tinted eyebrow="Section 12" title="Summary">
        <Reveal>
          <div className="mnglass p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <MnDial value={a.summary.rating} label="Overall" size={150} />
              <div className="grid w-full gap-3 sm:grid-cols-2">
                <StatBox label="Planet" value={a.summary.planet} tone="gold" />
                <StatBox label="Most suitable career" value={a.summary.career} tone="emerald" />
              </div>
            </div>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-mnink-soft">
              <p><span className="font-semibold text-mnink">Best strength. </span>{a.summary.bestStrength}</p>
              <p><span className="font-semibold text-mnink">Main challenge. </span>{a.summary.mainChallenge}</p>
              <p><span className="font-semibold text-mnink">Relationship nature. </span>{a.summary.relationship}</p>
              <p><span className="font-semibold text-mnink">Financial potential. </span>{a.summary.finance}</p>
              <p><span className="font-semibold text-mnink">Life advice. </span>{a.summary.advice}</p>
            </div>
            <p className="mt-6 flex items-start gap-3 rounded-[18px] bg-mngold/10 p-4 text-[16px] font-medium leading-relaxed text-mnink">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-mngold" />
              {a.summary.affirmation}
            </p>
          </div>
        </Reveal>
      </MnSection>

      {/* 13. Education */}
      <MnSection
        eyebrow="Section 13"
        title="How this is calculated"
        lead="The method in plain language, so the report can be checked rather than believed."
      >
        <div className="space-y-3">
          {EDUCATION.map((s, i) => (
            <Reveal key={s.title} delay={Math.min(300, i * 25)}>
              <Expandable title={s.title}>{s.body}</Expandable>
            </Reveal>
          ))}
        </div>
      </MnSection>

      {/* 14. Report */}
      <MnSection
        tinted
        eyebrow="Section 14"
        title="Professional report"
        lead="A formatted document with cover, calculation, analysis, career, relationships, finance, correction study, lucky elements and summary."
      >
        <Reveal>
          <div className="mnglass p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: BookOpen, label: "Cover and calculation" },
                { icon: Brain, label: "Personality and planet" },
                { icon: Briefcase, label: "Career and finance" },
                { icon: HeartHandshake, label: "Relationships" },
                { icon: Compass, label: "Correction study" },
                { icon: Landmark, label: "Lucky elements and summary" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-[18px] border border-mnline bg-mnsurface p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-mnindigo/10 text-mnindigo">
                    <Icon className="size-4" />
                  </span>
                  <p className="text-[14px] font-medium text-mnink">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <MnButton onClick={() => downloadNamePdf(a)} className="w-full sm:w-auto">
                <Download className="size-4" /> Download report
              </MnButton>
              <MnButton variant="ghost" onClick={() => window.print()} className="w-full sm:w-auto">
                Print this page
              </MnButton>
            </div>
          </div>
        </Reveal>
      </MnSection>
    </>
  );
}
