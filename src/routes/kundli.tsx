import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import {
  computeKundli, formatDegree, lahiriAyanamsa,
  NAKSHATRAS, PLANET_SHORT, RASHIS, RASHI_LORDS,
  type KundliChart, type PlanetName,
} from "@/lib/vedic";
import { interpretKundli } from "@/lib/kundli.functions";
import { Sparkles, Loader2, MapPin } from "lucide-react";

export const Route = createFileRoute("/kundli")({
  component: KundliPage,
  head: () => ({
    meta: [
      { title: "Kundli — TAROMAYA" },
      { name: "description", content: "Vedic birth chart with sidereal planetary positions, nakshatras, and AI interpretation. Runs privately in your browser." },
    ],
  }),
});

type FormState = {
  name: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  tz: string;   // e.g. 5.5
  lat: string;
  lon: string;
  place: string;
};

const DEFAULTS: FormState = {
  name: "",
  date: "1995-06-15",
  time: "07:45",
  tz: "5.5",
  lat: "28.6139",
  lon: "77.2090",
  place: "New Delhi, India",
};

function KundliPage() {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [chart, setChart] = useState<KundliChart | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const interpret = useServerFn(interpretKundli);

  const canSubmit = useMemo(() => {
    return !!(form.date && form.time && form.tz && form.lat && form.lon);
  }, [form]);

  const compute = () => {
    setError(null);
    setReading(null);
    try {
      const [y, m, d] = form.date.split("-").map(Number);
      const [hh, mm] = form.time.split(":").map(Number);
      const c = computeKundli({
        year: y, month: m, day: d,
        hour: hh, minute: mm,
        tzOffsetHours: Number(form.tz),
        latitude: Number(form.lat),
        longitude: Number(form.lon),
      });
      setChart(c);
      void requestReading(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not compute chart.");
    }
  };

  const requestReading = async (c: KundliChart) => {
    setLoadingReading(true);
    try {
      const res = await interpret({
        data: {
          name: form.name,
          ascendant: {
            rashi: RASHIS[c.ascendant.rashi],
            degree: formatDegree(c.ascendant.degreeInRashi),
          },
          moonNakshatra: {
            name: NAKSHATRAS[c.moonNakshatra.index],
            pada: c.moonNakshatra.pada,
            lord: c.moonNakshatra.lord,
          },
          planets: c.planets.map((p) => ({
            name: p.name,
            rashi: RASHIS[p.rashi],
            house: ((p.rashi - c.ascendant.rashi + 12) % 12) + 1,
            degree: formatDegree(p.degreeInRashi),
            nakshatra: NAKSHATRAS[p.nakshatra],
            retrograde: p.retrograde,
          })),
        },
      });
      setReading(res.text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Reading failed.";
      if (msg.includes("429")) setError("The stars are busy — try again shortly.");
      else if (msg.includes("402")) setError("AI credits exhausted. Please add credits.");
      else setError(msg);
    } finally {
      setLoadingReading(false);
    }
  };

  return (
    <PageShell
      eyebrow="Vedic Kundli"
      title="Your birth chart"
      subtitle="Sidereal Lahiri calculations, whole-sign houses. All math runs privately in your browser."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <GlassCard title="Birth details">
          <div className="grid gap-3">
            <Field label="Name (optional)">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                placeholder="Your name"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Time (24h)">
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <Field label="Timezone offset (hours from UTC)">
              <input value={form.tz} onChange={(e) => setForm({ ...form, tz: e.target.value })} className={inputCls} placeholder="5.5" inputMode="decimal" />
            </Field>
            <Field label="Place (for your reference)">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} className={inputCls + " pl-9"} placeholder="City, Country" />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude">
                <input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className={inputCls} inputMode="decimal" />
              </Field>
              <Field label="Longitude">
                <input value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })} className={inputCls} inputMode="decimal" />
              </Field>
            </div>
            <button
              disabled={!canSubmit}
              onClick={compute}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium py-3 disabled:opacity-40 hover:brightness-110 transition"
            >
              <Sparkles className="h-4 w-4" /> Compute chart
            </button>
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-200">
                {error}
              </div>
            )}
          </div>
        </GlassCard>

        <div className="space-y-6">
          {chart ? (
            <>
              <GlassCard>
                <SouthIndianChart chart={chart} />
              </GlassCard>
              <ChartSummary chart={chart} />
            </>
          ) : (
            <GlassCard title="Waiting for your details" desc="Enter your birth date, time, and coordinates. Whole-sign chart and AI reading will appear here.">
              <div className="mt-4 aspect-square rounded-2xl border border-white/10 bg-black/20 grid place-items-center text-muted-foreground text-sm">
                Chart preview
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {chart && (
        <GlassCard>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold/80">
            <Sparkles className="h-3.5 w-3.5" /> AI Reading
          </div>
          {loadingReading && !reading && (
            <div className="mt-6 flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading your chart…
            </div>
          )}
          {reading && (
            <div className="mt-4"><Markdown text={reading} /></div>
          )}
        </GlassCard>
      )}

      {chart && <PlanetTable chart={chart} />}
    </PageShell>
  );
}

const inputCls =
  "w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}

// South Indian chart layout. Rashi position is fixed; planets move.
// Grid indices → rashi index (0=Aries).
const CELL_TO_RASHI: Record<string, number> = {
  "0-0": 11, "0-1": 0, "0-2": 1, "0-3": 2,
  "1-0": 10,               "1-3": 3,
  "2-0": 9,                "2-3": 4,
  "3-0": 8, "3-1": 7, "3-2": 6, "3-3": 5,
};

