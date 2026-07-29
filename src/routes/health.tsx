import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { PlacePicker } from "@/components/place-picker";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli } from "@/lib/vedic";
import { analyzeHealth } from "@/lib/health";
import { Heart, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/health")({
  component: () => (
    <PremiumGate featureName="Health">
      <HealthPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Health & Vitality — TAROMAYA" },
      { name: "description", content: "Vedic medical astrology — vulnerabilities, dosha constitution, vitality score and preventive daily regimen from your birth chart." },
    ],
  }),
});

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090", place: "New Delhi, Delhi, India" };

function HealthPage() {
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
      return analyzeHealth(chart);
    } catch { return null; }
  }, [form]);

  return (
    <PageShell
      eyebrow="Roga Bhava · Ayurveda · Vitality"
      title="The body as chart"
      subtitle="Your 6th house of disease, ascendant body-mapping and dosha temperament — with a preventive regimen tuned to your birth chart."
    >
      <GlassCard title="Birth data">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { k:"date", label:"Date", type:"date" },
            { k:"time", label:"Time", type:"time" },
            ].map((f) => (
            <label key={f.k} className="text-xs uppercase tracking-widest text-muted-foreground">
              {f.label}
              <input type={f.type} value={(form as Record<string,string>)[f.k]}
                onChange={(e)=>setForm({...form,[f.k]:e.target.value})}
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

      {reading && (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="glass rounded-3xl p-6 space-y-3">
              <div className="text-xs uppercase tracking-[0.35em] text-gold/80">Body signature</div>
              <p className="text-pearl leading-relaxed">{reading.summary}</p>
              <div className="pt-3 border-t border-white/5 text-sm">
                <span className="text-muted-foreground">Constitution: </span>
                <span className="text-pearl">{reading.primaryDosha}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Body seat: </span>
                <span className="text-pearl">{reading.vulnerableBodyParts}</span>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-gold/80">Vitality Index</div>
                <div className="mt-2 font-display text-6xl gold-text">{reading.vitalityScore}<span className="text-2xl text-muted-foreground">/100</span></div>
              </div>
              <div className="mt-4 h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-gold to-rose-400" style={{width:`${reading.vitalityScore}%`}} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <Row label="Ascendant" value={reading.ascSign} />
                <Row label="6th lord" value={`${reading.sixthLord} · ${reading.sixthLordHouse}H`} />
                <Row label="Afflicted houses" value={reading.afflictedHouses.join(", ") || "None"} />
                <Row label="Approach" value={reading.afflictedHouses.length ? "Preventive" : "Sustaining"} />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ListCard icon={AlertTriangle} title="Potential risk areas" items={reading.riskAreas} tone="rose" />
            <ListCard icon={ShieldCheck} title="Constitutional strengths" items={reading.strengths} tone="emerald" />
          </div>

          <div className="mt-6 glass rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-gold" />
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Daily regimen</div>
            </div>
            <ul className="space-y-2 text-sm text-pearl">
              {reading.guidelines.map((g,i)=>(
                <li key={i} className="flex gap-2"><Heart className="h-4 w-4 text-gold shrink-0 mt-0.5" /><span className="text-muted-foreground/90">{g}</span></li>
              ))}
            </ul>
          </div>
        </>
      )}
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 py-1 border-b border-white/5">
      <span className="text-muted-foreground uppercase tracking-widest text-[10px]">{label}</span>
      <span className="text-pearl text-right truncate">{value}</span>
    </div>
  );
}

function ListCard({ icon:Icon, title, items, tone }:{ icon: typeof Heart; title:string; items:string[]; tone:"emerald"|"rose" }) {
  const tint = tone === "rose" ? "text-rose-300" : "text-emerald-300";
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${tint}`} />
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{title}</div>
      </div>
      <ul className="space-y-2 text-sm">
        {items.map((it,i)=>(
          <li key={i} className="flex gap-2"><span className={tint}>•</span><span className="text-muted-foreground/90">{it}</span></li>
        ))}
      </ul>
    </div>
  );
}
