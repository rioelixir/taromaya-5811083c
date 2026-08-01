import { BirthVoiceBox } from "@/components/birth-voice-box";
import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli } from "@/lib/vedic";
import { analyzeCareer } from "@/lib/career";
import { Briefcase, TrendingUp, ShieldAlert, Sparkles, Target } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/career")({
  component: () => (
    <PremiumGate featureName="Career">
      <CareerPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Career & Profession — TAROMAYA" },
      { name: "description", content: "Discover your ideal profession, industry alignment and career timing from the 10th house, its lord, and Amatyakaraka in your Vedic chart." },
    ],
  }),
});

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090", place: "New Delhi, Delhi, India" };

function CareerPage() {
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
      return analyzeCareer(chart);
    } catch { return null; }
  }, [form]);

  return (
    <PageShell
      eyebrow="Karma · Karma Bhava · Amatyakaraka"
      title="Your professional dharma"
      subtitle="Career direction, industry fit, and timing — derived from the 10th house, its lord, and the Jaimini Amatyakaraka (soul's minister)."
    >
      <GlassCard title="Birth data">
        <BirthVoiceBox value={form} onChange={(p) => setForm((prev) => ({ ...prev, ...p }))} />
      </GlassCard>

      {reading && (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="glass rounded-3xl p-6 space-y-3">
              <div className="text-xs uppercase tracking-[0.35em] text-gold/80">Karma signature</div>
              <p className="text-pearl leading-relaxed">{reading.summary}</p>
              <div className="pt-3 border-t border-white/5">
                <div className="text-xs uppercase tracking-[0.35em] text-gold/80 mb-2">Timing</div>
                <p className="text-muted-foreground italic">{reading.timing}</p>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-gold/80">Career strength</div>
                <div className="mt-2 font-display text-6xl gold-text">{reading.score}<span className="text-2xl text-muted-foreground">/100</span></div>
              </div>
              <div className="mt-4 h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-gold to-fuchsia-400" style={{width:`${reading.score}%`}} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <Row label="10th sign" value={reading.tenthSign} />
                <Row label="10th lord" value={`${reading.tenthLord} · ${reading.tenthLordHouse}H`} />
                <Row label="Amatyakaraka" value={reading.amatyakaraka} />
                <Row label="Planets in 10th" value={reading.planetsInTenth.join(", ") || "—"} />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ListCard icon={TrendingUp} title="Best-aligned fields" items={reading.bestFields} tone="gold" />
            <ListCard icon={ShieldAlert} title="Avoid or approach with care" items={reading.avoidFields} tone="rose" />
          </div>

          <div className="mt-6 glass rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-gold" />
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Action steps</div>
            </div>
            <ul className="space-y-2 text-sm text-pearl">
              <li className="flex gap-2"><Briefcase className="h-4 w-4 text-gold shrink-0 mt-0.5" /><span>Optimize your public presence in {reading.tenthLord}-ruled industries.</span></li>
              <li className="flex gap-2"><Sparkles className="h-4 w-4 text-gold shrink-0 mt-0.5" /><span>Build daily craft aligned with {reading.amatyakaraka} — this is your minister of skill.</span></li>
              <li className="flex gap-2"><Target className="h-4 w-4 text-gold shrink-0 mt-0.5" /><span>Watch {reading.tenthLord}'s transits over your 10th house — major career pivots follow.</span></li>
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

function ListCard({ icon:Icon, title, items, tone }:{ icon: typeof Sparkles; title:string; items:string[]; tone:"gold"|"rose" }) {
  const tint = tone === "rose" ? "text-rose-300" : "text-gold";
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
