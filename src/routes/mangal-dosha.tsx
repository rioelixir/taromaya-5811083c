import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli } from "@/lib/vedic";
import { analyzeMangal, MANGAL_CANCELLATION_RULES } from "@/lib/mangal-deep";
import { AlertTriangle, CheckCircle2, Heart, Sparkles, Shield } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/mangal-dosha")({
  component: () => (
    <PremiumGate featureName="Mangal Dosha">
      <MangalPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Mangal Dosha Deep Analysis — TAROMAYA" },
      { name: "description", content: "Three-fold Kuja/Manglik Dosha analysis — from Lagna, Chandra and Shukra — with severity, cancellations and marriage guidance." },
    ],
  }),
});

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090" };

const SEVERITY_TONE: Record<string, string> = {
  None:     "bg-emerald-500/20 ring-emerald-400/60 text-emerald-200",
  Mild:     "bg-amber-400/15 ring-amber-300/50 text-amber-100",
  Moderate: "bg-amber-500/20 ring-amber-400/60 text-amber-200",
  High:     "bg-rose-500/20 ring-rose-400/60 text-rose-200",
  Severe:   "bg-rose-600/25 ring-rose-400/70 text-rose-100",
};

function MangalPage() {
  const [form, setForm] = useState(DEFAULT);
  useAutofillBirth<typeof DEFAULT>(setForm);
  const reading = useMemo(() => {
    try {
      const [y,m,d] = form.date.split("-").map(Number);
      const [hh,mm] = form.time.split(":").map(Number);
      const chart = computeKundli({
        year:y,month:m,day:d,hour:hh,minute:mm,
        tzOffsetHours:Number(form.tz),
        latitude:Number(form.lat),longitude:Number(form.lon),
      });
      return analyzeMangal(chart);
    } catch { return null; }
  }, [form]);

  return (
    <PageShell
      eyebrow="Kuja · Manglik · Three-fold check"
      title="Mangal Dosha deep analysis"
      subtitle="A classical three-point Mangal test — from Lagna, Chandra and Shukra — with severity grading, cancellations and marriage guidance."
    >
      <GlassCard title="Birth data">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { k:"date", label:"Date", type:"date" },
            { k:"time", label:"Time", type:"time" },
            { k:"tz",   label:"TZ",   type:"text" },
            { k:"lat",  label:"Latitude",  type:"text" },
            { k:"lon",  label:"Longitude", type:"text" },
          ].map((f) => (
            <label key={f.k} className="text-xs uppercase tracking-widest text-muted-foreground">
              {f.label}
              <input type={f.type} value={(form as Record<string,string>)[f.k]}
                onChange={(e)=>setForm({...form,[f.k]:e.target.value})}
                className="mt-1 w-full glass rounded-xl px-3 py-2 text-sm text-pearl outline-none focus:ring-1 focus:ring-gold/60" />
            </label>
          ))}
        </div>
      </GlassCard>

      {reading && (
        <>
          <div className={`mt-6 glass rounded-3xl p-6 flex items-start gap-4 ring-2 ${SEVERITY_TONE[reading.severity]}`}>
            <div className="h-14 w-14 rounded-full grid place-items-center bg-black/30 ring-1 ring-white/10">
              {reading.isManglik
                ? <AlertTriangle className="h-6 w-6" />
                : <CheckCircle2 className="h-6 w-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-[0.35em] opacity-80">Diagnosis</div>
              <div className="font-display text-2xl sm:text-3xl mt-1">
                {reading.isManglik ? `${reading.severity} Manglik Dosha` : "Non-Manglik"}
              </div>
              <div className="text-sm opacity-90 mt-1">
                Mars in {reading.marsSign}{reading.marsRetrograde ? " (R)" : ""} · Score {reading.score}/100
              </div>
              <p className="text-sm mt-3 italic opacity-95">{reading.summary}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <RefCard title="From Lagna" active={reading.fromLagna} house={reading.marsHouseFromLagna} />
            <RefCard title="From Chandra" active={reading.fromMoon}  house={reading.marsHouseFromMoon} />
            <RefCard title="From Shukra" active={reading.fromVenus} house={reading.marsHouseFromVenus} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-rose-300" />
                <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Effects</div>
              </div>
              <ul className="space-y-2 text-sm">
                {reading.effects.map((e,i)=>(
                  <li key={i} className="flex gap-2"><span className="text-rose-300">•</span><span className="text-muted-foreground/90">{e}</span></li>
                ))}
              </ul>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-emerald-300" />
                <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Cancellations detected</div>
              </div>
              <ul className="space-y-2 text-sm">
                {reading.cancellations.map((c,i)=>(
                  <li key={i} className="flex gap-2"><span className="text-emerald-300">•</span><span className="text-muted-foreground/90">{c}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 glass rounded-3xl p-6 flex items-start gap-3">
            <Heart className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Marriage guidance</div>
              <p className="text-sm text-pearl">{reading.matchingGuidance}</p>
            </div>
          </div>

          {reading.applicableRemedies.length > 0 && (
            <div className="mt-6 glass rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-gold" />
                <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Traditional remedies</div>
              </div>
              <ul className="grid gap-2 md:grid-cols-2 text-sm">
                {reading.applicableRemedies.map((r,i)=>(
                  <li key={i} className="flex gap-2"><span className="text-gold">•</span><span className="text-muted-foreground/90">{r}</span></li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 glass rounded-3xl p-6">
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Classical cancellation rules (reference)</div>
            <ul className="space-y-1.5 text-xs text-muted-foreground/90">
              {MANGAL_CANCELLATION_RULES.map((r,i)=>(
                <li key={i} className="flex gap-2"><span className="text-gold/70">◆</span><span>{r}</span></li>
              ))}
            </ul>
          </div>
        </>
      )}
    </PageShell>
  );
}

function RefCard({ title, active, house }:{ title:string; active:boolean; house:number }) {
  return (
    <div className={`glass rounded-2xl p-5 ring-1 ${active ? "ring-rose-400/50" : "ring-emerald-400/40"}`}>
      <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{title}</div>
      <div className="mt-2 font-display text-2xl gold-text">Mars in {house}H</div>
      <div className={`mt-1 text-xs ${active ? "text-rose-300" : "text-emerald-300"}`}>
        {active ? "Triggers Mangal Dosha" : "Safe placement"}
      </div>
    </div>
  );
}
