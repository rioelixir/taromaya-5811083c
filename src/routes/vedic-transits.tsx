import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import {
  computeKundli, RASHIS, PLANET_GLYPHS, formatDegree, type PlanetName,
} from "@/lib/vedic";
import { computeVimshottari } from "@/lib/vedic-extended";
import { computeVedicTransits, type VedicTransitReport } from "@/lib/vedic-transits";
import { RefreshCw, ShieldCheck, ShieldAlert, Moon, Flame, Sparkles, Compass } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/vedic-transits")({
  component: () => (<PremiumGate featureName="Vedic Transits"><VedicTransitsPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Vedic Transits (Gochara) — TAROMAYA" },
      { name: "description", content: "Live Gochara from Moon, Sade Sati arc, Kantaka Shani, Ashtakavarga transit strength, and Dasha-resonance transits." },
    ],
  }),
});

const DEFAULT_FORM = { name: "", date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090" };

function VedicTransitsPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  useAutofillBirth<typeof DEFAULT_FORM>(setForm);
  const [now, setNow] = useState(new Date());

  const natal = useMemo(() => {
    const [y, m, d] = form.date.split("-").map(Number);
    const [hh, mm] = form.time.split(":").map(Number);
    return computeKundli({
      year: y, month: m, day: d, hour: hh, minute: mm,
      tzOffsetHours: Number(form.tz),
      latitude: Number(form.lat), longitude: Number(form.lon),
    });
  }, [form]);

  const dasha = useMemo(() => {
    const [y, m, d] = form.date.split("-").map(Number);
    const [hh, mm] = form.time.split(":").map(Number);
    const utcMs = Date.UTC(y, m - 1, d, hh, mm) - Number(form.tz) * 3600_000;
    const birthDate = new Date(utcMs);
    const moonDegInNak = (natal.planets.find((p) => p.name === "Moon")!.longitude % (360 / 27));
    return computeVimshottari(birthDate, natal.moonNakshatra.index, moonDegInNak);
  }, [form, natal]);

  const report: VedicTransitReport = useMemo(
    () => computeVedicTransits(natal, Number(form.lat), Number(form.lon), dasha, now),
    [natal, form.lat, form.lon, dasha, now],
  );

  return (
    <PageShell
      eyebrow="Vedic Transits"
      title="Gochara — the sky over your Moon"
      subtitle="Classical Vedic transit rulings with Vedha, Sade Sati, Kantaka Shani, Ashtakavarga strength and live Dasha resonance."
    >
      <GlassCard title="Birth data">
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
          <div className="text-xs text-muted-foreground">
            <Moon className="inline w-3.5 h-3.5 mr-1 text-cyan-300" />
            Natal Moon: <span className="text-pearl">{RASHIS[report.moonRashi]}</span>
            <span className="ml-3">Snapshot: <span className="text-pearl">{now.toLocaleString()}</span></span>
          </div>
          <button onClick={() => setNow(new Date())}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-widest text-pearl hover:bg-white/10">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh sky
          </button>
        </div>
      </GlassCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <GlassCard title="Sade Sati">
          {!report.sadeSati.active ? (
            <div className="text-sm text-muted-foreground">Saturn is not currently in the 12th, 1st, or 2nd from your natal Moon — Sade Sati is dormant.</div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                <span className="text-pearl">Active — {report.sadeSati.phase} phase</span>
                <span className="ml-auto text-[10px] uppercase tracking-widest text-gold">{report.sadeSati.intensity}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Approx. {report.sadeSati.approxStart.toLocaleDateString()} → {report.sadeSati.approxEnd.toLocaleDateString()}
              </div>
              <div className="text-xs text-muted-foreground">
                About <span className="text-pearl font-medium">{report.sadeSati.yearsRemaining.toFixed(1)} years</span> remaining.
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard title="Kantaka Shani">
          {report.kantakaShani.active ? (
            <div className="flex items-start gap-2 text-sm">
              <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5" />
              <div>
                <div className="text-pearl">Saturn transiting the {report.kantakaShani.house}th house from Moon.</div>
                <div className="text-xs text-muted-foreground mt-1">A period of obstacles — patience, discipline and karmic clearing bring the reward.</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span className="text-muted-foreground">Saturn is not in a Kantaka house.</span>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="mt-6">
        <GlassCard title="Gochara — planets from your Moon">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            {report.transits.map((t) => (
              <div key={t.planet} className={`rounded-xl p-3 border ${
                t.favorable && !t.vedhaBy ? "border-emerald-300/30 bg-emerald-400/5"
                : t.vedhaBy ? "border-orange-300/30 bg-orange-400/5"
                : "border-white/10 bg-white/5"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="gold-text font-serif text-lg">{PLANET_GLYPHS[t.planet]}</span>
                  <span className="text-pearl font-medium">{t.planet}</span>
                  {t.retrograde && <span className="text-cyan-300 text-[10px]">℞</span>}
                  <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">H{t.houseFromMoon} from Moon</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {RASHIS[t.transitRashi]} · {formatDegree(t.degreeInRashi)}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {t.favorable
                    ? <span className="inline-flex items-center gap-1 text-emerald-300"><ShieldCheck className="w-3 h-3" /> Benefic</span>
                    : <span className="inline-flex items-center gap-1 text-muted-foreground">Neutral / Testing</span>}
                  {t.vedhaBy && (
                    <span className="inline-flex items-center gap-1 text-orange-300">
                      <ShieldAlert className="w-3 h-3" /> Vedha by {t.vedhaBy}
                    </span>
                  )}
                  {typeof t.bindus === "number" && (
                    <span className={`ml-auto font-mono ${t.strong ? "text-gold" : "text-muted-foreground"}`}>
                      AV {t.bindus}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="mt-6">
        <GlassCard title="Dasha resonance">
          {report.activeDashaLords.length === 0 ? (
            <div className="text-sm text-muted-foreground">No Dasha context.</div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                Running: <span className="text-pearl">{report.activeDashaLords[0]}</span> Maha ·
                <span className="text-pearl"> {report.activeDashaLords[1]}</span> Antar ·
                <span className="text-pearl"> {report.activeDashaLords[2]}</span> Pratyantar
              </div>
              {report.dashaResonance.length === 0 ? (
                <div className="text-sm text-muted-foreground">None of the current Dasha lords are highlighted by today's gochara — a quieter karmic register.</div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {report.dashaResonance.map((t) => (
                    <li key={t.planet} className="flex items-center gap-2 rounded-xl bg-white/5 p-2.5">
                      <Compass className="w-3.5 h-3.5 text-gold" />
                      <span className="gold-text font-serif text-lg">{PLANET_GLYPHS[t.planet as PlanetName]}</span>
                      <span className="text-pearl">{t.planet}</span>
                      <span className="text-xs text-muted-foreground">{RASHIS[t.transitRashi]} · H{t.houseFromMoon}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-widest text-gold">Dasha-active</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </GlassCard>
      </div>
    </PageShell>
  );
}
