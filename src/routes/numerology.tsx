import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, GlassCard } from "@/components/page-shell";
import {
  computeNumerology, analyzeMobile, numerologyCompatibility, NUMBER_MEANINGS,
} from "@/lib/numerology";
import { aiReading } from "@/lib/ai-reading.functions";
import { Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/numerology")({
  component: () => (<PremiumGate featureName="Numerology"><NumerologyPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Numerology — TAROMAYA" },
      { name: "description", content: "Pythagorean, Chaldean, and Mobile Number numerology with 25+ calculations and AI readings." },
    ],
  }),
});

type Tab = "personal" | "timeline" | "mobile" | "compat";
const TAB_LABEL: Record<Tab, string> = {
  personal: "Personal",
  timeline: "Timeline",
  mobile: "Mobile Number",
  compat: "Compatibility",
};

function NumerologyPage() {
  const [tab, setTab] = useState<Tab>("personal");
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("1995-06-15");
  const [system, setSystem] = useState<"Pythagorean" | "Chaldean">("Pythagorean");
  return (
    <PageShell
      eyebrow="Numerology"
      title="The vibration of numbers"
      subtitle="Pythagorean and Chaldean systems, personal-year timelines, mobile-number analysis, and compatibility."
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
      {tab === "timeline" && (
        <TimelineNumerology fullName={fullName} birthDate={birthDate} system={system} />
      )}
      {tab === "mobile" && <MobileNumerology />}
      {tab === "compat" && <CompatibilityNumerology />}
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
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50" />
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
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <BigNum label="Life Path" n={report.lifePath} />
            <BigNum label="Destiny" n={report.destiny} />
            <BigNum label="Soul Urge" n={report.soulUrge} />
            <BigNum label="Personality" n={report.personality} />
            <BigNum label="Birthday" n={report.birthday} />
            <BigNum label="Maturity" n={report.maturity} />
            <BigNum label="Personal Year" n={report.personalYear} />
            <BigNum label="Personal Day" n={report.personalDay} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <GlassCard title="Pinnacles & Challenges">
              <div className="grid grid-cols-4 gap-3 text-center">
                {report.pinnacles.map((n, i) => (
                  <div key={i} className="rounded-xl bg-white/5 p-3">
                    <div className="text-[10px] text-muted-foreground">P{i + 1}</div>
                    <div className="font-display text-2xl gold-text">{n}</div>
                  </div>
                ))}
                {report.challenges.map((n, i) => (
                  <div key={"c" + i} className="rounded-xl bg-white/5 p-3">
                    <div className="text-[10px] text-muted-foreground">C{i + 1}</div>
                    <div className="font-display text-2xl text-red-300">{n}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard title="Luck signature">
              <div className="space-y-2 text-sm">
                <KV k="Planet" v={report.planetRuler} />
                <KV k="Lucky numbers" v={report.luckyNumbers.join(" · ")} />
                <KV k="Lucky colours" v={report.luckyColors.join(" · ")} />
                <KV k="Lucky days" v={report.luckyDays.join(" · ")} />
                <KV k="Compatible numbers" v={report.compatibleNumbers.join(" · ")} />
                {report.karmicDebts.length > 0 && <KV k="Karmic debts" v={report.karmicDebts.join(", ")} />}
                {report.masterNumbers.length > 0 && <KV k="Master numbers" v={report.masterNumbers.join(", ")} />}
              </div>
            </GlassCard>
          </div>

          <div className="mt-4">
            <GlassCard title="Life Path meaning">
              <div className="font-display text-lg gold-text">{report.lifePath}</div>
              <div className="mt-1 text-sm text-pearl">{NUMBER_MEANINGS[report.lifePath]}</div>
            </GlassCard>
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

function MobileNumerology() {
  const [num, setNum] = useState("");
  const analysis = useMemo(() => (num ? analyzeMobile(num) : null), [num]);
  return (
    <>
      <GlassCard>
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Mobile number</span>
          <input value={num} onChange={(e) => setNum(e.target.value)} placeholder="e.g. 9876543210"
            className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50" />
        </label>
      </GlassCard>
      {analysis && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <BigNum label="Reduced" n={analysis.reduced} />
          <BigNum label="Total" n={analysis.total} />
          <GlassCard title="Signature">
            <div className={`text-sm ${analysis.favorable ? "text-emerald-300" : "text-orange-300"}`}>
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
    </>
  );
}

function CompatibilityNumerology() {
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
          <input type="date" value={a.date} onChange={(e) => setA({ ...a, date: e.target.value })} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl" />
        </GlassCard>
        <GlassCard title="Person B">
          <input value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} placeholder="Name" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl mb-3" />
          <input type="date" value={b.date} onChange={(e) => setB({ ...b, date: e.target.value })} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl" />
        </GlassCard>
      </div>

      {rA && rB && compat && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <BigNum label={a.name || "A"} n={rA.lifePath} />
          <GlassCard>
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Compatibility</div>
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

function BigNum({ label, n }: { label: string; n: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
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

