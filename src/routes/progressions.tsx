import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, GlassCard } from "@/components/page-shell";
import { WheelChart } from "@/components/wheel-chart";
import { computeWesternChart, computeAspects, ASPECTS, SIGN_NAMES, SIGN_GLYPHS } from "@/lib/western";
import { progressedChart, solarReturnChart, type BirthInput } from "@/lib/progressions";
import { solarArcDirections, solarArcHits, harmonicChart, midpointTree, lunarReturnDate } from "@/lib/western-deep";
import { aiReading } from "@/lib/ai-cache";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/progressions")({
  component: () => (<PremiumGate featureName="Progressions"><ProgressionsPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Progressions & Solar Return — TAROMAYA" },
      { name: "description", content: "Secondary progressed chart and yearly Solar Return with AI interpretation." },
    ],
  }),
});

type Mode = "progressed" | "return";

const DEFAULT: BirthInput = {
  year: 1995, month: 6, day: 15, hour: 10, minute: 30,
  tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.2090,
};

function ProgressionsPage() {
  const [mode, setMode] = useState<Mode>("progressed");
  const [birth, setBirth] = useState<BirthInput>(DEFAULT);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [aiText, setAiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ai = useServerFn(aiReading);

  const natal = useMemo(() => computeWesternChart(birth, "placidus"), [birth]);
  const natalSunLon = natal.tropicalPlanets.find((p) => p.name === "Sun")!.tropicalLongitude;

  const prog = useMemo(() => (mode === "progressed" ? progressedChart(birth) : null), [mode, birth]);
  const sr = useMemo(
    () => (mode === "return" ? solarReturnChart(birth, natalSunLon, targetYear) : null),
    [mode, birth, natalSunLon, targetYear],
  );

  const chart = prog?.chart ?? sr?.chart ?? null;

  const generate = async () => {
    if (!chart) return;
    setLoading(true); setAiText(null);
    try {
      const aspects = computeAspects(chart).filter((h) => ASPECTS[h.type].kind === "major").slice(0, 12);
      const summary = chart.tropicalPlanets.map((p) => {
        const s = SIGN_NAMES[Math.floor(p.tropicalLongitude / 30)];
        return `${p.name} in ${s} ${(p.tropicalLongitude % 30).toFixed(1)}°`;
      }).join(", ");
      const aspSummary = aspects.map((h) => `${h.a} ${h.type} ${h.b} (orb ${h.orb.toFixed(1)}°)`).join("; ");
      const context = mode === "progressed"
        ? `Secondary progressed chart. Age ${prog!.ageYears.toFixed(2)} years. Progressed instant ${prog!.progressedAt.toISOString()}.`
        : `Solar Return chart for the year beginning ${sr!.returnAt.toDateString()} (Sun returns to natal position).`;
      const res = await ai({
        data: {
          system: "You are an elite modern astrologer. Elegant, specific, non-generic. Markdown allowed. About 500 words.",
          prompt: `${context}
Planets: ${summary}
Major aspects: ${aspSummary}
Ascendant ${chart.tropicalAscendant.toFixed(1)}°, MC ${chart.midheaven.toFixed(1)}°.
Structure the reading:
1. **Theme of the Year** (or of this life-stage)
2. **Inner Life** (progressed/return Moon, Venus)
3. **Outer Life** (Sun, Mars, MC)
4. **Watch-outs** (Saturn, hard aspects)
5. **Guidance & timing**`,
        },
      });
      setAiText(res.text);
    } finally { setLoading(false); }
  };

  return (
    <PageShell
      eyebrow="Progressions & Returns"
      title="Your evolving chart"
      subtitle="Secondary Progressions map the inner unfolding of your natal chart; the Solar Return chart sets the tone of each new solar year."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {(["progressed", "return"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setAiText(null); }}
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest ${
              mode === m ? "gold-border bg-gold/15 text-pearl" : "border border-white/10 text-muted-foreground"
            }`}
          >
            {m === "progressed" ? "Secondary Progressions" : "Solar Return"}
          </button>
        ))}
      </div>

      <GlassCard title="Birth data">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumField label="Year" v={birth.year} onChange={(n) => setBirth({ ...birth, year: n })} />
          <NumField label="Month" v={birth.month} onChange={(n) => setBirth({ ...birth, month: n })} />
          <NumField label="Day" v={birth.day} onChange={(n) => setBirth({ ...birth, day: n })} />
          <NumField label="Hour (24h)" v={birth.hour} onChange={(n) => setBirth({ ...birth, hour: n })} />
          <NumField label="Minute" v={birth.minute} onChange={(n) => setBirth({ ...birth, minute: n })} />
          <NumField label="TZ offset (h)" v={birth.tzOffsetHours} step={0.25} onChange={(n) => setBirth({ ...birth, tzOffsetHours: n })} />
          <NumField label="Latitude" v={birth.latitude} step={0.0001} onChange={(n) => setBirth({ ...birth, latitude: n })} />
          <NumField label="Longitude" v={birth.longitude} step={0.0001} onChange={(n) => setBirth({ ...birth, longitude: n })} />
          {mode === "return" && (
            <NumField label="Return year" v={targetYear} onChange={setTargetYear} />
          )}
        </div>
      </GlassCard>

      {chart && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <GlassCard title={mode === "progressed" ? "Progressed wheel" : `Solar Return ${targetYear}`}>
            <WheelChart chart={chart} size={480} />
            <div className="mt-3 text-xs text-muted-foreground">
              {mode === "progressed"
                ? <>Progressed instant: <span className="text-pearl">{prog!.progressedAt.toUTCString()}</span> · age {prog!.ageYears.toFixed(2)}y</>
                : <>Return moment: <span className="text-pearl">{sr!.returnAt.toUTCString()}</span></>}
            </div>
          </GlassCard>

          <div className="space-y-4">
            <GlassCard title="Planets">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {chart.tropicalPlanets.map((p) => {
                  const s = Math.floor(p.tropicalLongitude / 30);
                  return (
                    <div key={p.name} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span className="text-pearl">{p.name}{p.retrograde && <span className="text-cyan-300 ml-1">℞</span>}</span>
                      <span className="text-muted-foreground">
                        <span className="gold-text">{SIGN_GLYPHS[s]}</span> {(p.tropicalLongitude % 30).toFixed(1)}°
                      </span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard title="AI reading">
              {!aiText && !loading && (
                <button onClick={generate} className="rounded-full bg-gradient-to-r from-gold to-gold-soft px-6 py-2.5 text-sm font-medium text-primary-foreground inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Generate reading
                </button>
              )}
              {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Reading the cycle…</div>}
              {aiText && (
                <>
                  <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{aiText}</div>
                  <button onClick={generate} className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-pearl">
                    <RefreshCw className="w-3 h-3" /> Regenerate
                  </button>
                </>
              )}
            </GlassCard>
          </div>
        </div>
      )}

      <DeepWesternPanel natal={natal} birth={birth} />
    </PageShell>
  );
}

function DeepWesternPanel({ natal, birth }: { natal: ReturnType<typeof computeWesternChart>; birth: BirthInput }) {
  const birthUtcMs = Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute) - birth.tzOffsetHours * 3600000;
  const sa = useMemo(() => solarArcDirections(natal, birthUtcMs), [natal, birthUtcMs]);
  const saHits = useMemo(() => solarArcHits(natal, sa).slice(0, 10), [natal, sa]);
  const [n, setN] = useState(5);
  const harm = useMemo(() => harmonicChart(natal, n), [natal, n]);
  const midTree = useMemo(() => midpointTree(natal), [natal]);
  const natalMoon = natal.tropicalPlanets.find((p) => p.name === "Moon")!.tropicalLongitude;
  const lunarRet = useMemo(() => lunarReturnDate(natalMoon), [natalMoon]);

  return (
    <div className="mt-8 space-y-6">
      <div>
        <div className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">Deep Western engine</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title={`Solar Arc directions — arc ${sa.arc.toFixed(2)}°`}>
          <div className="text-[11px] text-muted-foreground mb-2">Age {sa.ageYears.toFixed(2)} · every point advanced by the same arc as the progressed Sun.</div>
          {saHits.length === 0 && <div className="text-xs text-muted-foreground">No exact hits within 1° right now — the arc is between activations.</div>}
          <div className="space-y-1 text-xs">
            {saHits.map((h, i) => (
              <div key={i} className="flex justify-between border-t border-white/5 py-1.5">
                <span className={h.kind === "hard" ? "text-red-300" : "text-emerald-300"}>{h.a} {h.type} {h.b}</span>
                <span className="text-muted-foreground font-mono">{h.orb.toFixed(2)}°</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Lunar Return">
          {lunarRet ? (
            <>
              <div className="font-display text-2xl gold-text">{lunarRet.toUTCString().slice(0, 22)} UTC</div>
              <div className="mt-2 text-xs text-muted-foreground">Transiting Moon returns to your natal Moon at {natalMoon.toFixed(2)}° tropical.</div>
            </>
          ) : <div className="text-xs text-muted-foreground">No return found in ±16 days.</div>}
        </GlassCard>
      </div>

      <GlassCard title={`Harmonic H${n} — Nth-harmonic aspects as conjunctions`}>
        <div className="mb-3 flex flex-wrap gap-2">
          {[2,3,4,5,7,9,11,12].map((k) => (
            <button key={k} onClick={() => setN(k)}
              className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-widest ${
                n === k ? "gold-border bg-gold/15 text-pearl" : "border border-white/10 text-muted-foreground"
              }`}>H{k}</button>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground mb-2">
          H5 = quintiles (talent), H7 = mystical/fate, H9 = spiritual completion, H11 = crisis, H12 = duty.
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {harm.planets.map((p) => (
            <div key={p.name} className="flex justify-between rounded-lg bg-white/5 px-3 py-1.5">
              <span className="text-pearl">{p.name}</span>
              <span className="text-muted-foreground gold-text">{SIGN_GLYPHS[Math.floor(p.longitude/30)]} {(p.longitude%30).toFixed(1)}°</span>
            </div>
          ))}
        </div>
        {harm.conjunctions.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">H{n} contacts (natal aspects at {(360/n).toFixed(2)}°)</div>
            <div className="text-xs space-y-1">
              {harm.conjunctions.slice(0, 8).map((c, i) => (
                <div key={i} className="flex justify-between border-t border-white/5 py-1">
                  <span className="text-pearl">{c.a} ⋅ {c.b}</span>
                  <span className="text-muted-foreground font-mono">{c.orb.toFixed(2)}°</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard title="Midpoint tree — 22.5° Ebertin dial">
        <div className="text-[11px] text-muted-foreground mb-3">Cosmobiology: each planet's most tightly aspected midpoints (orb ≤ 1.5° on the 8th-harmonic dial).</div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(midTree).map(([planet, hits]) => (
            <div key={planet} className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{planet} =</div>
              <div className="mt-1 space-y-0.5 text-xs">
                {hits.slice(0, 5).map((h, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-pearl">{h.pair}</span>
                    <span className="text-muted-foreground font-mono">{h.type}° · {h.orb.toFixed(2)}°</span>
                  </div>
                ))}
                {hits.length === 0 && <div className="text-muted-foreground">—</div>}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="text-[10px] text-muted-foreground">
        Solar Arc, Harmonics, and Midpoint trees complete the modern Western toolkit (Ebertin / Cosmobiology / Uranian influences).
      </div>
    </div>
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
