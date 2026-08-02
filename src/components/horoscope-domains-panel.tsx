import { useMemo, useState } from "react";
import { GlassCard } from "@/components/page-shell";
import {
  buildSignReading, chineseDomainReadings, numeroscopeDay,
  type DomainReading, type Period, type ChineseDomainReading,
} from "@/lib/horoscope-domains";
import { ChevronRight, TrendingUp, Minus, TriangleAlert, Sparkles } from "lucide-react";

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function TrendIcon({ trend }: { trend: DomainReading["trend"] }) {
  if (trend === "Rising") return <TrendingUp className="w-4 h-4 text-emerald-300" />;
  if (trend === "Testing") return <TriangleAlert className="w-4 h-4 text-amber-300" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function Row({ label, text }: { label: string; text: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[112px_1fr]">
      <div className="text-[11px] uppercase tracking-widest text-gold/80">{label}</div>
      <p className="text-[15px] leading-relaxed text-pearl/90">{text}</p>
    </div>
  );
}

function DomainAccordion({ d }: { d: DomainReading }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left min-h-[52px]"
      >
        <ChevronRight className={`w-4 h-4 shrink-0 text-gold transition-transform ${open ? "rotate-90" : ""}`} />
        <TrendIcon trend={d.trend} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-base text-pearl">{d.domain}</span>
            <span className="text-xs text-muted-foreground">{d.score}% · {d.trend}</span>
          </div>
          <div className="mt-1"><ScoreBar value={d.score} /></div>
          <div className="mt-1 text-xs text-muted-foreground truncate">{d.headline}</div>
        </div>
      </button>
      {open && (
        <div className="space-y-3 border-t border-white/10 px-4 py-4">
          <Row label="What" text={d.what} />
          <Row label="Why" text={d.why} />
          <Row label="How" text={d.how} />
          <Row label="When" text={d.when} />
          <Row label="Watch" text={d.watch} />
          {d.drivers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {d.drivers.map((p) => (
                <span key={p.planet} className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-gold">
                  {p.planet}{p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? " retrograde" : ""} · {p.sign} · house {p.house}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SignDomainPanel({
  signIndex, system, period, now,
}: { signIndex: number; system: "western" | "vedic"; period: Period; now: Date }) {
  const reading = useMemo(() => buildSignReading(signIndex, system, period, now), [signIndex, system, period, now]);
  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {period} · {system === "vedic" ? "Moon sign reading" : "Sun sign reading"} · {reading.windowLabel}
            </div>
            <h2 className="font-display text-3xl gold-text mt-1">{reading.sign}</h2>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Overall</div>
            <div className="font-display text-2xl text-pearl">{reading.overall}%</div>
          </div>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-pearl/90">{reading.summary}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-5 text-xs">
          {[["Number", String(reading.lucky.number)], ["Colour", reading.lucky.colour], ["Direction", reading.lucky.direction], ["Best day", reading.lucky.day], ["Gemstone", reading.lucky.gemstone]].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-white/10 p-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
              <div className="text-pearl mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="space-y-2">
        {reading.domains.map((d) => <DomainAccordion key={d.domain} d={d} />)}
      </div>

      <GlassCard title="Planetary positions used for this reading">
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 text-xs">
          {reading.placements.map((p) => (
            <div key={p.planet} className="rounded-lg border border-white/10 p-2">
              <div className="text-pearl">{p.planet}{p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? " retrograde" : ""}</div>
              <div className="text-muted-foreground">{p.sign} {p.degreeInSign.toFixed(1)} degrees · house {p.house}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function ChineseDomainCard({ d }: { d: ChineseDomainReading }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full px-4 py-3 text-left min-h-[52px]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-base text-pearl">{d.domain}</span>
          <span className="text-xs text-muted-foreground">{d.score}%</span>
        </div>
        <div className="mt-1"><ScoreBar value={d.score} /></div>
      </button>
      {open && (
        <div className="space-y-3 border-t border-white/10 px-4 py-4">
          <Row label="What" text={d.what} />
          <Row label="Why" text={d.why} />
          <Row label="How" text={d.how} />
          <Row label="When" text={d.when} />
        </div>
      )}
    </div>
  );
}

export function ChineseDomainPanel({
  personAnimal, personElement, yearAnimal, yearElement, relation, year,
}: {
  personAnimal: string; personElement: string; yearAnimal: string; yearElement: string;
  relation: "harmony" | "clash" | "self" | "neutral"; year: number;
}) {
  const readings = useMemo(
    () => chineseDomainReadings(personAnimal, personElement, yearAnimal, yearElement, relation, year),
    [personAnimal, personElement, yearAnimal, yearElement, relation, year],
  );
  return (
    <div className="space-y-2">
      {readings.map((d) => <ChineseDomainCard key={d.domain} d={d} />)}
    </div>
  );
}

export function NumeroscopePanel({ now }: { now: Date }) {
  const [birth, setBirth] = useState("");
  const reading = useMemo(() => numeroscopeDay(birth, now), [birth, now]);
  return (
    <div className="space-y-4">
      <GlassCard title="Numeroscope · daily numbers">
        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2" htmlFor="numero-birth">
          Date of birth (YYYY-MM-DD)
        </label>
        <input
          id="numero-birth"
          type="date"
          value={birth}
          onChange={(e) => setBirth(e.target.value)}
          className="glass rounded-lg px-3 py-2 text-base min-h-[44px]"
        />
        {!reading && <p className="mt-3 text-sm text-muted-foreground">Enter your date of birth to calculate today's personal day cycle.</p>}
      </GlassCard>

      {reading && (
        <>
          <GlassCard>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Personal day · {now.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                </div>
                <h2 className="font-display text-3xl gold-text mt-1">{reading.personalDay} · {reading.ruler}</h2>
                <div className="text-sm text-muted-foreground mt-1">{reading.theme}</div>
              </div>
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-4 text-xs">
              {[["Personal year", reading.personalYear], ["Personal month", reading.personalMonth], ["Personal day", reading.personalDay], ["Universal day", reading.universalDay]].map(([k, v]) => (
                <div key={k as string} className="rounded-lg border border-white/10 p-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k as string}</div>
                  <div className="text-pearl mt-0.5">{v as number}</div>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard>
            <div className="space-y-3">
              <Row label="What" text={reading.what} />
              <Row label="How" text={reading.how} />
              <Row label="Avoid" text={reading.avoid} />
              <Row label="Numbers" text={`Favourable numbers today: ${reading.luckyNumbers.join(", ")}. Favourable colour: ${reading.luckyColour}.`} />
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
