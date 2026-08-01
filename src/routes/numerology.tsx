import { PremiumGate } from "@/components/premium-gate";
import { DateSelect } from "@/components/date-select";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Explain } from "@/components/explain";
import { ConfidenceNote } from "@/components/confidence-note";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, GlassCard } from "@/components/page-shell";
import {
  computeNumerology, analyzeMobile, numerologyCompatibility, NUMBER_MEANINGS,
} from "@/lib/numerology";
import {
  loShuGrid, nineStarKi, kabbalah, essenceTimeline, lifeCycles, analyseName,
} from "@/lib/numerology-deep";
import { vedicNumerology, loShuAdvanced, relationSets } from "@/lib/vedic-numerology";
import {
  spellingCheck, nameDeepMeaning, missingAlphabets, spellingVariants,
  mobileDobMatch,
} from "@/lib/name-spelling";
import { aiReading } from "@/lib/ai-reading.functions";
import { Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/numerology")({
  component: () => (<PremiumGate featureName="Numerology"><NumerologyPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Numerology — TAROMAYA" },
      { name: "description", content: "Pythagorean, Chaldean, Kabbalah, Chinese Nine Star Ki, Lo Shu, Essence & Life Cycles with AI readings." },
    ],
  }),
});

type Tab = "report" | "personal" | "vedic" | "timeline" | "loshu" | "chinese" | "kabbalah" | "essence" | "name" | "mobile" | "compat";
const TAB_LABEL: Record<Tab, string> = {
  report: "Full Report",
  personal: "Personal",
  vedic: "Vedic",
  timeline: "Timeline",
  loshu: "Lo Shu",
  chinese: "Nine Star Ki",
  kabbalah: "Kabbalah",
  essence: "Essence",
  name: "Name",
  mobile: "Mobile",
  compat: "Kundli Matching",
};


