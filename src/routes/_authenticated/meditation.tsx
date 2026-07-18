import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Play, Pause, RotateCcw, CheckCircle2, Flame, Volume2, VolumeX,
  Sparkles, Save, Trash2, Waves, CloudRain, Music,
} from "lucide-react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { REMEDY_CATALOG, type PlanetKey } from "@/lib/remedies";
import { PLANET_GLYPHS } from "@/lib/vedic";
import { createJournalEntry } from "@/lib/journal.functions";
import {
  listMeditationPresets, saveMeditationPreset, deleteMeditationPreset,
  type MeditationPreset,
} from "@/lib/meditation.functions";
import {
  setAmbient, setAmbientVolume, setMasterVolume, bell, speak, cancelSpeech,
  teardownAudio, type AmbientKind,
} from "@/lib/mantra-audio";
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

const AMBIENTS: { key: AmbientKind; label: string; icon: any }[] = [
  { key: "off",    label: "Silence",   icon: VolumeX },
  { key: "drone",  label: "Om Drone",  icon: Music },
  { key: "rain",   label: "Rain",      icon: CloudRain },
  { key: "ocean",  label: "Ocean",     icon: Waves },
  { key: "bells",  label: "Bells",     icon: Sparkles },
];

type PhaseSpec = { label: "Inhale" | "Hold" | "Exhale"; ms: number; scale: number };

function buildCycle(inhale: number, holdIn: number, exhale: number, holdOut: number): PhaseSpec[] {
  return [
    { label: "Inhale", ms: inhale,  scale: 1 },
    { label: "Hold",   ms: holdIn,  scale: 1 },
    { label: "Exhale", ms: exhale,  scale: 0.55 },
    { label: "Hold",   ms: holdOut, scale: 0.55 },
  ];
}