function SouthIndianChart({ chart }: { chart: KundliChart }) {
  const planetsByRashi = new Map<number, { name: PlanetName; retrograde: boolean }[]>();
  for (const p of chart.planets) {
    const arr = planetsByRashi.get(p.rashi) ?? [];
    arr.push({ name: p.name, retrograde: p.retrograde });
    planetsByRashi.set(p.rashi, arr);
  }

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
        Rashi Chart · South Indian
      </div>
      <div className="grid grid-cols-4 grid-rows-4 aspect-square rounded-2xl overflow-hidden border border-gold/30 bg-black/40">
        {Array.from({ length: 16 }).map((_, i) => {
          const r = Math.floor(i / 4);
          const c = i % 4;
          const key = `${r}-${c}`;
          const rashi = CELL_TO_RASHI[key];
          const isCenter = rashi === undefined;
          if (isCenter) {
            // Draw center only once at cell (1,1); skip others.
            if (r === 1 && c === 1) {
              return (
                <div
                  key={i}
                  className="col-span-2 row-span-2 grid place-items-center text-center border border-gold/20 bg-gradient-to-br from-midnight/40 to-cosmic/60"
                >
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-gold/70">Lagna</div>
                    <div className="font-display text-xl text-pearl mt-1">
                      {RASHIS[chart.ascendant.rashi]}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {formatDegree(chart.ascendant.degreeInRashi)}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }
          const isAsc = rashi === chart.ascendant.rashi;
          const planets = planetsByRashi.get(rashi) ?? [];
          const houseNo = ((rashi - chart.ascendant.rashi + 12) % 12) + 1;
          return (
            <div
              key={i}
              className={`relative border border-white/10 p-1.5 text-[10px] ${
                isAsc ? "bg-gold/[0.06]" : "bg-white/[0.015]"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  {RASHIS[rashi].slice(0, 3)}
                </span>
                <span className={`text-[9px] ${isAsc ? "text-gold" : "text-muted-foreground/60"}`}>
                  {isAsc ? "As · " : ""}H{houseNo}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {planets.map((p) => (
                  <span
                    key={p.name}
                    className="inline-flex items-baseline rounded-md px-1 py-0.5 bg-white/5 text-pearl text-[10px]"
                    title={p.name}
                  >
                    {PLANET_SHORT[p.name]}{p.retrograde ? "ᴿ" : ""}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <div>Ayanamsa (Lahiri): <span className="text-pearl">{chart.ayanamsa.toFixed(4)}°</span></div>
        <div>Moon Nakshatra: <span className="text-pearl">{NAKSHATRAS[chart.moonNakshatra.index]} · pada {chart.moonNakshatra.pada}</span></div>
      </div>
    </div>
  );
}

function ChartSummary({ chart }: { chart: KundliChart }) {
  const lagna = RASHIS[chart.ascendant.rashi];
  const lord = RASHI_LORDS[chart.ascendant.rashi];
  const nak = NAKSHATRAS[chart.moonNakshatra.index];
  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat label="Lagna" value={lagna} sub={formatDegree(chart.ascendant.degreeInRashi)} />
      <Stat label="Lagna lord" value={lord} sub="Guiding planet" />
      <Stat label="Janma Nakshatra" value={nak} sub={`Pada ${chart.moonNakshatra.pada} · ${chart.moonNakshatra.lord}`} />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg text-pearl">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function PlanetTable({ chart }: { chart: KundliChart }) {
  return (
    <GlassCard title="Planetary positions" desc="Sidereal longitudes, whole-sign house, nakshatra, and motion.">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="py-2 pr-3">Planet</th>
              <th className="py-2 pr-3">Rashi</th>
              <th className="py-2 pr-3">Degree</th>
              <th className="py-2 pr-3">House</th>
              <th className="py-2 pr-3">Nakshatra</th>
              <th className="py-2 pr-3">Motion</th>
            </tr>
          </thead>
          <tbody className="text-pearl/90">
            {chart.planets.map((p) => {
              const house = ((p.rashi - chart.ascendant.rashi + 12) % 12) + 1;
              return (
                <tr key={p.name} className="border-t border-white/5">
                  <td className="py-2 pr-3">{p.name}</td>
                  <td className="py-2 pr-3">{RASHIS[p.rashi]}</td>
                  <td className="py-2 pr-3">{formatDegree(p.degreeInRashi)}</td>
                  <td className="py-2 pr-3">{house}</td>
                  <td className="py-2 pr-3">{NAKSHATRAS[p.nakshatra]} · {p.pada}</td>
                  <td className="py-2 pr-3">
                    {p.retrograde ? <span className="text-aurora">Retrograde</span> : <span className="text-muted-foreground">Direct</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((ln, i) => {
        if (ln.startsWith("### ")) {
          return <h3 key={i} className="mt-4 font-display text-lg text-gold">{ln.slice(4)}</h3>;
        }
        if (ln.startsWith("- ")) {
          return <p key={i} className="text-pearl/90 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gold">{renderInline(ln.slice(2))}</p>;
        }
        if (ln.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} className="text-pearl/90 leading-relaxed">{renderInline(ln)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="text-pearl">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

// Silence unused-import warning; keep import for potential future use.
void lahiriAyanamsa;
