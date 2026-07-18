import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Play, Pause, RotateCcw, CheckCircle2, Flame } from "lucide-react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { REMEDY_CATALOG, type PlanetKey } from "@/lib/remedies";
import { PLANET_GLYPHS } from "@/lib/vedic";
import { createJournalEntry } from "@/lib/journal.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meditation")({
  component: MeditationPage,
  head: () => ({
    meta: [
      { title: "Mantra Studio — TAROMAYA" },
      { name: "description", content: "Guided breath, planetary beej mantras, and mala counter for daily practice." },
    ],
  }),
});

const PLANETS: PlanetKey[] = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];

const PLANET_COLOR: Record<PlanetKey,string> = {
  Sun:"#f5c66b", Moon:"#e8ecff", Mars:"#ff8080", Mercury:"#9be8ff",
  Jupiter:"#f0b25b", Venus:"#f7b7d1", Saturn:"#c9b9ff", Rahu:"#7fe8c9", Ketu:"#c98bff",
};

// Cycle in seconds: 4 in, 4 hold, 6 out, 2 hold (Sama Vritti-ish, 16s / breath).
const BREATH_PHASES = [
  { label: "Inhale", ms: 4000, scale: 1 },
  { label: "Hold",   ms: 4000, scale: 1 },
  { label: "Exhale", ms: 6000, scale: 0.55 },
  { label: "Hold",   ms: 2000, scale: 0.55 },
];
const CYCLE_MS = BREATH_PHASES.reduce((a,p)=>a+p.ms,0);

