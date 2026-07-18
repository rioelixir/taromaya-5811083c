import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, GlassCard } from "@/components/page-shell";
import { WheelChart } from "@/components/wheel-chart";
import { computeWesternChart, computeAspects, ASPECTS, SIGN_NAMES, SIGN_GLYPHS } from "@/lib/western";
import { progressedChart, solarReturnChart, type BirthInput } from "@/lib/progressions";
import { solarArcDirections, solarArcHits, harmonicChart, midpointTree, lunarReturnDate } from "@/lib/western-deep";
import { aiReading } from "@/lib/ai-reading.functions";
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
