import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli, RASHIS, PLANET_SHORT, formatDegree } from "@/lib/vedic";
import { ashtakootMilan } from "@/lib/ashtakoot";
import { aiReading } from "@/lib/ai-reading.functions";
import { Loader2, Sparkles, Heart, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/compatibility")({
  component: CompatibilityPage,
  head: () => ({
    meta: [
      { title: "Kundli Matching — TAROMAYA" },
      { name: "description", content: "Ashtakoot Guna Milan out of 36 with Manglik analysis, side-by-side charts, and AI relationship reading." },
    ],
  }),
});

type Person = { name: string; date: string; time: string; tz: string; lat: string; lon: string };
const DEFAULT_A: Person = { name: "", date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090" };
const DEFAULT_B: Person = { name: "", date: "1994-11-22", time: "14:20", tz: "5.5", lat: "19.0760", lon: "72.8777" };

function CompatibilityPage() {
  const [a, setA] = useState<Person>(DEFAULT_A);
  const [b, setB] = useState<Person>(DEFAULT_B);
  const [result, setResult] = useState<ReturnType<typeof compute> | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ai = useServerFn(aiReading);

  function compute() {
    const toChart = (p: Person) => {
      const [y, m, d] = p.date.split("-").map(Number);
      const [hh, mm] = p.time.split(":").map(Number);
      return computeKundli({
        year: y, month: m, day: d, hour: hh, minute: mm,
        tzOffsetHours: Number(p.tz), latitude: Number(p.lat), longitude: Number(p.lon),
      });
    };
    const chartA = toChart(a), chartB = toChart(b);
    const milan = ashtakootMilan(
      { chart: chartA, name: a.name || "Boy", gender: "male" },
      { chart: chartB, name: b.name || "Girl", gender: "female" },
    );
    return { chartA, chartB, milan };
  }

  const onCalc = () => { setResult(compute()); setAiText(null); };

  const generate = async () => {
    if (!result) return;
    setLoading(true); setAiText(null);
    try {
      const res = await ai({
        data: {
          system: "You are a compassionate Vedic astrologer writing modern relationship readings. Use markdown; poetic yet honest.",
          prompt: `Kundli match reading for ${a.name || "Person A"} × ${b.name || "Person B"}.
Total Ashtakoot: ${result.milan.total}/36. Interpretation: ${result.milan.interpretation}.
Manglik — A: ${result.milan.manglik.boy}, B: ${result.milan.manglik.girl}, cancelled: ${result.milan.manglik.cancelled}.
Kootas: ${result.milan.kootas.map((k) => `${k.name} ${k.score}/${k.max}`).join(", ")}.
Structure: Overall Compatibility, Emotional & Mental (Gana, Bhakoot), Physical & Sensual (Yoni), Health & Progeny (Nadi), Manglik Considerations, Advice. ~450 words.`,
        },
      });
      setAiText(res.text);
    } finally { setLoading(false); }
  };

  return (
    <PageShell
      eyebrow="Kundli Matching"
      title="Ashtakoot Guna Milan"
      subtitle="Traditional 36-point Vedic compatibility with Manglik analysis and AI reading."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard title="Person A · Boy"><PersonInputs value={a} onChange={setA} /></GlassCard>
        <GlassCard title="Person B · Girl"><PersonInputs value={b} onChange={setB} /></GlassCard>
      </div>
      <button onClick={onCalc}
        className="mt-6 rounded-full bg-gradient-to-r from-gold to-gold-soft px-8 py-3 text-sm font-medium text-primary-foreground inline-flex items-center gap-2">
        <Heart className="w-4 h-4" /> Calculate compatibility
      </button>

      {result && (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <GlassCard>
              <div className="text-center">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Total score</div>
                <div className="font-display text-6xl gold-text mt-2">{result.milan.total}<span className="text-2xl text-muted-foreground">/36</span></div>
                <div className="mt-3 text-sm text-pearl">{result.milan.interpretation}</div>
              </div>
            </GlassCard>
            <GlassCard title="Manglik dosha">
              <ManglikRow label={a.name || "A"} m={result.milan.manglik.boy} />
              <ManglikRow label={b.name || "B"} m={result.milan.manglik.girl} />
              {result.milan.manglik.cancelled && (
                <div className="mt-2 text-xs text-emerald-300">Manglik cancelled — both are Manglik.</div>
              )}
            </GlassCard>
            <GlassCard title="Bhakoot difference">
              <div className="font-display text-3xl gold-text">{result.milan.bhakoot}</div>
              <div className="mt-1 text-xs text-muted-foreground">Distance between Moon rashis. 6/8 or 5/9 gaps carry dosha.</div>
            </GlassCard>
          </div>

          <div className="mt-6">
            <GlassCard title="Ashtakoot breakdown">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="text-left py-2">Koota</th>
                      <th className="text-left">Boy</th>
                      <th className="text-left">Girl</th>
                      <th className="text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.milan.kootas.map((k) => (
                      <tr key={k.name} className="border-t border-white/5">
                        <td className="py-2">
                          <div className="text-pearl">{k.name}</div>
                          <div className="text-[10px] text-muted-foreground">{k.detail}</div>
                        </td>
                        <td>{k.boy}</td>
                        <td>{k.girl}</td>
                        <td className="text-right font-mono">
                          <span className={k.score === k.max ? "text-emerald-300" : k.score === 0 ? "text-red-300" : "gold-text"}>
                            {k.score}
                          </span>
                          <span className="text-muted-foreground"> / {k.max}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <GlassCard title={`${a.name || "A"} — birth chart`}>
              <MiniChart chart={result.chartA} />
            </GlassCard>
            <GlassCard title={`${b.name || "B"} — birth chart`}>
              <MiniChart chart={result.chartB} />
            </GlassCard>
          </div>

          <div className="mt-6">
            <GlassCard title="AI Relationship Reading">
              {!aiText && !loading && (
                <button onClick={generate} className="rounded-full bg-gradient-to-r from-gold to-gold-soft px-6 py-2.5 text-sm font-medium text-primary-foreground inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Generate reading
                </button>
              )}
              {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Weaving the union…</div>}
              {aiText && <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{aiText}</div>}
            </GlassCard>
          </div>
        </>
      )}
    </PageShell>
  );
}

function PersonInputs({ value, onChange }: { value: Person; onChange: (p: Person) => void }) {
  const set = (k: keyof Person, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3">
      <input value={value.name} onChange={(e) => set("name", e.target.value)} placeholder="Name" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl" />
      <div className="grid grid-cols-2 gap-3">
        <input type="date" value={value.date} onChange={(e) => set("date", e.target.value)} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-pearl" />
        <input type="time" value={value.time} onChange={(e) => set("time", e.target.value)} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-pearl" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input value={value.tz} onChange={(e) => set("tz", e.target.value)} placeholder="TZ" className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-pearl" />
        <input value={value.lat} onChange={(e) => set("lat", e.target.value)} placeholder="Lat" className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-pearl" />
        <input value={value.lon} onChange={(e) => set("lon", e.target.value)} placeholder="Lon" className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-pearl" />
      </div>
    </div>
  );
}

function ManglikRow({ label, m }: { label: string; m: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-pearl">{label}</span>
      <span className={m ? "text-red-300 inline-flex items-center gap-1" : "text-emerald-300 inline-flex items-center gap-1"}>
        {m ? <><XCircle className="w-4 h-4" /> Manglik</> : <><CheckCircle2 className="w-4 h-4" /> Non-Manglik</>}
      </span>
    </div>
  );
}

function MiniChart({ chart }: { chart: ReturnType<typeof computeKundli> }) {
  // Compact South Indian style 4x4 grid
  const houses = Array.from({ length: 12 }, () => [] as string[]);
  chart.planets.forEach((p) => {
    houses[p.rashi].push(PLANET_SHORT[p.name]);
  });
  const grid = [
    [11, 0, 1, 2],
    [10, -1, -1, 3],
    [9, -1, -1, 4],
    [8, 7, 6, 5],
  ];
  const ascRashi = chart.ascendant.rashi;
  return (
    <div className="grid grid-cols-4 gap-1 text-[10px]">
      {grid.flat().map((r, i) => {
        if (r === -1) return <div key={i} className="rounded-lg bg-white/5 aspect-square" />;
        const isAsc = r === ascRashi;
        return (
          <div key={i} className={`rounded-lg aspect-square p-1.5 ${isAsc ? "gold-border bg-gold/10" : "bg-white/5"}`}>
            <div className="text-[9px] text-muted-foreground">{RASHIS[r].slice(0, 3)}</div>
            <div className="mt-0.5 gold-text leading-tight">{houses[r].join(" ") || ""}</div>
          </div>
        );
      })}
    </div>
  );
}
void formatDegree;
