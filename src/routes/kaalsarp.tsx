import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { PlacePicker } from "@/components/place-picker";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli } from "@/lib/vedic";
import { analyzeKaalSarp } from "@/lib/kaalsarp";
import { Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/kaalsarp")({
  component: () => (
    <PremiumGate featureName="Kaal Sarp">
      <KaalSarpPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Kaal Sarp Dosha — TAROMAYA" },
      { name: "description", content: "Detect Kaal Sarp Dosha and its 12 classical variants, with the meaning of the Rahu-Ketu axis and traditional remedies." },
    ],
  }),
});

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090", place: "New Delhi, Delhi, India" };

function KaalSarpPage() {
  const [form, setForm] = useState(DEFAULT);
  useAutofillBirth<typeof DEFAULT>(setForm);

  const report = useMemo(() => {
    try {
      const [y, m, d] = form.date.split("-").map(Number);
      const [hh, mm] = form.time.split(":").map(Number);
      const chart = computeKundli({
        year: y, month: m, day: d, hour: hh, minute: mm,
        tzOffsetHours: Number(form.tz),
        latitude: Number(form.lat), longitude: Number(form.lon),
      });
      return analyzeKaalSarp(chart);
    } catch { return null; }
  }, [form]);

  return (
    <PageShell
      eyebrow="Kaal Sarp Dosha"
      title="The serpent axis of destiny"
      subtitle="A precise longitude test — Kaal Sarp is present only when all seven grahas fall in one semicircle bounded by Rahu and Ketu."
    >
      <GlassCard title="Birth data">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { k: "date", label: "Date", type: "date" },
            { k: "time", label: "Time", type: "time" },
            ].map((f) => (
            <label key={f.k} className="text-xs uppercase tracking-widest text-muted-foreground">
              {f.label}
              <input type={f.type} value={(form as Record<string,string>)[f.k]}
                onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                className="mt-1 w-full glass rounded-xl px-3 py-2 text-sm text-pearl outline-none focus:ring-1 focus:ring-gold/60" />
            </label>
          ))}
        </div>
        <div className="mt-3">
          <PlacePicker
            value={{ place: (form as Record<string,string>).place ?? "", lat: form.lat, lon: form.lon, tz: form.tz }}
            onChange={(p) => setForm((f) => ({ ...f, place: p.place, lat: p.lat, lon: p.lon, tz: p.tz }))}
            forDate={form.date}
            forTime={form.time}
          />
        </div>
      </GlassCard>

      {report && (
        <>
          <div className="mt-6 glass rounded-3xl p-6 flex items-start gap-4">
            <div className={`h-14 w-14 rounded-full grid place-items-center ${
              report.present ? "bg-rose-500/20 ring-2 ring-rose-400/60"
              : report.partial ? "bg-amber-500/20 ring-2 ring-amber-400/60"
              : "bg-emerald-500/20 ring-2 ring-emerald-400/60"
            }`}>
              {report.present || report.partial ? <AlertTriangle className="h-6 w-6 text-rose-300" /> : <CheckCircle2 className="h-6 w-6 text-emerald-300" />}
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.35em] text-gold/80">Diagnosis</div>
              <div className="font-display text-3xl gold-text mt-1">
                {report.present ? `${report.type} Kaal Sarp` : report.partial ? "Ardha (partial) Kaal Sarp" : "No Kaal Sarp Dosha"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Rahu in {report.rahuHouse}H · Ketu in {report.ketuHouse}H · Axis {report.direction ?? "—"}
              </div>
              {report.houseMeaning && (
                <p className="text-sm text-pearl mt-3 italic">{report.houseMeaning}</p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="glass rounded-2xl p-5">
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Inside the axis</div>
              <div className="flex flex-wrap gap-2">
                {report.planetsInsideAxis.length > 0 ? report.planetsInsideAxis.map((p) => (
                  <span key={p} className="text-xs px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30">{p}</span>
                )) : <span className="text-xs text-muted-foreground">—</span>}
              </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Outside the axis</div>
              <div className="flex flex-wrap gap-2">
                {report.planetsOutside.length > 0 ? report.planetsOutside.map((p) => (
                  <span key={p} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30">{p}</span>
                )) : <span className="text-xs text-muted-foreground">—</span>}
              </div>
            </div>
          </div>

          <div className="mt-6 glass rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-gold" />
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Remedies</div>
            </div>
            <ul className="space-y-2 text-sm text-pearl">
              {report.remedies.map((r, i) => (
                <li key={i} className="flex gap-2"><span className="text-gold">•</span><span className="text-muted-foreground/90">{r}</span></li>
              ))}
            </ul>
          </div>
        </>
      )}
    </PageShell>
  );
}
