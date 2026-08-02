import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { BirthVoiceBox } from "@/components/birth-voice-box";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli } from "@/lib/vedic";
import { analyseSadeSati } from "@/lib/dosha-windows";
import { computeSadeSati } from "@/lib/vedic-transits";
import { AlertTriangle, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/sadesati")({
  component: () => (
    <PremiumGate featureName="Sade Sati">
      <SadeSatiPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Sade Sati Tracker — TAROMAYA" },
      { name: "description", content: "Track Shani's 7.5-year transit across your natal Moon: past, current and future Sade Sati windows with remedies." },
    ],
  }),
});

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090", place: "New Delhi, Delhi, India" };

function fmt(d: Date): string {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function SadeSatiPage() {
  const [form, setForm] = useState(DEFAULT);
  useAutofillBirth<typeof DEFAULT>(setForm);

  const data = useMemo(() => {
    try {
      const [y, m, d] = form.date.split("-").map(Number);
      const [hh, mm] = form.time.split(":").map(Number);
      const chart = computeKundli({
        year: y, month: m, day: d, hour: hh, minute: mm,
        tzOffsetHours: Number(form.tz),
        latitude: Number(form.lat), longitude: Number(form.lon),
      });
      const moon = chart.planets.find((p) => p.name === "Moon")!;
      return {
        moonSign: moon.rashi,
        info: computeSadeSati(moon.rashi),
        analysis: analyseSadeSati(moon.rashi),
      };
    } catch { return null; }
  }, [form]);

  return (
    <PageShell
      eyebrow="Sade Sati"
      title="Shani's 7½-year transit"
      subtitle="The three phases of Saturn crossing the 12th, 1st and 2nd houses from your natal Moon — the classical Vedic maturation cycle."
    >
      <GlassCard title="Birth data">
        <BirthVoiceBox value={form} onChange={(p) => setForm((prev) => ({ ...prev, ...p }))} />
      </GlassCard>

      {data && (
        <>
          <div className="mt-6 glass rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className={`h-14 w-14 rounded-full grid place-items-center ${data.info.active ? "bg-rose-500/20 ring-2 ring-rose-400/60" : "bg-emerald-500/20 ring-2 ring-emerald-400/60"}`}>
                {data.info.active ? <AlertTriangle className="h-6 w-6 text-rose-300" /> : <CheckCircle2 className="h-6 w-6 text-emerald-300" />}
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-[0.35em] text-gold/80">Right now</div>
                <div className="font-display text-3xl gold-text mt-1">
                  {data.info.active ? `${data.info.phase} phase · ${data.info.intensity}` : "Not in Sade Sati"}
                </div>
                {data.info.active && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Approx window: {fmt(data.info.approxStart)} — {fmt(data.info.approxEnd)} ·
                    <span className="text-pearl"> {data.info.yearsRemaining.toFixed(1)} yrs remaining</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {data.analysis.windows.map((w, i) => (
              <div key={i} className={`glass rounded-2xl p-5 flex items-start gap-3 ${w.active ? "ring-1 ring-gold/50" : ""}`}>
                <Clock className={`h-4 w-4 mt-1 ${w.active ? "text-gold" : "text-muted-foreground"}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="font-display text-lg gold-text">{w.phase} phase</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">
                      {fmt(w.start)} → {fmt(w.end)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {w.phase === "Rising" && "Saturn enters the 12th from natal Moon — hidden losses, spiritual restructuring, insomnia."}
                    {w.phase === "Peak" && "Saturn crosses the natal Moon itself — emotional maturity, isolation, identity reforge."}
                    {w.phase === "Setting" && "Saturn moves into the 2nd — finances, family and speech are refined; the tide turns."}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 glass rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-gold" />
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Remedies</div>
            </div>
            <ul className="space-y-2 text-sm text-pearl">
              {[
                "Light a mustard-oil lamp on Saturdays under a Peepal tree.",
                "Chant Shani Beej mantra: Om Praam Preem Praum Sah Shanicharaya Namah — 108 daily.",
                "Recite Hanuman Chalisa on Tuesdays and Saturdays.",
                "Donate black sesame, iron, black cloth, mustard oil to labourers on Saturdays.",
                "Wear blue sapphire only after strict testing — otherwise use an iron horseshoe ring.",
              ].map((r, i) => (
                <li key={i} className="flex gap-2"><span className="text-gold">•</span><span className="text-muted-foreground/90">{r}</span></li>
              ))}
            </ul>
          </div>
        </>
      )}
    </PageShell>
  );
}
