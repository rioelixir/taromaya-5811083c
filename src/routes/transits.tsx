import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { PlacePicker } from "@/components/place-picker";
import { useMemo, useState } from "react";
import { Explain } from "@/components/explain";
import { ConfidenceNote } from "@/components/confidence-note";
import { CrossCheckPanel } from "@/components/cross-check-panel";
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
import { ForecastStrip } from "@/components/forecast-strip";
import { Loader2, Sparkles, RefreshCw, RotateCcw, ArrowRight, Eclipse, CalendarRange } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/transits")({
  component: () => (<PremiumGate featureName="Transits"><TransitsPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Transits — TAROMAYA" },
      { name: "description", content: "Live planetary transits over your natal chart with bi-wheel, key aspects and AI forecast." },
    ],
  }),
});

const DEFAULT_FORM = { name: "", date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090", place: "New Delhi, Delhi, India" };
const ASPECT_COLORS: Record<string, string> = {
  conjunction: "text-gold", opposition: "text-red-400", trine: "text-cyan-300",
  square: "text-red-400", sextile: "text-sky-300", quincunx: "text-fuchsia-300",
  "semi-sextile": "text-emerald-300", "semi-square": "text-orange-300",
  sesquiquadrate: "text-orange-300", quintile: "text-violet-300",
};

function TransitsPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  useAutofillBirth<typeof DEFAULT_FORM>(setForm);
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
            ].map(([label, key, type]) => (
            <label key={key} className="block">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
              <input type={type} value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50" />
            </label>
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
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="text-xs text-muted-foreground">Snapshot moment: <span className="text-pearl">{now.toLocaleString()}</span></div>
          <button onClick={() => setNow(new Date())}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-widest text-pearl hover:bg-white/10">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh sky
          </button>
        </div>
      </GlassCard>

      <GlassCard title="In plain English" className="mt-6">
        <p className="text-sm text-muted-foreground">
          Transits show how today's planets interact with the fixed planets from your birth chart. When a
          moving planet lines up closely with one of your birth planets, it "activates" that part of your
          life for a while. Below, the wheel shows the two charts overlaid, a plain list of the strongest
          current transits, and — further down — full technical tables of every aspect, station, sign
          change and eclipse over the coming months.
        </p>
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
                      <Explain term="aspect" className={`text-xs uppercase tracking-widest ${ASPECT_COLORS[h.type]}`} showIcon={false}>{h.type}</Explain>
                      <span className="text-cyan-300 font-serif text-lg">{PLANET_GLYPHS[h.natal]}</span>
                      <span className="text-cyan-300">{h.natal}</span>
                    </div>
                    <Explain term="orb" className="text-xs text-muted-foreground font-mono" showIcon={false}>{h.orb.toFixed(2)}°</Explain>
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
                    <div className="text-muted-foreground">
                      <Explain term="house" showIcon={false}>House {h.house}</Explain> · {formatDegree(h.longitude - s * 30)}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="mt-6">
        <GlassCard title="All active aspects (tight orbs)" desc="Tap an aspect name or an orb to see what it means, from simple to advanced, with the exact formula.">
          <div className="max-h-80 overflow-y-auto text-xs">
            {hits.length === 0 ? <div className="text-muted-foreground">Sky is quiet.</div> : (
              <table className="w-full">
                <tbody>
                  {hits.map((h, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-1.5">{PLANET_GLYPHS[h.transit]} {h.transit}</td>
                      <td className={ASPECT_COLORS[h.type]}><Explain term="aspect" showIcon={false}>{h.type}</Explain></td>
                      <td>{PLANET_GLYPHS[h.natal]} natal {h.natal}</td>
                      <td className="text-right text-muted-foreground font-mono"><Explain term="orb" showIcon={false}>{h.orb.toFixed(2)}°</Explain></td>
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
              <Sparkles className="w-4 h-4" /> Create forecast
            </button>
          )}
          {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Reading the sky…</div>}
          {aiText && <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{aiText}</div>}
        </GlassCard>
      </div>

      <ConfidenceNote noteKey="transits" className="mt-6" />

      <CrossCheckPanel
        className="mt-4"
        input={{
          year: Number(form.date.split("-")[0]),
          month: Number(form.date.split("-")[1]),
          day: Number(form.date.split("-")[2]),
          hour: Number(form.time.split(":")[0]),
          minute: Number(form.time.split(":")[1]),
          tzOffsetHours: Number(form.tz),
          latitude: Number(form.lat),
          longitude: Number(form.lon),
          now,
        }}
      />

      <TransitTimeline
        natalPlanets={natal.tropicalPlanets.map((p) => ({ name: p.name, longitude: p.tropicalLongitude }))}
      />
    </PageShell>
  );
}

function TransitTimeline({ natalPlanets }: { natalPlanets: { name: import("@/lib/vedic").PlanetName; longitude: number }[] }) {
  const [months, setMonths] = useState(12);
  const now = useMemo(() => new Date(), []);
  const end = useMemo(() => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + months);
    return d;
  }, [now, months]);

  const stations = useMemo<Station[]>(() => findStations(now, end), [now, end]);
  const ingresses = useMemo<Ingress[]>(() => findIngresses(now, end), [now, end]);
  const eclipses = useMemo<EclipseEvent[]>(() => findEclipses(now, end), [now, end]);
  const hits = useMemo<TimelineHit[]>(
    () => findAspectHits(natalPlanets, now, end, ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"]),
    [natalPlanets, now, end],
  );

  return (
    <div className="mt-6 space-y-6">
      <GlassCard title="Timeline">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarRange className="w-4 h-4 text-gold" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Window</span>
          {[3, 6, 12, 24].map((m) => (
            <button key={m} onClick={() => setMonths(m)}
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest ${
                months === m ? "gold-border bg-gold/15 text-pearl" : "border border-white/10 text-muted-foreground"
              }`}>
              {m}mo
            </button>
          ))}
          <div className="ml-auto text-xs text-muted-foreground">
            {fmtDay(now)} → {fmtDay(end)}
          </div>
        </div>
      </GlassCard>

      <ForecastStrip
        start={now} end={end}
        hits={hits} stations={stations} ingresses={ingresses} eclipses={eclipses}
      />


      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard title="Retrograde stations">
          {stations.length === 0 ? <Empty label="No stations in window." /> : (
            <ul className="divide-y divide-white/5 text-sm">
              {stations.map((s, i) => (
                <li key={i} className="py-2 flex items-center gap-2">
                  <RotateCcw className={`w-3.5 h-3.5 ${s.kind === "retrograde" ? "text-red-400" : "text-emerald-300"}`} />
                  <span className="gold-text font-serif">{PLANET_GLYPHS[s.planet]}</span>
                  <span className="text-pearl">{s.planet}</span>
                  <span className={`text-xs uppercase tracking-widest ${s.kind === "retrograde" ? "text-red-400" : "text-emerald-300"}`}>
                    stations {s.kind}
                  </span>
                  <span className="text-xs text-muted-foreground">in {s.sign} · {formatDegree(s.longitude - Math.floor(s.longitude / 30) * 30)}</span>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">{fmtDay(s.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard title="Sign ingresses">
          {ingresses.length === 0 ? <Empty label="No ingresses in window." /> : (
            <ul className="divide-y divide-white/5 text-sm max-h-96 overflow-y-auto">
              {ingresses.map((g, i) => (
                <li key={i} className="py-2 flex items-center gap-2">
                  <span className="gold-text font-serif">{PLANET_GLYPHS[g.planet]}</span>
                  <span className="text-pearl">{g.planet}</span>
                  <span className="text-muted-foreground text-xs">{g.fromSign}</span>
                  <ArrowRight className="w-3 h-3 text-gold" />
                  <span className="text-pearl text-xs">{g.toSign}</span>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">{fmtDay(g.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard title="Eclipses">
          {eclipses.length === 0 ? <Empty label="No eclipses in window." /> : (
            <ul className="divide-y divide-white/5 text-sm">
              {eclipses.map((e, i) => (
                <li key={i} className="py-2 flex items-center gap-2">
                  <Eclipse className={`w-3.5 h-3.5 ${e.kind === "solar" ? "text-gold" : "text-cyan-300"}`} />
                  <span className={`text-xs uppercase tracking-widest ${e.kind === "solar" ? "text-gold" : "text-cyan-300"}`}>
                    {e.kind} · {e.variety}
                  </span>
                  {typeof e.obscuration === "number" && (
                    <span className="text-xs text-muted-foreground">· {(e.obscuration * 100).toFixed(0)}%</span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground font-mono">{fmtDay(e.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard title="Exact aspect hits (Mars · Jupiter · Saturn → natal)">
          {hits.length === 0 ? <Empty label="No aspect peaks in window." /> : (
            <ul className="divide-y divide-white/5 text-sm max-h-96 overflow-y-auto">
              {hits.map((h, i) => (
                <li key={i} className="py-2 flex items-center gap-2">
                  <span className="gold-text font-serif">{PLANET_GLYPHS[h.transit]}</span>
                  <span className="text-pearl">{h.transit}</span>
                  <span className={`text-xs uppercase tracking-widest ${ASPECT_COLORS[h.type] ?? "text-muted-foreground"}`}>{h.type}</span>
                  <span className="text-cyan-300 font-serif">{PLANET_GLYPHS[h.natal]}</span>
                  <span className="text-cyan-300">{h.natal}</span>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">{fmtDay(h.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="text-sm text-muted-foreground">{label}</div>;
}

