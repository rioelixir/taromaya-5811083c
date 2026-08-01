import { useMemo, useState, lazy, Suspense } from "react";
import { ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { buildNumerologyReport, TRAITS, root, type FullNumerologyReport } from "@/lib/numerology-report";
import { PlainAIText } from "@/components/plain-ai-text";
import { aiReading } from "@/lib/ai-reading.functions";
import { useServerFn } from "@tanstack/react-start";

const LazyGrid = lazy(() => import("@/components/numerology-report-grid"));

function Collapsible({
  title, children, defaultOpen = false,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="font-display text-base sm:text-lg text-pearl">{title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gold transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 space-y-3 text-sm leading-relaxed">{children}</div>}
    </div>
  );
}

function Simple({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-aurora/25 bg-aurora/5 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-widest text-aurora">In simple words</div>
      <p className="mt-1 text-pearl">{text}</p>
    </div>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft"
        style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function NumerologyFullReport({ fullName, birthDate }: { fullName: string; birthDate: string }) {
  const [aiText, setAiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ai = useServerFn(aiReading);

  const report = useMemo<FullNumerologyReport | null>(() => {
    if (!birthDate) return null;
    try {
      return buildNumerologyReport({ fullName, birthDate });
    } catch {
      return null;
    }
  }, [fullName, birthDate]);

  if (!report) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-muted-foreground">
        Add your date of birth (and name, if you want the name numbers) to see the full report.
      </div>
    );
  }

  const lp = report.base.lifePath;
  const t = TRAITS[root(lp)];

  const askAi = async () => {
    setLoading(true); setAiText(null);
    try {
      const res = await ai({
        data: {
          kind: "numerology",
          prompt:
            "Read only the numbers given. Do not invent any calculation. Explain in very simple English for a beginner, " +
            "in one flowing reading: which energies are strongest, which are weakest, where two numbers pull against each other, " +
            "the repeating pattern in this chart, and three practical things to do next.",
          context: JSON.stringify({
            lifePath: report.base.lifePath,
            mulank: report.vedic.mulank,
            bhagyank: report.vedic.bhagyank,
            namank: report.vedic.namank,
            expression: report.base.destiny,
            soulUrge: report.base.soulUrge,
            personality: report.base.personality,
            maturity: report.base.maturity,
            balance: report.balanceNumber,
            karmicDebts: report.karmicDebts,
            karmicLessons: report.karmicLessons,
            missingNumbers: report.missingNumbers,
            hiddenStrengths: report.hiddenStrengths,
            personalYear: report.base.personalYear,
            personalMonth: report.base.personalMonth,
            personalDay: report.base.personalDay,
            pinnacles: report.pinnacles,
            challenges: report.challenges,
            harmony: report.vedic.harmony,
            lucky: report.lucky,
          }),
        },
      });
      setAiText(typeof res === "string" ? res : (res as { text?: string })?.text ?? null);
    } catch (e) {
      setAiText(e instanceof Error ? e.message : "Could not create the reading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="rounded-3xl gold-border bg-gradient-to-br from-gold/10 via-transparent to-transparent p-5">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Your main number</div>
        <div className="mt-1 flex items-end gap-3">
          <div className="font-display text-6xl gold-text leading-none">{lp}</div>
          <div className="pb-1">
            <div className="font-display text-xl text-pearl">{t.keyword}</div>
            <div className="text-xs text-muted-foreground">{t.planet} · {t.element}</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-pearl">{t.eli10}</p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>How well your numbers agree</span><span>{report.confidence.score}%</span>
          </div>
          <div className="mt-1.5"><Bar value={report.confidence.score} /></div>
          <p className="mt-2 text-[11px] text-muted-foreground">{report.confidence.note}</p>
        </div>
      </div>

      {/* Core numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {report.core.map((c) => (
          <div key={c.key} className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{c.label}</div>
            <div className="mt-1 flex items-center gap-2">
              <div className="font-display text-3xl gold-text leading-none">{c.value}</div>
              <div className="text-[11px] text-muted-foreground">{TRAITS[c.root].keyword}<br />{c.planet}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={askAi}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium py-3 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Ask AI to read all my numbers together
      </button>
      {aiText && (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <PlainAIText text={aiText} />
        </div>
      )}

      {/* Detailed meaning per core number */}
      <Collapsible title="Detailed Meaning of Every Number" defaultOpen>
        <div className="space-y-3">
          {report.core.map((c) => (
            <div key={c.key} className="rounded-xl border border-white/10 bg-black/20 p-3.5">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full gold-border font-display text-lg gold-text">{c.value}</span>
                <div>
                  <div className="font-display text-base text-pearl">{c.label}</div>
                  <div className="text-[11px] text-muted-foreground">{c.planet}</div>
                </div>
              </div>
              <p className="mt-2.5 text-muted-foreground">{c.what}</p>
              <p className="mt-1.5 text-muted-foreground"><span className="text-pearl">Why it happens: </span>{c.why}</p>
              <p className="mt-1.5 text-muted-foreground"><span className="text-pearl">How it shapes life: </span>{c.influence}</p>
              {c.master && <p className="mt-1.5 text-gold text-xs">{c.master}</p>}
              <div className="mt-3"><Simple text={c.eli10} /></div>
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <List label="Good side" items={c.positives} tone="good" />
                <List label="Rough side" items={c.negatives} tone="bad" />
                <List label="Hidden strengths" items={c.hidden} tone="good" />
                <List label="What helps" items={c.remedies} tone="neutral" />
              </div>
              <p className="mt-2 text-muted-foreground"><span className="text-pearl">Opportunities: </span>{c.opportunities}</p>
              <p className="mt-1 text-muted-foreground"><span className="text-pearl">Challenge: </span>{c.challenges}</p>
            </div>
          ))}
        </div>
      </Collapsible>

      {/* Sections */}
      {report.sections.map((s) => (
        <Collapsible key={s.id} title={s.title}>
          <Simple text={s.eli10} />
          <p className="text-muted-foreground">{s.expert}</p>
          {s.rows && (
            <div className="rounded-xl border border-white/10 divide-y divide-white/5">
              {s.rows.map((r) => (
                <div key={r.label} className="flex items-start justify-between gap-3 px-3 py-2">
                  <span className="text-muted-foreground text-xs">{r.label}</span>
                  <span className="text-pearl text-right text-xs">{r.value}</span>
                </div>
              ))}
            </div>
          )}
          {s.bullets && (
            <ul className="space-y-1.5">
              {s.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </Collapsible>
      ))}

      {/* Lucky set */}
      <Collapsible title="Lucky Numbers, Colours, Days and More">
        <Simple text="These are the numbers, colours and days that feel easiest for you. Use them for important choices." />
        <div className="grid grid-cols-2 gap-2.5">
          <Fact label="Lucky numbers" value={report.lucky.numbers.join(", ")} />
          <Fact label="Lucky dates" value={report.lucky.dates.join(", ")} />
          <Fact label="Lucky days" value={report.lucky.days.join(", ")} />
          <Fact label="Lucky colours" value={report.lucky.colors.join(", ")} />
          <Fact label="Lucky direction" value={report.lucky.direction} />
          <Fact label="Lucky metal" value={report.lucky.metal} />
          <Fact label="Gemstone" value={report.lucky.gem} />
          <Fact label="Friendly numbers" value={report.lucky.friendly.join(", ")} />
          <Fact label="Neutral numbers" value={report.lucky.neutral.join(", ")} />
          <Fact label="Tricky numbers" value={report.lucky.challenging.join(", ")} />
        </div>
      </Collapsible>

      {/* Timeline cards */}
      <Collapsible title="Life Cycles, Pinnacles and Challenges">
        <Simple text="Life comes in chapters. Each chapter has its own flavour. Here are yours, in order." />
        <div className="space-y-2">
          {report.cycles.map((c) => (
            <Timeline key={c.label} title={`${c.label} · age ${c.from}–${c.to}`} n={c.n} note={c.note} />
          ))}
          {report.pinnacles.map((p) => (
            <Timeline key={p.label} title={`${p.label} · age ${p.from}–${p.to}`} n={p.n} note={p.note} />
          ))}
          {report.challenges.map((c) => (
            <Timeline key={c.label} title={c.label} n={c.n} note={c.note} />
          ))}
        </div>
      </Collapsible>

      {/* Lo Shu grid, lazily loaded */}
      <Collapsible title="Your Number Grid (Lo Shu)">
        <Simple text="This grid shows which numbers you already have plenty of, and which ones are missing." />
        <Suspense fallback={<div className="text-xs text-muted-foreground">Loading grid…</div>}>
          <LazyGrid counts={report.loshu.counts} missing={report.missingNumbers} summary={report.loshu.summary} />
        </Suspense>
      </Collapsible>

      <Collapsible title="How this report was checked">
        <Simple text="We check that all your numbers tell the same story. Here is what we looked at." />
        <ul className="space-y-1.5">
          {report.confidence.factors.map((f, i) => (
            <li key={i} className="text-muted-foreground">· {f}</li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Everything above comes from your own date of birth and name using TAROMAYA's own calculations. The same details always give the same report.
        </p>
      </Collapsible>
    </div>
  );
}

function Timeline({ title, n, note }: { title: string; n: number; note: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full gold-border font-display gold-text">{n}</span>
      <div>
        <div className="text-pearl text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{note}</div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-pearl text-sm">{value || "—"}</div>
    </div>
  );
}

function List({ label, items, tone }: { label: string; items: string[]; tone: "good" | "bad" | "neutral" }) {
  if (!items.length) return null;
  const dot = tone === "good" ? "bg-aurora" : tone === "bad" ? "bg-red-400" : "bg-gold/70";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <ul className="mt-1 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-muted-foreground text-xs">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
