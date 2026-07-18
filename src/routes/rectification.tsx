import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { runRectification, type LifeEvent, type EventCategory, type RectificationResult } from "@/lib/rectification";
import { SIGN_NAMES, SIGN_GLYPHS } from "@/lib/western";
import type { BirthInput } from "@/lib/progressions";
import { Plus, Trash2, Sparkles, Loader2, Target } from "lucide-react";

export const Route = createFileRoute("/rectification")({
  component: () => (
    <PremiumGate featureName="Rectification">
      <RectificationPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Rectification Assistant — TAROMAYA" },
      { name: "description", content: "Narrow your birth time by matching dated life events to progressed Ascendant/MC, solar-arc directions and outer-planet transits." },
    ],
  }),
});

const DEFAULT_BIRTH: BirthInput = {
  year: 1995, month: 6, day: 15, hour: 10, minute: 30,
  tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.2090,
};

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "career", label: "Career milestone" },
  { value: "marriage", label: "Marriage / partnership" },
  { value: "childbirth", label: "Child born" },
  { value: "loss", label: "Bereavement / loss" },
  { value: "move", label: "Home move / relocation" },
  { value: "education", label: "Education milestone" },
  { value: "health", label: "Health event" },
  { value: "spiritual", label: "Spiritual awakening" },
];

function uid() { return Math.random().toString(36).slice(2, 9); }

