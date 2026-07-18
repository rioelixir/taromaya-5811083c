import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, GlassCard } from "@/components/page-shell";
import { BiWheelChart } from "@/components/bi-wheel-chart";
import { computeWesternChart, SIGN_NAMES, SIGN_GLYPHS } from "@/lib/western";
import { synastryAspects, houseOverlay, compositeChart, synastryScore } from "@/lib/synastry";
import { computeKundli, formatDegree, PLANET_GLYPHS, type PlanetName } from "@/lib/vedic";
import { ashtakootMilan } from "@/lib/ashtakoot";
import { findAspectHits, fmtDay } from "@/lib/transits-timeline";
import { aiReading } from "@/lib/ai-reading.functions";
import { Loader2, Sparkles, Heart, Flame, Zap } from "lucide-react";


export const Route = createFileRoute("/synastry")({
  component: () => (<PremiumGate featureName="Synastry"><SynastryPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Synastry — TAROMAYA" },
      { name: "description", content: "Western synastry: bi-wheel, cross-aspects, house overlay, composite midpoint chart and AI relationship reading." },
    ],
  }),
});

type Person = { name: string; date: string; time: string; tz: string; lat: string; lon: string };
const DA: Person = { name: "You", date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090" };
const DB: Person = { name: "Partner", date: "1994-11-22", time: "14:20", tz: "5.5", lat: "19.0760", lon: "72.8777" };

const ASPECT_COLORS: Record<string, string> = {
  conjunction: "text-gold", opposition: "text-red-400", trine: "text-cyan-300",
  square: "text-red-400", sextile: "text-sky-300", quincunx: "text-fuchsia-300",
  "semi-sextile": "text-emerald-300", "semi-square": "text-orange-300",
  sesquiquadrate: "text-orange-300", quintile: "text-violet-300",
};

function toChart(p: Person) {
  const [y, m, d] = p.date.split("-").map(Number);
  const [hh, mm] = p.time.split(":").map(Number);
  return computeWesternChart({
    year: y, month: m, day: d, hour: hh, minute: mm,
    tzOffsetHours: Number(p.tz), latitude: Number(p.lat), longitude: Number(p.lon),
  }, "placidus");
}

function SynastryPage() {
  const [a, setA] = useState<Person>(DA);
  const [b, setB] = useState<Person>(DB);
  const [computed, setComputed] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ai = useServerFn(aiReading);

  const chartA = useMemo(() => (computed ? toChart(a) : null), [a, computed]);
  const chartB = useMemo(() => (computed ? toChart(b) : null), [b, computed]);
  const hits = useMemo(() => (chartA && chartB ? synastryAspects(chartA, chartB) : []), [chartA, chartB]);
  const overlayBinA = useMemo(() => (chartA && chartB ? houseOverlay(chartA, chartB) : []), [chartA, chartB]);
  const overlayAinB = useMemo(() => (chartA && chartB ? houseOverlay(chartB, chartA) : []), [chartA, chartB]);
  const composite = useMemo(() => (chartA && chartB ? compositeChart(chartA, chartB) : null), [chartA, chartB]);
  const score = useMemo(() => synastryScore(hits), [hits]);

  // Vedic Ashtakoot on the same two births.
  const ashtakoot = useMemo(() => {
    if (!computed) return null;
    const toVedic = (p: Person) => {
      const [y, m, d] = p.date.split("-").map(Number);
      const [hh, mm] = p.time.split(":").map(Number);
      return computeKundli({
        year: y, month: m, day: d, hour: hh, minute: mm,
        tzOffsetHours: Number(p.tz), latitude: Number(p.lat), longitude: Number(p.lon),
      });
    };
    return ashtakootMilan(
      { chart: toVedic(a), name: a.name || "You", gender: "male" },
      { chart: toVedic(b), name: b.name || "Partner", gender: "female" },
    );
  }, [a, b, computed]);

  // Relationship transits — sky hits to composite planets, next 12 months.
  const relTransits = useMemo(() => {
    if (!composite) return [];
    const start = new Date();
    const end = new Date(start.getTime() + 365 * 86400000);
    const natal = composite.planets.map(p => ({ name: p.name, longitude: p.longitude }));
    return findAspectHits(
      natal, start, end,
      ["Jupiter", "Saturn", "Mars"],
      ["conjunction", "opposition", "square", "trine"],
    );
  }, [composite]);


  const generate = async () => {
    if (!chartA || !chartB) return;
    setLoading(true); setAiText(null);
    try {
      const top = hits.slice(0, 10).map((h) => `${a.name || "A"}'s ${h.a} ${h.type} ${b.name || "B"}'s ${h.b} (orb ${h.orb.toFixed(1)}°)`).join("; ");
      const res = await ai({
        data: {
          system: "You are a modern Western astrologer writing intimate, honest synastry readings. Use markdown. Compassionate but direct. No disclaimers.",
          prompt: `Write a synastry reading (~500 words) for ${a.name || "A"} and ${b.name || "B"}.
Compatibility score: ${score.score}/100 (${score.label}).
Top cross-aspects: ${top}.
Structure: ### The bond, ### How you meet each other (Sun/Moon/Venus/Mars), ### The friction, ### The alchemy (composite), ### Guidance.`,
        },
      });
      setAiText(res.text);
    } finally { setLoading(false); }
  };

  const outerFromB = chartB ? chartB.tropicalPlanets.map((p) => ({
    name: p.name, longitude: p.tropicalLongitude, retrograde: p.retrograde,
  })) : [];

  return (
    <PageShell
      eyebrow="Synastry"
      title="Two charts, one dance"
      subtitle="Western bi-wheel with cross-aspects, house overlays, and a composite midpoint chart."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {([["You", a, setA], ["Partner", b, setB]] as const).map(([label, p, set]) => (
          <GlassCard key={label} title={p.name || label}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["name","date","time","tz","lat","lon"] as const).map((k) => (
                <label key={k} className="block">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</span>
                  <input type={k === "date" ? "date" : k === "time" ? "time" : "text"} value={p[k]}
                    onChange={(e) => set({ ...p, [k]: e.target.value })}
                    className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50" />
                </label>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-6">
        <button onClick={() => { setComputed(true); setAiText(null); }}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft px-8 py-3 text-sm font-medium text-primary-foreground">
          <Heart className="w-4 h-4" /> Read the bond
        </button>
      </div>

      {chartA && chartB && composite && (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,560px)_1fr]">
            <GlassCard>
              <BiWheelChart chart={chartA} outerPlanets={outerFromB} outerLabel={b.name || "Partner"} />
              <div className="mt-3 text-center text-xs text-muted-foreground">
                Inner: {a.name || "You"} · Outer: {b.name || "Partner"}
              </div>
            </GlassCard>
            <div className="space-y-4">
              <GlassCard>
                <div className="text-center">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Compatibility</div>
                  <div className="mt-2 font-display text-6xl gold-text">{score.score}<span className="text-2xl">%</span></div>
                  <div className="mt-2 text-pearl">{score.label}</div>
                  <div className="mt-3 flex justify-center gap-6 text-xs">
                    <span className="text-cyan-300">+{score.positive} harmony</span>
                    <span className="text-red-300">−{score.challenging} friction</span>
                  </div>
                </div>
              </GlassCard>
              <GlassCard title="Composite (midpoint) chart">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-gold/10 p-2">
                    <div className="text-muted-foreground">Ascendant</div>
                    <div className="gold-text">{SIGN_GLYPHS[Math.floor(composite.ascendant / 30)]} {SIGN_NAMES[Math.floor(composite.ascendant / 30)]}</div>
                    <div className="font-mono">{formatDegree(composite.ascendant % 30)}</div>
                  </div>
                  <div className="rounded-xl bg-gold/10 p-2">
                    <div className="text-muted-foreground">Midheaven</div>
                    <div className="gold-text">{SIGN_GLYPHS[Math.floor(composite.midheaven / 30)]} {SIGN_NAMES[Math.floor(composite.midheaven / 30)]}</div>
                    <div className="font-mono">{formatDegree(composite.midheaven % 30)}</div>
                  </div>
                  {composite.planets.map((p) => {
                    const s = Math.floor(p.longitude / 30);
                    return (
                      <div key={p.name} className="rounded-xl bg-white/5 p-2">
                        <div className="text-muted-foreground">{PLANET_GLYPHS[p.name]} {p.name}</div>
                        <div className="text-pearl">{SIGN_GLYPHS[s]} {SIGN_NAMES[s]}</div>
                        <div className="font-mono text-muted-foreground">{formatDegree(p.longitude - s * 30)}</div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <GlassCard title="Cross-aspects (top 25)">
              <div className="max-h-96 overflow-y-auto text-xs">
                <table className="w-full">
                  <tbody>
                    {hits.slice(0, 25).map((h, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="py-1.5"><span className="gold-text">{PLANET_GLYPHS[h.a]}</span> {a.name || "A"}'s {h.a}</td>
                        <td className={ASPECT_COLORS[h.type]}>{h.type}</td>
                        <td><span className="text-cyan-300">{PLANET_GLYPHS[h.b]}</span> {b.name || "B"}'s {h.b}</td>
                        <td className="text-right text-muted-foreground font-mono">{h.orb.toFixed(2)}°</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
            <GlassCard title="House overlay">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground mb-1">{b.name || "Partner"}'s planets in {a.name || "your"} houses</div>
                  {overlayBinA.map((o) => (
                    <div key={"ba"+o.planet} className="flex justify-between border-t border-white/5 py-1">
                      <span>{PLANET_GLYPHS[o.planet]} {o.planet}</span>
                      <span className="gold-text">H{o.houseInA}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">{a.name || "Your"} planets in {b.name || "partner"}'s houses</div>
                  {overlayAinB.map((o) => (
                    <div key={"ab"+o.planet} className="flex justify-between border-t border-white/5 py-1">
                      <span>{PLANET_GLYPHS[o.planet]} {o.planet}</span>
                      <span className="text-cyan-300">H{o.houseInA}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {ashtakoot && (
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <GlassCard title="Ashtakoot Guna Milan" desc="Vedic Moon-nakshatra compatibility, 36 point system.">
                <div className="text-center">
                  <div className="font-display text-6xl gold-text">{ashtakoot.total}<span className="text-2xl">/36</span></div>
                  <div className="mt-2 text-pearl text-sm">{ashtakoot.interpretation}</div>
                  {(ashtakoot.manglik.boy || ashtakoot.manglik.girl) && (
                    <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${ashtakoot.manglik.cancelled ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30" : "bg-red-500/10 text-red-200 border border-red-500/30"}`}>
                      <Flame className="w-3 h-3" />
                      {ashtakoot.manglik.cancelled
                        ? "Manglik present — mutually cancelled"
                        : `Manglik: ${ashtakoot.manglik.boy ? "You" : ""}${ashtakoot.manglik.boy && ashtakoot.manglik.girl ? " & " : ""}${ashtakoot.manglik.girl ? "Partner" : ""}`}
                    </div>
                  )}
                </div>
              </GlassCard>
              <GlassCard title="Kootas">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {ashtakoot.kootas.map((k) => (
                    <div key={k.name} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-pearl font-medium">{k.name}</span>
                        <span className="gold-text font-mono">{k.score}/{k.max}</span>
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">{k.boy} · {k.girl}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground leading-snug">{k.detail}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {relTransits.length > 0 && (
            <div className="mt-6">
              <GlassCard title="Relationship transits — next 12 months" desc="Slow-planet transits hitting your composite chart. These are the seasons that stress or nourish the bond.">
                <ol className="relative border-l border-white/10 pl-6 space-y-2 max-h-[420px] overflow-y-auto">
                  {relTransits.slice(0, 60).map((h, i) => {
                    const glyph: Record<string, string> = { conjunction: "☌", opposition: "☍", square: "□", trine: "△", sextile: "✶" };
                    const good = h.type === "trine" || h.type === "sextile" || (h.type === "conjunction" && (h.transit === "Jupiter"));
                    const past = h.date < new Date();
                    return (
                      <li key={i} className={`relative ${past ? "opacity-50" : ""}`}>
                        <span className={`absolute -left-[29px] top-2 h-2 w-2 rounded-full shadow-[0_0_10px_var(--gold)] ${good ? "bg-emerald-300" : "bg-gold"}`} />
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <span className="font-mono text-[11px] text-muted-foreground w-24 shrink-0">{fmtDay(h.date)}</span>
                          <Zap className={`h-3 w-3 ${good ? "text-emerald-300" : "text-gold"}`} />
                          <span className="text-pearl"><b>{h.transit}</b> {glyph[h.type] ?? h.type} composite <b>{h.natal as PlanetName}</b></span>
                          <span className="text-muted-foreground text-[10px]">{h.type}</span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </GlassCard>
            </div>
          )}


          <div className="mt-6">
            <GlassCard title="AI synastry reading">
              {!aiText && !loading && (
                <button onClick={generate}
                  className="rounded-full bg-gradient-to-r from-gold to-gold-soft px-6 py-2.5 text-sm font-medium text-primary-foreground inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Generate reading
                </button>
              )}
              {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Reading the bond…</div>}
              {aiText && <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{aiText}</div>}
            </GlassCard>
          </div>
        </>
      )}
    </PageShell>
  );
}
