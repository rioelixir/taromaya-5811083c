import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, GlassCard } from "@/components/page-shell";
import { BiWheelChart } from "@/components/bi-wheel-chart";
import { computeWesternChart, SIGN_NAMES, SIGN_GLYPHS } from "@/lib/western";
import { computeCurrentSky, transitAspects, transitHouses, keyTransits } from "@/lib/transits";
import {
  findStations, findIngresses, findEclipses, findAspectHits, fmtDay,
  type Station, type Ingress, type EclipseEvent, type TimelineHit,
} from "@/lib/transits-timeline";
import { formatDegree, PLANET_GLYPHS } from "@/lib/vedic";
import { aiReading } from "@/lib/ai-reading.functions";
import { Loader2, Sparkles, RefreshCw, RotateCcw, ArrowRight, Eclipse, CalendarRange } from "lucide-react";

export const Route = createFileRoute("/transits")({
  component: () => (<PremiumGate featureName="Transits"><TransitsPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Transits — TAROMAYA" },
      { name: "description", content: "Live planetary transits over your natal chart with bi-wheel, key aspects and AI forecast." },
    ],
  }),
});

const DEFAULT_FORM = { name: "", date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090" };
const ASPECT_COLORS: Record<string, string> = {
  conjunction: "text-gold", opposition: "text-red-400", trine: "text-cyan-300",
  square: "text-red-400", sextile: "text-sky-300", quincunx: "text-fuchsia-300",
  "semi-sextile": "text-emerald-300", "semi-square": "text-orange-300",
  sesquiquadrate: "text-orange-300", quintile: "text-violet-300",
};

function TransitsPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [now, setNow] = useState(new Date());
  const [aiText, setAiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ai = useServerFn(aiReading);

  const natal = useMemo(() => {
    const [y, m, d] = form.date.split("-").map(Number);
    const [hh, mm] = form.time.split(":").map(Number);
    return computeWesternChart({
      year: y, month: m, day: d, hour: hh, minute: mm,
      tzOffsetHours: Number(form.tz),
      latitude: Number(form.lat), longitude: Number(form.lon),
    }, "placidus");
  }, [form]);

  const sky = useMemo(() => computeCurrentSky(now, Number(form.lat), Number(form.lon)), [now, form.lat, form.lon]);
  const hits = useMemo(() => transitAspects(natal, sky), [natal, sky]);
  const houses = useMemo(() => transitHouses(natal, sky), [natal, sky]);
  const highlights = useMemo(() => keyTransits(hits), [hits]);

  const outerPlanets = sky.tropicalPlanets.map((p) => ({
    name: p.name, longitude: p.tropicalLongitude, retrograde: p.retrograde,
  }));

  const generate = async () => {
    setLoading(true); setAiText(null);
    try {
      const list = highlights.map((h) => `${h.transit} ${h.type} natal ${h.natal} (orb ${h.orb.toFixed(1)}°)`).join("; ");
      const houseList = houses.map((h) => `${h.planet} in H${h.house}${h.retrograde ? " ℞" : ""}`).join(", ");
      const res = await ai({
        data: {
          system: "You are a modern Western astrologer writing luxurious, grounded transit forecasts. Use markdown; poetic yet precise. No disclaimers.",
          prompt: `Write a personal transit forecast (~400 words) for now (${now.toISOString()}).
Key transits to natal: ${list || "(no major slow-planet aspects at exact orb)"}.
Transiting planet houses in the native chart: ${houseList}.
Structure: ### The current sky, ### What's activating, ### Where the energy lands (houses), ### Guidance for the next weeks.`,
        },
      });
      setAiText(res.text);
    } finally { setLoading(false); }
  };

  return (
    <PageShell
      eyebrow="Transits"
      title="Living Sky over Your Chart"
      subtitle="Watch the current heavens rotate over your natal wheel — with aspects, house activations, and an AI forecast."
    >
      <GlassCard title="Your natal birth data">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Name", "name", "text"], ["Date", "date", "date"], ["Time", "time", "time"],
            ["Timezone offset", "tz", "text"], ["Latitude", "lat", "text"], ["Longitude", "lon", "text"],
          ].map(([label, key, type]) => (
            <label key={key} className="block">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
              <input type={type} value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50" />
            </label>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="text-xs text-muted-foreground">Snapshot moment: <span className="text-pearl">{now.toLocaleString()}</span></div>
          <button onClick={() => setNow(new Date())}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-widest text-pearl hover:bg-white/10">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh sky
          </button>
        </div>
      </GlassCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,560px)_1fr]">
        <GlassCard>
          <BiWheelChart chart={natal} outerPlanets={outerPlanets} outerLabel="Transiting" />
        </GlassCard>

        <div className="space-y-4">
          <GlassCard title="Key transits">
            {highlights.length === 0 ? (
              <div className="text-sm text-muted-foreground">No exact slow-planet aspects right now — a quieter moment.</div>
            ) : (
              <div className="space-y-2 text-sm">
                {highlights.map((h, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                    <div className="flex items-center gap-2">
                      <span className="gold-text font-serif text-lg">{PLANET_GLYPHS[h.transit]}</span>
                      <span className="text-pearl">{h.transit}</span>
                      <span className={`text-xs uppercase tracking-widest ${ASPECT_COLORS[h.type]}`}>{h.type}</span>
                      <span className="text-cyan-300 font-serif text-lg">{PLANET_GLYPHS[h.natal]}</span>
                      <span className="text-cyan-300">{h.natal}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{h.orb.toFixed(2)}°</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard title="Where planets are landing">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {houses.map((h) => {
                const s = Math.floor(h.longitude / 30);
                return (
                  <div key={h.planet} className="rounded-xl bg-white/5 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="gold-text font-serif">{PLANET_GLYPHS[h.planet]} {h.planet}</span>
                      {h.retrograde && <span className="text-cyan-300 text-[10px]">℞</span>}
                    </div>
                    <div className="text-pearl">{SIGN_GLYPHS[s]} {SIGN_NAMES[s]}</div>
                    <div className="text-muted-foreground">House {h.house} · {formatDegree(h.longitude - s * 30)}</div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="mt-6">
        <GlassCard title="All active aspects (tight orbs)">
          <div className="max-h-80 overflow-y-auto text-xs">
            {hits.length === 0 ? <div className="text-muted-foreground">Sky is quiet.</div> : (
              <table className="w-full">
                <tbody>
                  {hits.map((h, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-1.5">{PLANET_GLYPHS[h.transit]} {h.transit}</td>
                      <td className={ASPECT_COLORS[h.type]}>{h.type}</td>
                      <td>{PLANET_GLYPHS[h.natal]} natal {h.natal}</td>
                      <td className="text-right text-muted-foreground font-mono">{h.orb.toFixed(2)}°</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="mt-6">
        <GlassCard title="AI transit forecast">
          {!aiText && !loading && (
            <button onClick={generate}
              className="rounded-full bg-gradient-to-r from-gold to-gold-soft px-6 py-2.5 text-sm font-medium text-primary-foreground inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Generate forecast
            </button>
          )}
          {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Reading the sky…</div>}
          {aiText && <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{aiText}</div>}
        </GlassCard>
      </div>
    </PageShell>
  );
}
