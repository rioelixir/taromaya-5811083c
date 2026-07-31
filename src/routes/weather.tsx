import { createFileRoute } from "@tanstack/react-router";
import { DateSelect } from "@/components/date-select";
import { PremiumGate } from "@/components/premium-gate";
import { useMemo, useState } from "react";
import { CloudSun, Moon, Clock, Sun, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { dayAspectTimeline, moonVoidOfCourse, planetaryHours, signForecast, type AspectEvent } from "@/lib/cosmic-weather";
import { PLANET_GLYPHS, type PlanetName } from "@/lib/vedic";

export const Route = createFileRoute("/weather")({
  component: () => (<PremiumGate featureName="Cosmic Weather"><WeatherPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Cosmic Weather — TAROMAYA" },
      { name: "description", content: "Today's astrological weather: hourly Moon aspects, planetary hours, Moon void-of-course, and per-sign forecast." },
    ],
  }),
});

const ASPECT_GLYPH: Record<string, string> = {
  conjunction: "☌", sextile: "⚹", square: "□", trine: "△", opposition: "☍",
};

const TONE_STYLES: Record<AspectEvent["tone"], string> = {
  harmonious: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10",
  tense: "text-rose-300 border-rose-400/30 bg-rose-500/10",
  fusion: "text-gold border-gold/30 bg-gold/10",
  neutral: "text-white/70 border-white/10 bg-white/5",
};

const SIGN_TONE: Record<string, { color: string; label: string; icon: typeof TrendingUp }> = {
  great: { color: "text-emerald-300", label: "Radiant", icon: TrendingUp },
  good: { color: "text-cyan-300", label: "Flowing", icon: TrendingUp },
  mixed: { color: "text-white/70", label: "Mixed", icon: Minus },
  tense: { color: "text-rose-300", label: "Testing", icon: TrendingDown },
};

function fmtTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function WeatherPage() {
  const [day, setDay] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [lat, setLat] = useState(28.6139);
  const [lon, setLon] = useState(77.209);
  const [place, setPlace] = useState("New Delhi, India");

  const timeline = useMemo(() => dayAspectTimeline(day), [day]);
  const voc = useMemo(() => moonVoidOfCourse(day), [day]);
  const hours = useMemo(() => planetaryHours(day, lat, lon), [day, lat, lon]);
  const forecast = useMemo(() => signForecast(day), [day]);
  const now = new Date();
  const currentHour = hours.find(h => now >= h.start && now < h.end);

  return (
    <PageShell eyebrow="Phase 16 · Cosmic Weather" title="Cosmic Weather" subtitle={`The sky's forecast for ${day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}.`}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass gold-border">
            <CloudSun className="h-3.5 w-3.5 text-gold" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-gold">Live sky report</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <DateSelect
              label="Date"
              value={day.toISOString().slice(0, 10)}
              onChange={(v) => { if (!v) return; const nd = new Date(v); nd.setHours(0, 0, 0, 0); setDay(nd); }}
            />
            <button
              onClick={() => { const d = new Date(); d.setHours(0, 0, 0, 0); setDay(d); }}
              className="ml-auto px-4 py-2 rounded-lg glass gold-border text-gold text-sm hover:bg-gold/10"
            >Today</button>
          </div>
          <PlacePicker
            label="Which place?"
            value={{ place, lat: String(lat), lon: String(lon), tz: "0" }}
            onChange={(p) => { setPlace(p.place); setLat(parseFloat(p.lat) || 0); setLon(parseFloat(p.lon) || 0); }}
            forDate={day.toISOString().slice(0, 10)}
          />
        </div>

        {/* Now hour + VoC */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-6 gold-border">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold mb-2">
              <Clock className="h-3.5 w-3.5" /> Current Planetary Hour
            </div>
            {currentHour ? (
              <div>
                <div className="text-3xl font-display gold-text flex items-center gap-3">
                  <span className="text-4xl">{PLANET_GLYPHS[currentHour.ruler]}</span>
                  {currentHour.ruler}
                </div>
                <div className="text-sm text-white/60 mt-2">
                  {fmtTime(currentHour.start)} → {fmtTime(currentHour.end)} · {currentHour.isDay ? "Day" : "Night"} hour {(currentHour.index % 12) + 1}
                </div>
              </div>
            ) : (
              <div className="text-white/50 text-sm">Select today to see the active hour.</div>
            )}
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/70 mb-2">
              <Moon className="h-3.5 w-3.5" /> Moon Void-of-Course
            </div>
            {voc ? (
              <div>
                <div className="text-lg text-white">
                  {fmtTime(voc.start)} → {fmtTime(voc.end)}
                </div>
                <div className="text-xs text-white/50 mt-2">
                  Avoid launching new initiatives; favor reflection, rest, and finishing existing tasks.
                </div>
              </div>
            ) : (
              <div className="text-white/60 text-sm">Moon is aspecting other planets throughout the day — no significant VoC window.</div>
            )}
          </div>
        </div>

        {/* Aspect timeline */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="font-display text-xl gold-text tracking-wide">Aspect Timeline</h2>
            <span className="ml-auto text-xs text-white/50">{timeline.length} events</span>
          </div>
          {timeline.length === 0 ? (
            <div className="text-white/50 text-sm">A quiet day — no exact aspects perfect.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {timeline.map((e, i) => (
                <div key={i} className={`rounded-xl border px-3 py-2.5 ${TONE_STYLES[e.tone]}`}>
                  <div className="flex items-center gap-2 text-lg">
                    <span>{PLANET_GLYPHS[e.transit as PlanetName]}</span>
                    <span className="text-base opacity-80">{ASPECT_GLYPH[e.type]}</span>
                    <span>{PLANET_GLYPHS[e.natal as PlanetName]}</span>
                    <span className="ml-auto text-xs opacity-80">{fmtTime(e.when)}</span>
                  </div>
                  <div className="text-[11px] uppercase tracking-widest opacity-70 mt-1">
                    {e.transit} {e.type} {e.natal}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Planetary hours grid */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="h-4 w-4 text-gold" />
            <h2 className="font-display text-xl gold-text tracking-wide">Chaldean Planetary Hours</h2>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {hours.map((h) => {
              const active = now >= h.start && now < h.end;
              return (
                <div
                  key={h.index}
                  className={[
                    "rounded-lg px-2 py-2 text-center border transition",
                    active ? "gold-border bg-gold/10" : h.isDay ? "border-white/10 bg-white/5" : "border-white/5 bg-black/30",
                  ].join(" ")}
                >
                  <div className="text-lg">{PLANET_GLYPHS[h.ruler]}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/60 mt-1">{h.ruler}</div>
                  <div className="text-[10px] text-white/40 mt-1">{fmtTime(h.start)}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sign forecast */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-gold" />
            <h2 className="font-display text-xl gold-text tracking-wide">Per-Sign Forecast</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {forecast.map((s) => {
              const T = SIGN_TONE[s.tone];
              const Icon = T.icon;
              return (
                <div key={s.sign} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-lg text-white">{s.sign}</div>
                    <Icon className={`h-4 w-4 ${T.color}`} />
                  </div>
                  <div className={`text-xs uppercase tracking-widest mt-1 ${T.color}`}>{T.label}</div>
                  <div className="text-[10px] text-white/40 mt-1">score {s.score.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