function NumerologyPage() {
  const [tab, setTab] = useState<Tab>("report");
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("1995-06-15");
  const [system, setSystem] = useState<"Pythagorean" | "Chaldean">("Pythagorean");
  return (
    <PageShell
      eyebrow="Numerology"
      title="The vibration of numbers"
      subtitle="Pythagorean and Chaldean systems, personal-year timelines, mobile-number analysis, and Kundli matching."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest ${
              tab === t ? "gold-border bg-gold/15 text-pearl" : "border border-white/10 text-muted-foreground"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
      {tab === "personal" && (
        <PersonalNumerology
          fullName={fullName} setFullName={setFullName}
          birthDate={birthDate} setBirthDate={setBirthDate}
          system={system} setSystem={setSystem}
        />
      )}
      {tab === "vedic" && (
        <VedicTab
          fullName={fullName} setFullName={setFullName}
          birthDate={birthDate} setBirthDate={setBirthDate}
        />
      )}
      {tab === "timeline" && (
        <TimelineNumerology fullName={fullName} birthDate={birthDate} system={system} />
      )}
      {tab === "loshu" && <LoShuTab birthDate={birthDate} setBirthDate={setBirthDate} />}
      {tab === "chinese" && <NineStarKiTab birthDate={birthDate} setBirthDate={setBirthDate} />}
      {tab === "kabbalah" && <KabbalahTab fullName={fullName} setFullName={setFullName} />}
      {tab === "essence" && <EssenceTab fullName={fullName} birthDate={birthDate} />}
      {tab === "name" && <NameAnalysisTab fullName={fullName} setFullName={setFullName} birthDate={birthDate} />}
      {tab === "mobile" && <MobileNumerology birthDate={birthDate} setBirthDate={setBirthDate} />}
      {tab === "compat" && <KundliMatchingNumerology />}

      <ConfidenceNote noteKey="numerology" className="mt-6" />
    </PageShell>
  );
}

function PersonalNumerology({
  fullName, setFullName, birthDate, setBirthDate, system, setSystem,
}: {
  fullName: string; setFullName: (s: string) => void;
  birthDate: string; setBirthDate: (s: string) => void;
  system: "Pythagorean" | "Chaldean"; setSystem: (s: "Pythagorean" | "Chaldean") => void;
}) {
  const [aiText, setAiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ai = useServerFn(aiReading);

  const report = useMemo(() => {
    if (!fullName || !birthDate) return null;
    return computeNumerology({ fullName, birthDate }, system);
  }, [fullName, birthDate, system]);

  const generate = async () => {
    if (!report) return;
    setLoading(true); setAiText(null);
    try {
      const res = await ai({
        data: {
          system: "You are a poetic yet grounded numerology master. Write elegant readings in markdown.",
          prompt: `Write a personal numerology reading (~450 words) for ${fullName}, born ${birthDate}, using the ${report.system} system.
Life Path ${report.lifePath}. Destiny ${report.destiny}. Soul Urge ${report.soulUrge}. Personality ${report.personality}. Birthday ${report.birthday}. Maturity ${report.maturity}.
Personal Year ${report.personalYear}. Karmic Debts: ${report.karmicDebts.join(", ") || "none"}. Master Numbers: ${report.masterNumbers.join(", ") || "none"}.
Structure: Core Signature, Life Path & Destiny, Inner Self (Soul Urge & Personality), Cycles (Personal Year/Month/Day, Pinnacles), Guidance.`,
        },
      });
      setAiText(res.text);
    } finally { setLoading(false); }
  };

  return (
    <>
      <GlassCard>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block sm:col-span-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Full name (as used)</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Aryan Sharma"
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Date of birth</span>
            <DateSelect label="" value={birthDate} onChange={(v) => setBirthDate(v)} />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">System</span>
            <select value={system} onChange={(e) => setSystem(e.target.value as "Pythagorean" | "Chaldean")}
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50">
              <option>Pythagorean</option>
              <option>Chaldean</option>
            </select>
          </label>
        </div>
      </GlassCard>

      {report && (
        <>
          {/* Layer 1 — plain-language headline, no jargon. */}
          <div className="mt-6">
            <GlassCard>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Your simple result</div>
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <span className="font-display text-5xl gold-text">{report.lifePath}</span>
                <span className="text-lg text-pearl">is your life path number</span>
              </div>
              <p className="mt-2 text-sm text-pearl/90">
                This is the main number in numerology, worked out from your date of birth. In plain words: {NUMBER_MEANINGS[report.lifePath]?.toLowerCase()}
              </p>
            </GlassCard>
          </div>

          {/* Layer 2 — core numbers, one plain sentence each. */}
          <div className="mt-6">
            <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Your core numbers</div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <BigNum label="Life Path" n={report.lifePath} />
              <BigNum label="Destiny" n={report.destiny} />
              <BigNum label="Soul Urge" n={report.soulUrge} />
              <BigNum label="Personality" n={report.personality} />
              <BigNum label="Birthday" n={report.birthday} />
              <BigNum label="Maturity" n={report.maturity} />
              <BigNum label="Personal Year" n={report.personalYear} />
              <BigNum label="Personal Day" n={report.personalDay} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Life path: the path you are walking overall. Destiny: what you are here to do. Soul urge: what your heart quietly wants.
              Personality: how others see you first. Birthday: a small extra gift you were born with. Maturity: who you grow into later in life.
              Personal year and day: the mood of right now.
            </p>
          </div>

          {/* Layer 3 — advanced material, explained simply, further down the page. */}
          <div className="mt-10">
            <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Going deeper — cycles, luck and karma</div>
            <div className="grid gap-4 lg:grid-cols-2">
              <GlassCard title="Pinnacles & Challenges — the four chapters of your life">
                <p className="mb-3 text-xs text-muted-foreground">
                  Pinnacles are four big chapters your life moves through, each with its own lesson. Challenges are the harder habit each
                  chapter asks you to work on.
                </p>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {report.pinnacles.map((n, i) => (
                    <div key={i} className="rounded-xl bg-white/5 p-3">
                      <div className="text-[10px] text-muted-foreground">Chapter {i + 1}</div>
                      <div className="font-display text-2xl gold-text">{n}</div>
                    </div>
                  ))}
                  {report.challenges.map((n, i) => (
                    <div key={"c" + i} className="rounded-xl bg-white/5 p-3">
                      <div className="text-[10px] text-muted-foreground">Lesson {i + 1}</div>
                      <div className="font-display text-2xl text-red-300">{n}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
              <GlassCard title="Luck signature">
                <p className="mb-3 text-xs text-muted-foreground">Small everyday helpers linked to your life path number.</p>
                <div className="space-y-2 text-sm">
                  <KV k="Planet" v={report.planetRuler} />
                  <KV k="Lucky numbers" v={report.luckyNumbers.join(" · ")} />
                  <KV k="Lucky colours" v={report.luckyColors.join(" · ")} />
                  <KV k="Lucky days" v={report.luckyDays.join(" · ")} />
                  <KV k="Compatible numbers" v={report.compatibleNumbers.join(" · ")} />
                </div>
              </GlassCard>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <GlassCard title="Karmic debt numbers">
                <p className="mb-2 text-xs text-muted-foreground">
                  A karmic debt number (13, 14, 16 or 19) shows up when one of your core totals hits that number before it gets reduced.
                  It is not bad luck — it just points to a lesson carried over that this life is asking you to finish.
                </p>
                {report.karmicDebts.length > 0 ? (
                  <div className="text-sm text-pearl">{report.karmicDebts.join(", ")}</div>
                ) : (
                  <div className="text-sm text-muted-foreground">None found in your chart.</div>
                )}
              </GlassCard>
              <GlassCard title="Master numbers">
                <p className="mb-2 text-xs text-muted-foreground">
                  A master number (11, 22 or 33) is a double number that numerology keeps whole instead of reducing further. It means
                  extra intensity in that part of your chart — more potential, and more responsibility to use it well.
                </p>
                {report.masterNumbers.length > 0 ? (
                  <div className="text-sm text-pearl">{report.masterNumbers.join(", ")}</div>
                ) : (
                  <div className="text-sm text-muted-foreground">None found in your chart.</div>
                )}
              </GlassCard>
            </div>
          </div>

          <div className="mt-6">
            <GlassCard title="AI Reading">
              {!aiText && !loading && (
                <button onClick={generate} className="rounded-full bg-gradient-to-r from-gold to-gold-soft px-6 py-2.5 text-sm font-medium text-primary-foreground inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Generate reading
                </button>
              )}
              {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Reading the numbers…</div>}
              {aiText && <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{aiText}</div>}
            </GlassCard>
          </div>
        </>
      )}
    </>
  );
}

function MobileNumerology({ birthDate, setBirthDate }: { birthDate: string; setBirthDate: (s: string) => void }) {
  const [num, setNum] = useState("");
  const analysis = useMemo(() => (num ? analyzeMobile(num) : null), [num]);
  const match = useMemo(() => (num && birthDate ? mobileDobMatch(num, birthDate) : null), [num, birthDate]);
  return (
    <>
      <GlassCard>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Mobile number</span>
            <input value={num} onChange={(e) => setNum(e.target.value)} placeholder="e.g. 9876543210"
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Date of birth</span>
            <DateSelect label="" value={birthDate} onChange={(v) => setBirthDate(v)} />
          </label>
        </div>
      </GlassCard>
      {analysis && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <BigNum label="Reduced" n={analysis.reduced} />
          <BigNum label="Total" n={analysis.total} />
          <GlassCard title="Signature">
            <div className={`text-sm ${analysis.favorable ? "text-emerald-600" : "text-orange-600"}`}>
              {analysis.favorable ? "Favourable vibration" : "Requires balance"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Ruler: {analysis.planetRuler}</div>
            <div className="mt-2 text-sm text-pearl">{analysis.advice}</div>
          </GlassCard>
          <GlassCard title="Digit frequency">
            <div className="grid grid-cols-5 gap-2 text-xs">
              {Object.entries(analysis.digitFrequency).sort().map(([d, c]) => (
                <div key={d} className="rounded-lg bg-white/5 p-2 text-center">
                  <div className="text-muted-foreground">{d}</div>
                  <div className="gold-text">{c}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {match && (
        <div className="mt-6">
          <GlassCard title="Mobile ↔ Date of Birth frequency match">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Match score</div>
                <div className={`font-display text-5xl mt-2 ${
                  match.score >= 80 ? "text-emerald-600" :
                  match.score >= 60 ? "gold-text" :
                  match.score >= 40 ? "text-orange-600" : "text-red-600"
                }`}>{match.score}%</div>
                <div className="mt-2 text-xs text-pearl">{match.verdict}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Mobile vibration</div>
                <div className="font-display text-3xl gold-text mt-1">{match.reducedMobile}</div>
                <div className="text-xs text-muted-foreground">Planet: {match.planetMobile}</div>
                <div className="mt-2 text-[11px] text-muted-foreground">Sum {match.totalMobile}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Life-Path vibration</div>
                <div className="font-display text-3xl gold-text mt-1">{match.conductorDob}</div>
                <div className="text-xs text-muted-foreground">Planet: {match.planetDob}</div>
                <div className="mt-2 text-[11px] text-muted-foreground">Driver (Mulank) {match.driverDob}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Digit overlap</div>
                <div className="font-display text-3xl gold-text mt-1">{match.digitOverlap}<span className="text-lg text-muted-foreground">/10</span></div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {match.overlapDigits.map((d) => (
                    <span key={d} className="rounded-full bg-gold/10 border border-gold/30 px-2 py-0.5 text-xs gold-text">{d}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3 text-xs">
              <div className={`rounded-lg px-3 py-2 ${match.matchesLifePath ? "gold-border bg-gold/10 text-pearl" : "bg-white/5 text-muted-foreground"}`}>
                {match.matchesLifePath ? "✓" : "✗"} Reduces to your Life-Path number
              </div>
              <div className={`rounded-lg px-3 py-2 ${match.matchesDriver ? "gold-border bg-gold/10 text-pearl" : "bg-white/5 text-muted-foreground"}`}>
                {match.matchesDriver ? "✓" : "✗"} Reduces to your Driver (Mulank)
              </div>
              <div className={`rounded-lg px-3 py-2 ${match.compatible ? "gold-border bg-gold/10 text-pearl" : "bg-white/5 text-muted-foreground"}`}>
                {match.compatible ? "✓" : "✗"} Planet-compatible with your DOB
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-pearl">{match.advice}</div>
          </GlassCard>
        </div>
      )}
    </>
  );
}


function KundliMatchingNumerology() {
  const [a, setA] = useState({ name: "", date: "1995-06-15" });
  const [b, setB] = useState({ name: "", date: "1994-11-22" });
  const rA = useMemo(() => (a.date ? computeNumerology({ fullName: a.name || "A", birthDate: a.date }) : null), [a]);
  const rB = useMemo(() => (b.date ? computeNumerology({ fullName: b.name || "B", birthDate: b.date }) : null), [b]);
  const compat = useMemo(() => (rA && rB ? numerologyCompatibility(rA.lifePath, rB.lifePath) : null), [rA, rB]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard title="Person A">
          <input value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} placeholder="Name" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl mb-3" />
          <DateSelect label="" value={a.date} onChange={(v) => setA({ ...a, date: v })} />
        </GlassCard>
        <GlassCard title="Person B">
          <input value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} placeholder="Name" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl mb-3" />
          <DateSelect label="" value={b.date} onChange={(v) => setB({ ...b, date: v })} />
        </GlassCard>
      </div>

      {rA && rB && compat && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <BigNum label={a.name || "A"} n={rA.lifePath} />
          <GlassCard>
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Kundli Matching</div>
              <div className="font-display text-5xl gold-text mt-2">{compat.score}%</div>
              <div className="mt-3 text-sm text-pearl">{compat.note}</div>
            </div>
          </GlassCard>
          <BigNum label={b.name || "B"} n={rB.lifePath} />
        </div>
      )}
    </>
  );
}

const NUM_TERMS: Record<string, string> = {
  "Life Path": "life-path",
  Destiny: "destiny",
  "Soul Urge": "soul-urge",
  "Mulank (driver)": "mulank",
  "Bhagyank (destiny)": "bhagyank",
  "Driver (Mulank)": "mulank",
  "Conductor (Bhagyank)": "bhagyank",
};
function BigNum({ label, n }: { label: string; n: number }) {
  const term = NUM_TERMS[label];
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {term ? <Explain term={term}>{label}</Explain> : label}
      </div>
      <div className="mt-2 font-display text-4xl gold-text">{n}</div>
      <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{NUMBER_MEANINGS[n] ?? ""}</div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground text-xs">{k}</span>
      <span className="text-pearl text-right">{v}</span>
    </div>
  );
}

// ── Timeline: Pinnacles with age ranges, Personal-Year 9-year forecast, Karmic map.
function TimelineNumerology({
  fullName, birthDate, system,
}: { fullName: string; birthDate: string; system: "Pythagorean" | "Chaldean" }) {
  const report = useMemo(() => {
    if (!fullName || !birthDate) return null;
    return computeNumerology({ fullName, birthDate }, system);
  }, [fullName, birthDate, system]);

  if (!report) {
    return (
      <GlassCard>
        <div className="text-sm text-muted-foreground">
          Enter your name and date of birth in the <span className="text-pearl">Personal</span> tab first.
        </div>
      </GlassCard>
    );
  }

  const digitsSum = (n: number) => String(n).split("").reduce((s, c) => s + Number(c), 0);
  const reduce = (n: number) => { let x = n; while (x > 9 && ![11, 22, 33].includes(x)) x = digitsSum(x); return x; };

  // Pinnacle age ranges (classical): P1 = 0 → (36 − lifePath), then 9 years each, P4 = rest of life.
  const lp = report.lifePath;
  const firstEnd = Math.max(30, 36 - (lp > 9 ? reduce(lp) : lp));
  const ranges = [
    { label: "Pinnacle 1", from: 0, to: firstEnd, n: report.pinnacles[0] },
    { label: "Pinnacle 2", from: firstEnd, to: firstEnd + 9, n: report.pinnacles[1] },
    { label: "Pinnacle 3", from: firstEnd + 9, to: firstEnd + 18, n: report.pinnacles[2] },
    { label: "Pinnacle 4", from: firstEnd + 18, to: 99, n: report.pinnacles[3] },
  ];
  const challenges = [
    { label: "Challenge 1", from: 0, to: firstEnd, n: report.challenges[0] },
    { label: "Challenge 2", from: firstEnd, to: firstEnd + 9, n: report.challenges[1] },
    { label: "Challenge 3", from: firstEnd + 9, to: firstEnd + 18, n: report.challenges[2] },
    { label: "Challenge 4", from: firstEnd + 18, to: 99, n: report.challenges[3] },
  ];

  // Personal-Year cycle: forecast next 9 years from now.
  const [, m, d] = birthDate.split("-").map(Number);
  const nowYear = new Date().getFullYear();
  const py = (y: number) => {
    const raw = digitsSum(m) + digitsSum(d) + digitsSum(y);
    return reduce(raw);
  };
  const years = Array.from({ length: 9 }, (_, i) => ({ year: nowYear + i, n: py(nowYear + i) }));

  // Current age
  const birthY = Number(birthDate.split("-")[0]);
  const age = nowYear - birthY;

  return (
    <>
      <GlassCard title="Life pinnacles & challenges">
        <div className="text-xs text-muted-foreground mb-4">
          Four grand cycles rule your life. Each pinnacle brings a keynote; each challenge, a shadow lesson.
          You are currently <span className="text-pearl">~{age} years old</span>.
        </div>
        <div className="space-y-3">
          {ranges.map((r, i) => {
            const c = challenges[i];
            const active = age >= r.from && age < r.to;
            return (
              <div key={r.label} className={`rounded-2xl p-4 ${active ? "gold-border bg-gold/10" : "bg-white/5"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.label}</div>
                    <div className="text-sm text-pearl">Age {r.from} – {r.to === 99 ? "∞" : r.to}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-3xl gold-text">{r.n}</div>
                    <div className="text-[10px] text-red-300">Challenge {c.n}</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                  {NUMBER_MEANINGS[r.n] ?? ""}
                </div>
                {active && <div className="mt-2 text-[10px] uppercase tracking-widest gold-text">Current phase</div>}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <div className="mt-6">
        <GlassCard title="Personal-year forecast — next 9 years">
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
            {years.map((y, i) => (
              <div key={y.year} className={`rounded-xl p-3 text-center ${i === 0 ? "gold-border bg-gold/15" : "bg-white/5"}`}>
                <div className="text-[10px] text-muted-foreground">{y.year}</div>
                <div className="font-display text-2xl gold-text mt-1">{y.n}</div>
                <div className="text-[9px] text-muted-foreground line-clamp-2 mt-1">
                  {(NUMBER_MEANINGS[y.n] ?? "").split(".")[0]}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground">
            A 9-year Epicycle: 1 = seed · 2 = partnering · 3 = expression · 4 = building · 5 = change ·
            6 = responsibility · 7 = introspection · 8 = harvest · 9 = release.
          </div>
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GlassCard title="Karmic map">
          {report.karmicDebts.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {report.karmicDebts.map((k) => (
                <li key={k} className="rounded-xl bg-white/5 p-3">
                  <div className="font-display text-2xl text-red-300">{k}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {k === 13 && "Debt of hard work — no shortcuts. Discipline is the doorway."}
                    {k === 14 && "Debt of freedom & excess — moderation transforms the pattern."}
                    {k === 16 && "Debt of ego — humility rebuilds what pride destroyed."}
                    {k === 19 && "Debt of self-sufficiency — receive help, honour interdependence."}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">No karmic debt numbers found. Karma flows freely.</div>
          )}
        </GlassCard>
        <GlassCard title="Master vibrations">
          {report.masterNumbers.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {report.masterNumbers.map((k) => (
                <li key={k} className="rounded-xl bg-white/5 p-3">
                  <div className="font-display text-2xl gold-text">{k}</div>
                  <div className="text-xs text-muted-foreground mt-1">{NUMBER_MEANINGS[k]}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">No master numbers active in the core chart.</div>
          )}
        </GlassCard>
      </div>
    </>
  );
}


// ═══════════════════════════════════════════════════════════════════
// VEDIC NUMEROLOGY (Mulank / Bhagyank / Namank) + advanced Lo Shu
// ═══════════════════════════════════════════════════════════════════
function VedicTab({
  fullName, setFullName, birthDate, setBirthDate,
}: {
  fullName: string; setFullName: (s: string) => void;
  birthDate: string; setBirthDate: (s: string) => void;
}) {
  const v = useMemo(() => {
    if (!birthDate) return null;
    try { return vedicNumerology(birthDate, fullName); } catch { return null; }
  }, [birthDate, fullName]);
  const adv = useMemo(() => {
    if (!birthDate) return null;
    try { return loShuAdvanced(birthDate); } catch { return null; }
  }, [birthDate]);

  const relWord = (r: string | null) =>
    r === "friend" ? "get along well" : r === "enemy" ? "pull apart" : "are neutral";

  return (
    <>
      <GlassCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Full name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name as you use it"
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-pearl focus:outline-none focus:border-gold/50"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Date of birth</span>
            <DateSelect label="" value={birthDate} onChange={(val) => setBirthDate(val)} />
          </label>
        </div>
      </GlassCard>

      {v && (
        <>
          <div className="mt-6">
            <GlassCard>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Your simple result</div>
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <span className="font-display text-5xl gold-text">{v.mulank}</span>
                <span className="text-lg text-pearl">is your driver number (Mulank)</span>
              </div>
              <p className="mt-2 text-sm text-pearl/90">
                This comes straight from the day you were born, and it is the number Vedic numerology uses most for everyday personality.
                In plain words: {v.mulankProfile.nature}
              </p>
            </GlassCard>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BigNum label="Mulank (driver)" n={v.mulank} />
            <BigNum label="Bhagyank (destiny)" n={v.bhagyank} />
            {v.namank != null && <BigNum label="Namank (name)" n={v.namank} />}
            <BigNum label="This year" n={v.personalYear} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <GlassCard title="Who you are">
              <KV k={`Mulank ${v.mulank}`} v={`${v.mulankProfile.planet} — ${v.mulankProfile.nature}`} />
              <KV k={`Bhagyank ${v.bhagyank}`} v={`${v.bhagyankProfile.planet} — ${v.bhagyankProfile.nature}`} />
              {v.namankProfile && v.namank != null && (
                <KV k={`Namank ${v.namank}`} v={`${v.namankProfile.planet} — ${v.namankProfile.nature}`} />
              )}
              <KV k="Good work for you" v={v.mulankProfile.career} />
              <KV k="Watch out for" v={v.mulankProfile.caution} />
              <KV k="This year" v={v.yearNote} />
            </GlassCard>

            <GlassCard title="Do your numbers agree?">
              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gold/70" style={{ width: `${v.harmony.score}%` }} />
              </div>
              <KV k="Driver and destiny" v={`They ${relWord(v.harmony.mulankBhagyank)}.`} />
              {v.harmony.mulankNamank && (
                <KV k="Driver and name" v={`They ${relWord(v.harmony.mulankNamank)}.`} />
              )}
              {v.harmony.bhagyankNamank && (
                <KV k="Destiny and name" v={`They ${relWord(v.harmony.bhagyankNamank)}.`} />
              )}
              <p className="mt-2 text-sm text-pearl/90">{v.harmony.note}</p>
            </GlassCard>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <GlassCard title="Lucky for you">
              <KV k="Days" v={v.luckyDays.join(", ")} />
              <KV k="Colours" v={v.luckyColors.join(", ")} />
              <KV k="Numbers" v={v.luckyNumbers.join(", ")} />
              <KV k="Numbers to go slow with" v={v.avoidNumbers.join(", ") || "None"} />
              <KV k="Stones" v={v.gems.join(", ")} />
              <KV k="Simple chant" v={v.mantras.join(" · ")} />
              <KV k="Helpful direction" v={`${v.mulankProfile.direction} (driver), ${v.bhagyankProfile.direction} (destiny)`} />
            </GlassCard>
            <GlassCard title="Friend, neutral and difficult numbers">
              {[v.mulank, v.bhagyank].map((n, i) => {
                const sets = relationSets(n);
                return (
                  <div key={`${n}-${i}`} className="mb-3 rounded-xl bg-white/5 p-3 text-xs">
                    <div className="font-display text-base gold-text">{i === 0 ? "Mulank" : "Bhagyank"} {n}</div>
                    <div className="mt-1 text-emerald-300">Friends: {sets.friends.join(", ")}</div>
                    <div className="text-muted-foreground">Neutral: {sets.neutral.join(", ") || "None"}</div>
                    <div className="text-red-300">Difficult: {sets.enemies.join(", ") || "None"}</div>
                  </div>
                );
              })}
            </GlassCard>
          </div>
        </>
      )}

      {adv && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <GlassCard title="What your grid says">
            <p className="text-sm text-pearl/90">{adv.summary}</p>
            {adv.arrowNotes.length > 0 && (
              <div className="mt-3 space-y-2">
                {adv.arrowNotes.map((a) => (
                  <div key={`${a.key}-${a.kind}`} className="rounded-lg bg-white/5 px-3 py-2 text-xs">
                    <span className={a.kind === "strength" ? "gold-text" : "text-red-300"}>
                      {a.kind === "strength" ? "Strong" : "Weak"}
                    </span>{" "}
                    <span className="capitalize text-pearl">{a.key}</span>
                    <div className="mt-1 text-muted-foreground">{a.note}</div>
                  </div>
                ))}
              </div>
            )}
            {adv.excess.length > 0 && (
              <div className="mt-3 space-y-2">
                {adv.excess.map((e) => (
                  <div key={e.number} className="rounded-lg bg-white/5 px-3 py-2 text-xs">
                    <span className="gold-text">{e.number} × {e.count}</span>
                    <div className="mt-1 text-muted-foreground">{e.note}</div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
          <GlassCard title="Easy things that help">
            {adv.remedies.length === 0 ? (
              <p className="text-sm text-emerald-300">Nothing is missing in your grid.</p>
            ) : (
              <div className="space-y-2">
                {adv.remedies.map((r) => (
                  <div key={r.number} className="rounded-lg bg-white/5 px-3 py-2 text-xs">
                    <div className="gold-text">{r.number} — {r.planet}</div>
                    <div className="mt-1 text-pearl/90">{r.remedy}</div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LO SHU GRID
// ═══════════════════════════════════════════════════════════════════
function LoShuTab({ birthDate, setBirthDate }: { birthDate: string; setBirthDate: (s: string) => void }) {
  const grid = useMemo(() => {
    if (!birthDate) return null;
    try { return loShuGrid(birthDate); } catch { return null; }
  }, [birthDate]);
  // Traditional Lo Shu square positions
  const layout: number[][] = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
  return (
    <>
      <GlassCard>
        <label className="block max-w-xs">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Date of birth</span>
          <DateSelect label="" value={birthDate} onChange={(v) => setBirthDate(v)} />
        </label>
      </GlassCard>
      {grid && (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <BigNum label="Driver (Mulank)" n={grid.driver} />
            <BigNum label="Conductor (Bhagyank)" n={grid.conductor} />
            <GlassCard title="Karmic signature">
              <div className="text-xs text-muted-foreground">Missing numbers</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {grid.missing.length === 0
                  ? <span className="text-sm text-emerald-300">Complete grid — rare & blessed.</span>
                  : grid.missing.map((n) => (
                      <span key={n} className="rounded-full bg-red-500/10 border border-red-400/30 px-2 py-0.5 text-xs text-red-200">{n}</span>
                    ))}
              </div>
              {grid.strong.length > 0 && (
                <>
                  <div className="mt-3 text-xs text-muted-foreground">Amplified</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {grid.strong.map((n) => (
                      <span key={n} className="rounded-full bg-gold/10 border border-gold/30 px-2 py-0.5 text-xs gold-text">{n}</span>
                    ))}
                  </div>
                </>
              )}
            </GlassCard>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <GlassCard title="Lo Shu magic square" desc="Tap the title terms to see how the grid is built.">
              <div className="mb-2 text-xs"><Explain term="loshu">How is this grid made?</Explain></div>
              <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
                {layout.flat().map((n) => {
                  const c = grid.counts[n] ?? 0;
                  return (
                    <div key={n} className={`aspect-square rounded-xl flex flex-col items-center justify-center ${c === 0 ? "bg-white/5 border border-dashed border-white/10" : "gold-border bg-gold/10"}`}>
                      <div className="text-[10px] text-muted-foreground">{n}</div>
                      <div className="font-display text-2xl gold-text">
                        {c > 0 ? String(n).repeat(c) : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
            <GlassCard title="Planes (arrows)">
              <div className="mb-3 flex flex-wrap gap-2 text-[10px]">
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
                  {grid.arrows.strengths.length} strength arrow(s)
                </span>
                <span className="rounded-full border border-red-400/40 bg-red-500/10 px-2 py-0.5 text-red-200">
                  {grid.arrows.weaknesses.length} weakness arrow(s)
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {Object.entries(grid.planes).map(([key, p]) => (
                  <div key={key} className="rounded-lg bg-white/5 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="capitalize text-pearl">{key}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{p.line.join(" – ")}</span>
                        {p.strength ? (
                          <span className="gold-text">↑ strength</span>
                        ) : p.weakness ? (
                          <span className="text-red-300">↓ weakness</span>
                        ) : (
                          <span className="text-muted-foreground">{p.present}/3</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{p.label}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="mt-6">
            <GlassCard title="Number-by-number interpretation">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {grid.interpretation.map((r) => (
                  <div key={r.number} className="rounded-xl bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-display text-lg gold-text">{r.number}</div>
                      <div className={`text-[10px] uppercase tracking-widest ${
                        r.strength === "missing" ? "text-red-300" :
                        r.strength === "strong"  ? "gold-text" :
                        r.strength === "balanced"? "text-emerald-300" : "text-muted-foreground"
                      }`}>{r.strength}</div>
                    </div>
                    <div className="mt-1 text-xs text-pearl">{r.note}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NINE STAR KI
// ═══════════════════════════════════════════════════════════════════
function NineStarKiTab({ birthDate, setBirthDate }: { birthDate: string; setBirthDate: (s: string) => void }) {
  const ki = useMemo(() => (birthDate ? nineStarKi(birthDate) : null), [birthDate]);
  return (
    <>
      <GlassCard>
        <label className="block max-w-xs">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Date of birth</span>
          <DateSelect label="" value={birthDate} onChange={(v) => setBirthDate(v)} />
        </label>
      </GlassCard>
      {ki && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <GlassCard title="Principal (Year)">
            <div className="font-display text-5xl gold-text">{ki.principal}</div>
            <div className="mt-2 text-sm text-pearl">{ki.element} · {ki.direction} · {ki.season}</div>
            <div className="mt-2 text-xs text-muted-foreground">{ki.yearNote}</div>
          </GlassCard>
          <GlassCard title="Character (Month)">
            <div className="font-display text-5xl gold-text">{ki.character}</div>
            <div className="mt-2 text-xs text-muted-foreground">Your inner emotional signature — the way you process feelings and act under stress.</div>
          </GlassCard>
          <GlassCard title="Energetic (This year)">
            <div className="font-display text-5xl gold-text">{ki.energetic}</div>
            <div className="mt-2 text-xs text-muted-foreground">The prevailing cosmic climate for the current solar year.</div>
          </GlassCard>
          <GlassCard title="Reading">
            <div className="text-sm text-pearl">{ki.personality}</div>
          </GlassCard>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// KABBALAH
// ═══════════════════════════════════════════════════════════════════
function KabbalahTab({ fullName, setFullName }: { fullName: string; setFullName: (s: string) => void }) {
  const k = useMemo(() => (fullName ? kabbalah(fullName) : null), [fullName]);
  return (
    <>
      <GlassCard>
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Full name</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your used name"
            className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50" />
        </label>
      </GlassCard>
      {k && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <BigNum label="Kabbalah value" n={k.value} />
          <BigNum label="Tree path (0–21)" n={k.path} />
          <GlassCard title={k.name}>
            <div className="text-sm text-pearl">{k.meaning}</div>
            <div className="mt-2 text-xs text-muted-foreground">Path {k.path} of the 22 Major Arcana of the Tree of Life — the archetypal current shaping this incarnation.</div>
          </GlassCard>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ESSENCE & LIFE CYCLES
// ═══════════════════════════════════════════════════════════════════
function EssenceTab({ fullName, birthDate }: { fullName: string; birthDate: string }) {
  const rows = useMemo(() => (fullName && birthDate ? essenceTimeline(fullName, birthDate, 20) : []), [fullName, birthDate]);
  const cyc = useMemo(() => (birthDate ? lifeCycles(birthDate) : null), [birthDate]);
  const nowY = new Date().getFullYear();
  if (!fullName || !birthDate) {
    return (
      <GlassCard>
        <div className="text-sm text-muted-foreground">Enter your name and date of birth in the <span className="text-pearl">Personal</span> tab first.</div>
      </GlassCard>
    );
  }
  return (
    <>
      {cyc && (
        <GlassCard title="Life Cycles">
          <div className="grid gap-3 md:grid-cols-3">
            {(["formative","productive","harvest"] as const).map((k) => {
              const c = cyc[k];
              return (
                <div key={k} className="rounded-xl bg-white/5 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
                  <div className="mt-1 text-sm text-pearl">Age {c.from} – {c.to === 99 ? "∞" : c.to}</div>
                  <div className="font-display text-3xl gold-text mt-1">{c.n}</div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{NUMBER_MEANINGS[c.n] ?? ""}</div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
      <div className="mt-6">
        <GlassCard title="Essence & letter transits — next 20 years">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="text-left py-2">Year</th>
                  <th className="text-left">Age</th>
                  <th className="text-left">Active letters</th>
                  <th className="text-right">Essence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.year} className={`border-t border-white/5 ${r.year === nowY ? "bg-gold/10" : ""}`}>
                    <td className="py-2 text-pearl">{r.year}</td>
                    <td className="text-muted-foreground">{r.age}</td>
                    <td className="tracking-widest text-pearl">{r.letters.join(" · ")}</td>
                    <td className="text-right font-display text-lg gold-text">{r.essence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NAME ANALYSIS — hidden passion, karmic lessons, balance, sub-conscious
// ═══════════════════════════════════════════════════════════════════
function NameAnalysisTab({
  fullName, setFullName, birthDate,
}: { fullName: string; setFullName: (s: string) => void; birthDate: string }) {
  const a = useMemo(() => (fullName ? analyseName(fullName) : null), [fullName]);
  const spelling = useMemo(() => (fullName ? spellingCheck(fullName) : null), [fullName]);
  const deep = useMemo(() => (fullName ? nameDeepMeaning(fullName) : null), [fullName]);
  const miss = useMemo(() => (fullName ? missingAlphabets(fullName) : null), [fullName]);
  const lifePath = useMemo(
    () => (birthDate ? computeNumerology({ fullName: fullName || "X", birthDate }).lifePath : 0),
    [fullName, birthDate],
  );
  const variants = useMemo(
    () => (fullName && birthDate ? spellingVariants(fullName, birthDate, lifePath) : []),
    [fullName, birthDate, lifePath],
  );

  return (
    <>
      <GlassCard>
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Full name</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your used name"
            className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50" />
        </label>
      </GlassCard>

      {a && (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <GlassCard title="Hidden passion">
              <div className="font-display text-3xl gold-text">{a.hiddenPassion.join(" · ") || "—"}</div>
              <div className="mt-1 text-xs text-muted-foreground">Most-repeated numbers in your name — your innate talents.</div>
            </GlassCard>
            <GlassCard title="Karmic lessons">
              <div className="font-display text-3xl text-red-600">{a.karmicLessons.join(" · ") || "None"}</div>
              <div className="mt-1 text-xs text-muted-foreground">Digits absent from your name — soul lessons to master.</div>
            </GlassCard>
            <GlassCard title="Balance number">
              <div className="font-display text-3xl gold-text">{a.balance}</div>
              <div className="mt-1 text-xs text-muted-foreground">How you regain composure under emotional stress.</div>
            </GlassCard>
            <GlassCard title="Sub-conscious self">
              <div className="font-display text-3xl gold-text">{a.subconsciousSelf}<span className="text-lg text-muted-foreground">/9</span></div>
              <div className="mt-1 text-xs text-muted-foreground">Your instinctive capacity in crisis.</div>
            </GlassCard>
          </div>

          <div className="mt-6">
            <GlassCard title="Digit frequency in name">
              <div className="grid grid-cols-9 gap-2 text-center">
                {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
                  const c = a.frequency[n] ?? 0;
                  return (
                    <div key={n} className={`rounded-xl p-3 ${c === 0 ? "bg-red-500/5 border border-red-400/30" : "bg-white/5"}`}>
                      <div className="text-[10px] text-muted-foreground">{n}</div>
                      <div className={`font-display text-2xl mt-1 ${c === 0 ? "text-red-600" : "gold-text"}`}>{c}</div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        </>
      )}

      {spelling && (
        <div className="mt-6">
          <GlassCard title="Spelling checker">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Destiny (Expression)</div>
                <div className="font-display text-4xl gold-text mt-1">{spelling.destiny}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Soul Urge (Vowels)</div>
                <div className="font-display text-4xl gold-text mt-1">{spelling.soulUrge}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Vowel sum {spelling.vowelSum}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Personality (Consonants)</div>
                <div className="font-display text-4xl gold-text mt-1">{spelling.personality}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Consonant sum {spelling.consonantSum}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Letter values</div>
              <div className="flex flex-wrap gap-1.5">
                {spelling.letterValues.map((l, i) => (
                  <div key={i} className={`w-10 h-12 rounded-md flex flex-col items-center justify-center text-xs ${l.vowel ? "gold-border bg-gold/10" : "bg-white/5 border border-white/10"}`}>
                    <div className="font-display text-base text-pearl">{l.letter}</div>
                    <div className="gold-text text-[10px]">{l.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-pearl list-disc list-inside">
              {spelling.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </GlassCard>
        </div>
      )}

      {variants.length > 0 && (
        <div className="mt-6">
          <GlassCard title={`Spelling variants — aligned to Life-Path ${lifePath}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="text-left py-2">Spelling</th>
                    <th className="text-right">Destiny</th>
                    <th className="text-right">Soul Urge</th>
                    <th className="text-right">Personality</th>
                    <th className="text-right">Alignment</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.spelling} className={`border-t border-white/10 ${v.matchesTarget ? "bg-gold/10" : ""}`}>
                      <td className="py-2 text-pearl font-display text-base">{v.spelling}</td>
                      <td className="text-right gold-text">{v.destiny}</td>
                      <td className="text-right">{v.soulUrge}</td>
                      <td className="text-right">{v.personality}</td>
                      <td className={`text-right ${v.matchesTarget ? "text-emerald-600 font-medium" : "text-muted-foreground"}`}>{v.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">
              Simple respectful transformations only (extra vowel, drop trailing H/A, Y↔I swap). Try each spelling aloud — the one that feels most like you and resonates numerically is the correct choice.
            </div>
          </GlassCard>
        </div>
      )}

      {miss && (
        <div className="mt-6">
          <GlassCard title="Missing alphabets in your name">
            <div className="grid gap-3 md:grid-cols-3">
              {[1,2,3,4,5,6,7,8,9].map((d) => {
                const present = !miss.missingDigits.includes(d);
                const letters = ["A","B","C","D","E","F","G","H","I"].slice(0); // just for structure
                void letters;
                const group = ({1:["A","J","S"],2:["B","K","T"],3:["C","L","U"],4:["D","M","V"],5:["E","N","W"],6:["F","O","X"],7:["G","P","Y"],8:["H","Q","Z"],9:["I","R"]} as Record<number,string[]>)[d];
                return (
                  <div key={d} className={`rounded-xl p-3 ${present ? "bg-white/5" : "bg-red-500/5 border border-red-400/30"}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-display text-2xl gold-text">{d}</div>
                      <div className={`text-[10px] uppercase tracking-widest ${present ? "text-emerald-600" : "text-red-600"}`}>{present ? "Present" : "Missing"}</div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {group.map((L) => {
                        const has = miss.presentLetters.includes(L);
                        return (
                          <span key={L} className={`rounded-md px-2 py-0.5 text-xs ${has ? "gold-border bg-gold/10 gold-text" : "bg-white/5 text-muted-foreground line-through"}`}>{L}</span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-sm text-pearl">{miss.guidance}</div>
          </GlassCard>
        </div>
      )}

      {deep && (
        <div className="mt-6">
          <GlassCard title="Deeper meaning of your name">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Cornerstone (first letter)</div>
                <div className="font-display text-4xl gold-text mt-1">{deep.cornerstone.letter}</div>
                <div className="text-xs text-pearl mt-2">{deep.cornerstone.meaning}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Capstone (last letter)</div>
                <div className="font-display text-4xl gold-text mt-1">{deep.capstone.letter}</div>
                <div className="text-xs text-pearl mt-2">{deep.capstone.meaning}</div>
              </div>
              {deep.firstVowel && (
                <div className="rounded-xl bg-white/5 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">First vowel (inner drive)</div>
                  <div className="font-display text-4xl gold-text mt-1">{deep.firstVowel.letter}</div>
                  <div className="text-xs text-pearl mt-2">{deep.firstVowel.meaning}</div>
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Letter-by-letter</div>
              <div className="grid gap-2 md:grid-cols-2">
                {deep.letterBreakdown.map((l) => (
                  <div key={l.letter} className="rounded-lg bg-white/5 p-3 text-xs">
                    <span className="font-display text-lg gold-text mr-2">{l.letter}</span>
                    <span className="text-pearl">{l.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
}