function RectificationPage() {
  const [birth, setBirth] = useState<BirthInput>(DEFAULT_BIRTH);
  const [windowMin, setWindowMin] = useState(60);
  const [stepMin, setStepMin] = useState(4);
  const [events, setEvents] = useState<LifeEvent[]>([
    { id: uid(), category: "career", date: "2018-08-01", label: "First job promotion" },
  ]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RectificationResult | null>(null);

  const addEvent = () => setEvents((es) => [...es, { id: uid(), category: "career", date: "", label: "" }]);
  const removeEvent = (id: string) => setEvents((es) => es.filter((e) => e.id !== id));
  const updateEvent = (id: string, patch: Partial<LifeEvent>) =>
    setEvents((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const validEvents = useMemo(() => events.filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date)), [events]);

  const run = () => {
    if (validEvents.length === 0) return;
    setRunning(true);
    // Yield to paint the loader, then run heavy calc.
    setTimeout(() => {
      try {
        const r = runRectification(birth, validEvents, windowMin, stepMin);
        setResult(r);
      } finally {
        setRunning(false);
      }
    }, 30);
  };

  const maxScore = result?.candidates.reduce((m, c) => Math.max(m, c.score), 0) ?? 1;

  return (
    <PageShell
      eyebrow="Phase 12"
      title="Rectification Assistant"
      subtitle="Not sure about your exact birth minute? Enter your best estimate plus a few dated life events — we'll scan a window of candidate times and rank them by how well progressed angles, solar arcs and outer-planet transits match your history."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <GlassCard title="Approximate birth">
          <div className="grid gap-3 sm:grid-cols-2">
            <NumField label="Year" v={birth.year} onChange={(n) => setBirth({ ...birth, year: n })} />
            <NumField label="Month" v={birth.month} onChange={(n) => setBirth({ ...birth, month: n })} />
            <NumField label="Day" v={birth.day} onChange={(n) => setBirth({ ...birth, day: n })} />
            <NumField label="Hour (24h)" v={birth.hour} onChange={(n) => setBirth({ ...birth, hour: n })} />
            <NumField label="Minute" v={birth.minute} onChange={(n) => setBirth({ ...birth, minute: n })} />
            <NumField label="TZ offset (h)" step={0.25} v={birth.tzOffsetHours} onChange={(n) => setBirth({ ...birth, tzOffsetHours: n })} />
            <NumField label="Latitude" step={0.0001} v={birth.latitude} onChange={(n) => setBirth({ ...birth, latitude: n })} />
            <NumField label="Longitude" step={0.0001} v={birth.longitude} onChange={(n) => setBirth({ ...birth, longitude: n })} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <NumField label="Search window (± minutes)" v={windowMin} onChange={(n) => setWindowMin(Math.max(10, Math.min(180, n)))} />
            <NumField label="Step (minutes)" v={stepMin} onChange={(n) => setStepMin(Math.max(1, Math.min(15, n)))} />
          </div>
        </GlassCard>

        <GlassCard title="Life events">
          <div className="space-y-3">
            {events.map((ev) => (
              <div key={ev.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                  <select
                    value={ev.category}
                    onChange={(e) => updateEvent(ev.id, { category: e.target.value as EventCategory })}
                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-pearl outline-none focus:border-gold/50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} className="bg-background">{c.label}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={ev.date}
                    onChange={(e) => updateEvent(ev.id, { date: e.target.value })}
                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-pearl outline-none focus:border-gold/50"
                  />
                  <input
                    type="text"
                    placeholder="Optional note"
                    value={ev.label ?? ""}
                    onChange={(e) => updateEvent(ev.id, { label: e.target.value })}
                    className="sm:col-span-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-pearl outline-none focus:border-gold/50"
                  />
                </div>
                <button
                  onClick={() => removeEvent(ev.id)}
                  className="self-start text-muted-foreground hover:text-red-300 p-2"
                  aria-label="Remove event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addEvent}
              className="w-full rounded-xl border border-dashed border-white/15 py-2.5 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-pearl inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add event
            </button>
          </div>
        </GlassCard>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={run}
          disabled={running || validEvents.length === 0}
          className="rounded-full bg-gradient-to-r from-gold to-gold-soft px-8 py-3 text-sm font-medium text-primary-foreground inline-flex items-center gap-2 disabled:opacity-40"
        >
          {running ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning candidates…</>
                   : <><Sparkles className="w-4 h-4" /> Rectify birth time</>}
        </button>
      </div>

      {result && result.best && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <GlassCard title="Best-fit birth time">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-3 bg-gold/10 gold-border">
                <Target className="w-5 h-5 text-gold" />
              </div>
              <div>
                <div className="text-2xl font-serif text-pearl">
                  {String(result.best.birth.hour).padStart(2, "0")}:{String(result.best.birth.minute).padStart(2, "0")}
                  <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground">
                    ({result.best.offsetMinutes >= 0 ? "+" : ""}{result.best.offsetMinutes} min vs entered)
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Ascendant: <span className="gold-text">{SIGN_GLYPHS[result.best.ascendantSign]} {SIGN_NAMES[result.best.ascendantSign]}</span> {(result.best.ascendantDeg % 30).toFixed(2)}°
                </div>
                <div className="text-sm text-muted-foreground">
                  Midheaven: <span className="gold-text">{SIGN_GLYPHS[Math.floor(result.best.midheavenDeg / 30)]} {SIGN_NAMES[Math.floor(result.best.midheavenDeg / 30)]}</span> {(result.best.midheavenDeg % 30).toFixed(2)}°
                </div>
                <div className="mt-3 text-xs text-muted-foreground">Score {result.best.score.toFixed(2)}</div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {result.best.perEvent.map((pe) => {
                const ev = validEvents.find((e) => e.id === pe.id)!;
                return (
                  <div key={pe.id} className="rounded-lg bg-white/5 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="text-pearl">
                        {CATEGORIES.find((c) => c.value === ev.category)?.label} · <span className="text-muted-foreground">{ev.date}</span>
                      </div>
                      <div className="gold-text">{pe.score.toFixed(2)}</div>
                    </div>
                    {pe.hits.length > 0 && (
                      <ul className="mt-2 text-muted-foreground space-y-0.5">
                        {pe.hits.map((h, i) => <li key={i}>• {h}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard title={`Candidate spectrum (${result.candidates.length} times)`}>
            <div className="space-y-1.5">
              {result.candidates.map((c) => {
                const pct = maxScore > 0 ? (c.score / maxScore) * 100 : 0;
                const isBest = c.offsetMinutes === result.best!.offsetMinutes;
                const isZero = c.offsetMinutes === 0;
                return (
                  <div key={c.offsetMinutes} className="flex items-center gap-3 text-[11px]">
                    <div className={`w-14 text-right tabular-nums ${isBest ? "gold-text" : "text-muted-foreground"}`}>
                      {c.offsetMinutes >= 0 ? "+" : ""}{c.offsetMinutes}m
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden relative">
                      <div
                        className={`h-full ${isBest ? "bg-gradient-to-r from-gold to-gold-soft" : "bg-white/25"}`}
                        style={{ width: `${pct}%` }}
                      />
                      {isZero && <div className="absolute inset-y-0 left-0 w-px bg-cyan-300/60" />}
                    </div>
                    <div className="w-16 text-right text-muted-foreground tabular-nums">
                      {SIGN_GLYPHS[c.ascendantSign]} {(c.ascendantDeg % 30).toFixed(1)}°
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-4 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-gold" /> best fit</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 bg-cyan-300" /> entered time</span>
            </div>
          </GlassCard>
        </div>
      )}

      {result && !result.best && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Add at least one dated life event to score candidates.
        </div>
      )}
    </PageShell>
  );
}

function NumField({ label, v, onChange, step = 1 }: { label: string; v: number; onChange: (n: number) => void; step?: number }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type="number"
        step={step}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50"
      />
    </label>
  );
}