function MeditationPage() {
  const [planet, setPlanet] = useState<PlanetKey>("Jupiter");
  const [target, setTarget] = useState<number>(108);
  const [count, setCount] = useState<number>(0);
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const raf = useRef<number>(0);
  const save = useServerFn(createJournalEntry);
  const [saved, setSaved] = useState(false);

  const remedy = REMEDY_CATALOG[planet];

  const tick = useCallback(() => {
    const now = performance.now();
    const dt = now - startRef.current;
    startRef.current = now;
    setElapsed((e) => e + dt);
    raf.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (running) {
      startRef.current = performance.now();
      raf.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(raf.current);
  }, [running, tick]);

  // Determine current phase and increment mantra count each full cycle
  const cyclesRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    const pos = elapsed % CYCLE_MS;
    let acc = 0;
    for (let i = 0; i < BREATH_PHASES.length; i++) {
      acc += BREATH_PHASES[i].ms;
      if (pos < acc) { if (phaseIdx !== i) setPhaseIdx(i); break; }
    }
    const completed = Math.floor(elapsed / CYCLE_MS);
    if (completed > cyclesRef.current) {
      const delta = completed - cyclesRef.current;
      cyclesRef.current = completed;
      setCount((c) => Math.min(target, c + delta));
    }
  }, [elapsed, running, phaseIdx, target]);

  useEffect(() => {
    if (count >= target && running) setRunning(false);
  }, [count, target, running]);

  const reset = () => {
    setRunning(false); setElapsed(0); setPhaseIdx(0); setCount(0);
    cyclesRef.current = 0; setSaved(false);
  };

  const saveSession = async () => {
    try {
      await save({ data: {
        kind: "note",
        title: `Mantra session · ${planet} · ${count}/${target}`,
        body: `Beej: ${remedy.beejMantra}\nDeity: ${remedy.deity}\nCompleted ${count} repetitions.`,
        mood: null,
        tags: ["meditation", planet.toLowerCase()],
        meta: { planet, count, target, mantra: remedy.beejMantra },
      }});
      setSaved(true);
      toast.success("Session saved to Cosmic Journal");
    } catch {
      toast.error("Could not save session");
    }
  };

  const currentPhase = BREATH_PHASES[phaseIdx];
  const progress = count / target;

  return (
    <PageShell
      eyebrow="Mantra Studio"
      title="Breath. Sound. Presence."
      subtitle="Guided pranayama with a planetary beej mantra to soften afflictions and open the day."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <GlassCard>
          <BreathOrb
            color={PLANET_COLOR[planet]}
            glyph={PLANET_GLYPHS[planet]}
            phase={currentPhase.label}
            scale={currentPhase.scale}
            phaseMs={currentPhase.ms}
            running={running}
          />
          <div className="mt-6 text-center">
            <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              Current phase
            </div>
            <div className="mt-1 font-display text-3xl text-pearl">{currentPhase.label}</div>
            <div className="mt-3 font-mono text-xl gold-text">{remedy.beejMantra}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {remedy.deity} · {remedy.beejCount.toLocaleString()} recommended daily
            </div>
          </div>

          {/* Counter ring */}
          <div className="mt-6 mx-auto max-w-md">
            <div className="flex items-baseline justify-between">
              <div className="font-display text-4xl text-pearl">{count}
                <span className="text-lg text-muted-foreground"> / {target}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.floor(elapsed / 1000 / 60)}m {Math.floor((elapsed/1000)%60)}s
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-gold to-galaxy transition-[width] duration-500"
                style={{ width: `${Math.min(100, progress*100)}%` }} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setRunning((r) => !r)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-8px_oklch(0.82_0.13_85/0.5)] transition-transform hover:scale-[1.02]"
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? "Pause" : count > 0 ? "Resume" : "Begin"}
            </button>
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-full glass px-5 py-3 text-sm text-pearl hover:bg-white/10">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            {count > 0 && !saved && (
              <button onClick={saveSession} className="inline-flex items-center gap-2 rounded-full glass px-5 py-3 text-sm text-pearl hover:bg-white/10">
                <CheckCircle2 className="h-4 w-4 text-gold" /> Save session
              </button>
            )}
            {saved && (
              <span className="inline-flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved to Journal
              </span>
            )}
          </div>
        </GlassCard>

        <aside className="flex flex-col gap-4">
          <div className="glass rounded-3xl p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Planet</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {PLANETS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setPlanet(p); reset(); }}
                  className={`rounded-2xl p-3 border transition ${
                    planet === p ? "border-gold/60 bg-gold/10" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="text-2xl" style={{ color: PLANET_COLOR[p] }}>{PLANET_GLYPHS[p]}</div>
                  <div className="mt-1 text-[11px] text-pearl">{p}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Target repetitions</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[27, 54, 108, 216, 324].map((n) => (
                <button
                  key={n}
                  onClick={() => { setTarget(n); reset(); }}
                  className={`rounded-full px-4 py-2 text-xs border ${
                    target === n ? "border-gold/60 bg-gold/10 text-pearl" : "border-white/5 bg-white/[0.02] text-muted-foreground hover:text-pearl"
                  }`}
                >
                  {n} {n === 108 && "· mala"}
                </button>
              ))}
            </div>
            <div className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
              One breath cycle ≈ 16 seconds. A full mala ({target} reps) takes about{" "}
              <span className="text-pearl">{Math.ceil(target * 16 / 60)} minutes</span>.
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-gold" /> Remedy Focus
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <Row k="Day" v={remedy.day} />
              <Row k="Color" v={remedy.color} />
              <Row k="Gem" v={remedy.gemstone.primary} />
              <Row k="Yantra" v={remedy.yantra} />
              <Row k="Charity" v={remedy.charity[0] ?? "—"} />
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-pearl text-right">{v}</span>
    </div>
  );
}

function BreathOrb({
  color, glyph, phase, scale, phaseMs, running,
}: { color: string; glyph: string; phase: string; scale: number; phaseMs: number; running: boolean }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[360px]">
      <div className="absolute inset-0 rounded-full blur-3xl opacity-70"
        style={{ background: `radial-gradient(circle, ${color}55 0%, transparent 60%)` }} />
      <div
        className="absolute inset-0 grid place-items-center rounded-full border transition-transform"
        style={{
          transform: `scale(${scale})`,
          transitionDuration: `${phaseMs}ms`,
          transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
          borderColor: `${color}80`,
          background: `radial-gradient(circle at 30% 30%, ${color}22, transparent 70%)`,
          boxShadow: `0 0 60px ${color}55, inset 0 0 80px ${color}33`,
        }}
      >
        <div className="text-center">
          <div className="font-display text-7xl leading-none" style={{ color }}>{glyph}</div>
          <div className="mt-3 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {running ? phase : "Ready"}
          </div>
        </div>
      </div>
      {/* Rotating aureole */}
      <svg className="absolute inset-0 animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeOpacity="0.15" strokeDasharray="1 3" />
      </svg>
    </div>
  );
}