function MeditationPage() {
  // Custom cycle (seconds in UI, ms internally).
  const [inhale, setInhale]   = useState(4000);
  const [holdIn, setHoldIn]   = useState(4000);
  const [exhale, setExhale]   = useState(6000);
  const [holdOut, setHoldOut] = useState(2000);

  const [planet, setPlanet] = useState<PlanetKey>("Jupiter");
  const [target, setTarget] = useState<number>(108);
  const [count, setCount] = useState<number>(0);
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const raf = useRef<number>(0);
  const [saved, setSaved] = useState(false);

  // Audio state
  const [ambient, setAmbientKind] = useState<AmbientKind>("off");
  const [ambVol, setAmbVol] = useState(0.4);
  const [master, setMaster] = useState(0.8);
  const [guided, setGuided] = useState(true);
  const [loopMantra, setLoopMantra] = useState(true);
  const [mantraVol, setMantraVol] = useState(0.7);

  const saveJournal = useServerFn(createJournalEntry);
  const listPresets = useServerFn(listMeditationPresets);
  const savePreset  = useServerFn(saveMeditationPreset);
  const dropPreset  = useServerFn(deleteMeditationPreset);
  const [presets, setPresets] = useState<MeditationPreset[]>([]);
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    listPresets().then(setPresets).catch(() => {});
    return () => { cancelSpeech(); teardownAudio(); };
  }, [listPresets]);

  const remedy = REMEDY_CATALOG[planet];

  const cycle = useMemo(
    () => buildCycle(inhale, holdIn, exhale, holdOut),
    [inhale, holdIn, exhale, holdOut],
  );
  const cycleMs = useMemo(() => cycle.reduce((a,p)=>a+p.ms,0), [cycle]);

  // rAF ticker
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

  // Phase resolution + cycle counting
  const cyclesRef = useRef(0);
  const lastPhaseRef = useRef<number>(-1);
  useEffect(() => {
    if (!running) return;
    const pos = elapsed % cycleMs;
    let acc = 0;
    for (let i = 0; i < cycle.length; i++) {
      acc += cycle[i].ms;
      if (pos < acc) {
        if (phaseIdx !== i) setPhaseIdx(i);
        // Fire guided cue on new phase
        if (lastPhaseRef.current !== i) {
          lastPhaseRef.current = i;
          if (guided) {
            const p = cycle[i];
            const word = p.label === "Hold" ? (i === 1 ? "Hold" : "Rest") : p.label;
            bell(0.1);
            speak(word, { volume: mantraVol });
          }
        }
        break;
      }
    }
    const completed = Math.floor(elapsed / cycleMs);
    if (completed > cyclesRef.current) {
      const delta = completed - cyclesRef.current;
      cyclesRef.current = completed;
      setCount((c) => Math.min(target, c + delta));
      if (loopMantra) speak(remedy.beejMantra, { volume: mantraVol, rate: 0.75, pitch: 0.8 });
    }
  }, [elapsed, running, phaseIdx, target, cycle, cycleMs, guided, loopMantra, remedy.beejMantra, mantraVol]);

  useEffect(() => {
    if (count >= target && running) {
      setRunning(false);
      bell(0.4);
      speak("Session complete", { volume: mantraVol });
    }
  }, [count, target, running, mantraVol]);

  // Sync audio engine with state
  useEffect(() => { setAmbient(ambient); }, [ambient]);
  useEffect(() => { setAmbientVolume(ambVol); }, [ambVol]);
  useEffect(() => { setMasterVolume(master); }, [master]);

  const reset = () => {
    setRunning(false); setElapsed(0); setPhaseIdx(0); setCount(0);
    cyclesRef.current = 0; lastPhaseRef.current = -1; setSaved(false);
    cancelSpeech();
  };

  const toggleRun = () => {
    if (!running) {
      // First user gesture — priming allows audio & speech on iOS.
      setAmbient(ambient); setMasterVolume(master); setAmbientVolume(ambVol);
    } else {
      cancelSpeech();
    }
    setRunning((r) => !r);
  };

  const saveSession = async () => {
    try {
      await saveJournal({ data: {
        kind: "note",
        title: `Mantra session · ${planet} · ${count}/${target}`,
        body: `Beej: ${remedy.beejMantra}\nDeity: ${remedy.deity}\nCycle ${inhale/1000}-${holdIn/1000}-${exhale/1000}-${holdOut/1000}s\nCompleted ${count} repetitions.`,
        mood: null,
        tags: ["meditation", planet.toLowerCase()],
        meta: { planet, count, target, mantra: remedy.beejMantra, cycle: { inhale, holdIn, exhale, holdOut } },
      }});
      setSaved(true);
      toast.success("Session saved to Cosmic Journal");
    } catch {
      toast.error("Could not save session");
    }
  };

  const persistPreset = async () => {
    const name = presetName.trim() || `${planet} · ${(cycleMs/1000).toFixed(0)}s cycle`;
    try {
      const row = await savePreset({ data: {
        name, planet, inhale_ms: inhale, hold_in_ms: holdIn, exhale_ms: exhale, hold_out_ms: holdOut,
        target_reps: target, ambient, ambient_volume: ambVol, mantra_volume: mantraVol,
        guided, loop_mantra: loopMantra,
      }});
      setPresets((p) => [row, ...p.filter((x) => x.id !== row.id)]);
      setPresetName("");
      toast.success("Preset saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save preset");
    }
  };

  const loadPreset = (p: MeditationPreset) => {
    setPlanet(p.planet as PlanetKey);
    setInhale(p.inhale_ms); setHoldIn(p.hold_in_ms); setExhale(p.exhale_ms); setHoldOut(p.hold_out_ms);
    setTarget(p.target_reps);
    setAmbientKind(p.ambient as AmbientKind); setAmbVol(p.ambient_volume);
    setMantraVol(p.mantra_volume); setGuided(p.guided); setLoopMantra(p.loop_mantra);
    reset();
    toast.success(`Loaded “${p.name}”`);
  };

  const removePreset = async (id: string) => {
    try {
      await dropPreset({ data: { id } });
      setPresets((p) => p.filter((x) => x.id !== id));
    } catch { toast.error("Could not delete"); }
  };

  const currentPhase = cycle[phaseIdx];
  const progress = count / target;

  return (
    <PageShell
      eyebrow="Mantra Studio"
      title="Breath. Sound. Presence."
      subtitle="Custom pranayama, planetary beej mantras, ambient soundscapes, and guided prompts."
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
              onClick={toggleRun}
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

          {/* Cycle sliders */}
          <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Pranayama cycle</div>
              <div className="text-xs text-muted-foreground">
                Total <span className="text-pearl">{(cycleMs/1000).toFixed(1)}s</span> / breath
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <PhaseSlider label="Inhale" ms={inhale} onChange={setInhale} min={2000} max={12000} />
              <PhaseSlider label="Hold in" ms={holdIn} onChange={setHoldIn} min={0} max={16000} />
              <PhaseSlider label="Exhale" ms={exhale} onChange={setExhale} min={2000} max={14000} />
              <PhaseSlider label="Hold out" ms={holdOut} onChange={setHoldOut} min={0} max={12000} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <PresetChip active={inhale===4000&&holdIn===4000&&exhale===6000&&holdOut===2000}
                onClick={()=>{setInhale(4000);setHoldIn(4000);setExhale(6000);setHoldOut(2000);reset();}}>
                4·4·6·2 Classic
              </PresetChip>
              <PresetChip active={inhale===4000&&holdIn===7000&&exhale===8000&&holdOut===0}
                onClick={()=>{setInhale(4000);setHoldIn(7000);setExhale(8000);setHoldOut(0);reset();}}>
                4·7·8 Calming
              </PresetChip>
              <PresetChip active={inhale===4000&&holdIn===4000&&exhale===4000&&holdOut===4000}
                onClick={()=>{setInhale(4000);setHoldIn(4000);setExhale(4000);setHoldOut(4000);reset();}}>
                Box 4·4·4·4
              </PresetChip>
              <PresetChip active={inhale===6000&&holdIn===0&&exhale===6000&&holdOut===0}
                onClick={()=>{setInhale(6000);setHoldIn(0);setExhale(6000);setHoldOut(0);reset();}}>
                Coherent 6·6
              </PresetChip>
            </div>
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
              At your current cycle, a full mala of <span className="text-pearl">{target}</span> reps takes about{" "}
              <span className="text-pearl">{Math.ceil(target * cycleMs / 60000)} minutes</span>.
            </div>
          </div>

          {/* Sound controls */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5 text-gold" /> Sound
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {AMBIENTS.map(({ key, label, icon: Icon }) => (
                <button key={key}
                  onClick={() => setAmbientKind(key)}
                  className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] border transition ${
                    ambient === key ? "border-gold/60 bg-gold/10 text-pearl" : "border-white/5 bg-white/[0.02] text-muted-foreground hover:text-pearl"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <VolSlider label="Ambient" value={ambVol} onChange={setAmbVol} />
            <VolSlider label="Mantra"  value={mantraVol} onChange={setMantraVol} />
            <VolSlider label="Master"  value={master} onChange={setMaster} />
            <div className="mt-3 flex flex-col gap-2 text-[11px]">
              <Toggle checked={guided} onChange={setGuided} label="Guided phase prompts" />
              <Toggle checked={loopMantra} onChange={setLoopMantra} label="Chant mantra each cycle" />
            </div>
          </div>

          {/* Saved presets */}
          <div className="glass rounded-3xl p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">My presets</div>
            <div className="mt-3 flex gap-2">
              <input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name"
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-pearl outline-none focus:border-gold/50"
              />
              <button onClick={persistPreset}
                className="inline-flex items-center gap-1 rounded-xl bg-gold/20 text-gold px-3 py-2 text-xs hover:bg-gold/30">
                <Save className="h-3.5 w-3.5" /> Save
              </button>
            </div>
            <ul className="mt-3 space-y-1.5 max-h-56 overflow-auto">
              {presets.length === 0 && (
                <li className="text-[11px] text-muted-foreground">No presets yet. Tune your cycle and save it.</li>
              )}
              {presets.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
                  <button onClick={() => loadPreset(p)} className="flex-1 text-left">
                    <div className="text-xs text-pearl">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {p.planet} · {p.inhale_ms/1000}·{p.hold_in_ms/1000}·{p.exhale_ms/1000}·{p.hold_out_ms/1000}s · {p.target_reps}
                    </div>
                  </button>
                  <button onClick={() => removePreset(p.id)} className="text-muted-foreground hover:text-red-300 p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
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

function PhaseSlider({ label, ms, onChange, min, max }: { label: string; ms: number; onChange: (v: number)=>void; min: number; max: number }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-pearl">{(ms/1000).toFixed(1)}s</span>
      </div>
      <input
        type="range" min={min} max={max} step={500}
        value={ms} onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[oklch(0.82_0.13_85)]"
      />
    </label>
  );
}

function VolSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number)=>void }) {
  return (
    <label className="mt-3 block">
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-pearl">{Math.round(value*100)}%</span>
      </div>
      <input
        type="range" min={0} max={1} step={0.01}
        value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[oklch(0.82_0.13_85)]"
      />
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean)=>void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <span className={`inline-flex h-4 w-7 rounded-full border transition ${checked ? "bg-gold/40 border-gold/60" : "bg-white/5 border-white/10"}`}>
        <span className={`h-3.5 w-3.5 rounded-full bg-pearl transition-transform ${checked ? "translate-x-3" : "translate-x-0"}`} />
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-muted-foreground">{label}</span>
    </label>
  );
}

function PresetChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded-full px-3 py-1 border transition ${
        active ? "border-gold/60 bg-gold/10 text-pearl" : "border-white/5 bg-white/[0.02] text-muted-foreground hover:text-pearl"
      }`}>
      {children}
    </button>
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
      <svg className="absolute inset-0 animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeOpacity="0.15" strokeDasharray="1 3" />
      </svg>
    </div>
  );
}
