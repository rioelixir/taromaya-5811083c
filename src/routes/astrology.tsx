import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { BirthVoiceBox } from "@/components/birth-voice-box";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, GlassCard } from "@/components/page-shell";
import { WheelChart } from "@/components/wheel-chart";
import {
  computeWesternChart, computeAspects, detectPatterns, chartShape,
  computeDominants, arabicLots, fixedStarsNearPlanets, houseOfLongitude,
  SIGN_NAMES, SIGN_GLYPHS, ASPECTS, type HouseSystem,
} from "@/lib/western";
import { formatDegree, PLANET_GLYPHS } from "@/lib/vedic";
import { aiReading } from "@/lib/ai-cache";
import { useAutofillBirth } from "@/hooks/use-birth-profile";
import { Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/astrology")({
  component: () => (<PremiumGate featureName="Astrology"><AstrologyPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Western Astrology — TAROMAYA" },
      { name: "description", content: "Tropical natal chart with SVG wheel, aspects, aspect patterns, dominants, Arabic Lots, and fixed stars." },
    ],
  }),
});

const DEFAULT_FORM = {
  name: "", date: "1995-06-15", time: "07:45",
  tz: "5.5", lat: "28.6139", lon: "77.2090", place: "New Delhi, Delhi, India",
};

const ASPECT_COLORS: Record<string, string> = {
  conjunction: "text-gold",
  opposition: "text-red-400",
  trine: "text-cyan-300",
  square: "text-red-400",
  sextile: "text-sky-300",
  quincunx: "text-fuchsia-300",
  "semi-sextile": "text-emerald-300",
  "semi-square": "text-orange-300",
  sesquiquadrate: "text-orange-300",
  quintile: "text-violet-300",
};

function AstrologyPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  useAutofillBirth<typeof DEFAULT_FORM>(setForm);
  const [system, setSystem] = useState<HouseSystem>("placidus");
  const [chart, setChart] = useState<ReturnType<typeof computeWesternChart> | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ai = useServerFn(aiReading);

  const compute = () => {
    const [y, m, d] = form.date.split("-").map(Number);
    const [hh, mm] = form.time.split(":").map(Number);
    const c = computeWesternChart({
      year: y, month: m, day: d, hour: hh, minute: mm,
      tzOffsetHours: Number(form.tz),
      latitude: Number(form.lat), longitude: Number(form.lon),
    }, system);
    setChart(c);
    setReading(null);
  };

  const aspects = useMemo(() => (chart ? computeAspects(chart) : []), [chart]);
  const patterns = useMemo(() => detectPatterns(aspects), [aspects]);
  const shape = useMemo(() => (chart ? chartShape(chart) : null), [chart]);
  const dominants = useMemo(() => (chart ? computeDominants(chart) : null), [chart]);
  const lots = useMemo(() => (chart ? arabicLots(chart) : []), [chart]);
  const stars = useMemo(() => (chart ? fixedStarsNearPlanets(chart) : []), [chart]);

  const generateAiReading = async () => {
    if (!chart) return;
    setLoading(true);
    try {
      const planetsText = chart.tropicalPlanets.map((p) => {
        const s = Math.floor(p.tropicalLongitude / 30);
        return `${p.name} in ${SIGN_NAMES[s]} at ${formatDegree(p.tropicalLongitude - s * 30)}${p.retrograde ? " ℞" : ""}`;
      }).join("; ");
      const majorAspects = aspects.filter((h) => ASPECTS[h.type].kind === "major")
        .map((h) => `${h.a} ${h.type} ${h.b} (orb ${h.orb.toFixed(1)}°)`).join("; ");
      const res = await ai({
        data: {
          system: "You are a master Western astrologer writing luxurious, poetic yet precise natal chart readings. Use markdown, elegant paragraphs, no lists longer than 4 items.",
          prompt: `Write a natal chart reading (~500 words).
Ascendant: ${SIGN_NAMES[Math.floor(chart.tropicalAscendant / 30)]}
Sun/Moon/Rising signature: ${dominants?.signature}
Chart shape: ${shape?.name}.
Planets: ${planetsText}.
Major aspects: ${majorAspects}.
Aspect patterns: ${patterns.map((p) => p.name).join(", ") || "none"}.
Structure: Overall Signature, Core Trinity (Sun · Moon · Rising), Chart Shape & Dominants, Key Aspects & Patterns, Life Themes.`,
        },
      });
      setReading(res.text);
    } finally { setLoading(false); }
  };

  return (
    <PageShell
      eyebrow="Western Astrology"
      title="Natal Chart"
      subtitle="Tropical chart with aspects, patterns, dominants, Arabic Lots, and fixed stars."
    >
      <GlassCard title="Birth details">
        <BirthVoiceBox value={form} onChange={(p) => setForm((prev) => ({ ...prev, ...p }))} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">House system</span>
            <select
              value={system}
              onChange={(e) => setSystem(e.target.value as HouseSystem)}
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50"
            >
              <option value="placidus">Placidus</option>
              <option value="whole-sign">Whole Sign</option>
              <option value="equal">Equal House</option>
            </select>
          </label>
        </div>
        <button
          onClick={compute}
          className="mt-6 rounded-full bg-gradient-to-r from-gold to-gold-soft px-8 py-3 text-sm font-medium text-primary-foreground"
        >
          Cast chart
        </button>
      </GlassCard>

      {chart && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,520px)_1fr]">
          <GlassCard>
            <WheelChart chart={chart} />
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
              <div><span className="text-muted-foreground">Ascendant</span> <span className="gold-text">{SIGN_NAMES[Math.floor(chart.tropicalAscendant / 30)]} {formatDegree(chart.tropicalAscendant - Math.floor(chart.tropicalAscendant/30)*30)}</span></div>
              <div><span className="text-muted-foreground">MC</span> <span className="gold-text">{SIGN_NAMES[Math.floor(chart.midheaven / 30)]} {formatDegree(chart.midheaven - Math.floor(chart.midheaven/30)*30)}</span></div>
            </div>
          </GlassCard>

          <div className="space-y-4">
            <GlassCard title="Chart Signature">
              {dominants && (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Signature</div>
                    <div className="font-display text-2xl gold-text">{dominants.signature}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground mb-1">Elements</div>
                      {dominants.elements.map((e) => (
                        <div key={e.name} className="flex justify-between"><span>{e.name}</span><span className="gold-text">{e.count}</span></div>
                      ))}
                    </div>
        <div className="mt-3">
          <PlacePicker
            value={{ place: (form as Record<string,string>).place ?? "", lat: form.lat, lon: form.lon, tz: form.tz }}
            onChange={(pl) => setForm((f) => ({ ...f, place: pl.place, lat: pl.lat, lon: pl.lon, tz: pl.tz }))}
            forDate={form.date}
            forTime={form.time}
          />
        </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Modes</div>
                      {dominants.modes.map((m) => (
                        <div key={m.name} className="flex justify-between"><span>{m.name}</span><span className="gold-text">{m.count}</span></div>
                      ))}
                    </div>
                  </div>
                  {shape && (
                    <div>
                      <div className="text-xs text-muted-foreground">Chart shape</div>
                      <div className="text-sm text-pearl">{shape.name} — <span className="text-muted-foreground">{shape.description}</span></div>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>

            <GlassCard title="Planets">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="text-left py-1.5">Planet</th>
                      <th className="text-left">Sign</th>
                      <th className="text-left">Degree</th>
                      <th className="text-left">House</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.tropicalPlanets.map((p) => {
                      const s = Math.floor(p.tropicalLongitude / 30);
                      const h = houseOfLongitude(p.tropicalLongitude, chart.cusps) + 1;
                      return (
                        <tr key={p.name} className="border-t border-white/5">
                          <td className="py-1.5"><span className="gold-text mr-1">{PLANET_GLYPHS[p.name]}</span>{p.name}{p.retrograde && <span className="text-cyan-300 ml-1">℞</span>}</td>
                          <td>{SIGN_GLYPHS[s]} {SIGN_NAMES[s]}</td>
                          <td className="font-mono">{formatDegree(p.tropicalLongitude - s * 30)}</td>
                          <td>{h}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {chart && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <GlassCard title="Aspects">
            <div className="max-h-96 overflow-y-auto text-xs">
              <table className="w-full">
                <tbody>
                  {aspects.map((h, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-1.5">{PLANET_GLYPHS[h.a]} {h.a}</td>
                      <td className={ASPECT_COLORS[h.type]}>{h.type}</td>
                      <td>{PLANET_GLYPHS[h.b]} {h.b}</td>
                      <td className="text-muted-foreground text-right font-mono">{h.orb.toFixed(1)}°</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard title="Aspect Patterns">
            {patterns.length === 0 ? (
              <div className="text-sm text-muted-foreground">No major patterns detected.</div>
            ) : (
              <div className="space-y-3">
                {patterns.map((p, i) => (
                  <div key={i} className="rounded-xl bg-white/5 p-3">
                    <div className="font-display text-lg gold-text">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.planets.join(" · ")}</div>
                    <div className="mt-1 text-xs">{p.description}</div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard title="Arabic Lots">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {lots.map((l) => {
                const s = Math.floor(l.longitude / 30);
                return (
                  <div key={l.name} className="rounded-xl bg-white/5 p-3">
                    <div className="gold-text">{l.name}</div>
                    <div className="text-pearl">{SIGN_GLYPHS[s]} {SIGN_NAMES[s]} {formatDegree(l.longitude - s * 30)}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{l.meaning}</div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard title="Fixed Stars Conjunct Planets">
            {stars.length === 0 ? (
              <div className="text-sm text-muted-foreground">No fixed-star conjunctions within 1.5°.</div>
            ) : (
              <div className="space-y-2 text-xs">
                {stars.map((s, i) => (
                  <div key={i} className="rounded-xl bg-white/5 p-3">
                    <div><span className="gold-text">{s.star}</span> conj {PLANET_GLYPHS[s.planet]} {s.planet} <span className="text-muted-foreground">(orb {s.orb.toFixed(1)}°)</span></div>
                    <div className="text-muted-foreground mt-0.5">{s.meaning}</div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {chart && (
        <div className="mt-6">
          <GlassCard title="AI Reading">
            {!reading && !loading && (
              <button
                onClick={generateAiReading}
                className="rounded-full bg-gradient-to-r from-gold to-gold-soft px-6 py-2.5 text-sm font-medium text-primary-foreground inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Generate reading
              </button>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Consulting the stars…
              </div>
            )}
            {reading && (
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{reading}</div>
            )}
          </GlassCard>
        </div>
      )}
    </PageShell>
  );
}
