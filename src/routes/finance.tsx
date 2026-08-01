import { BirthVoiceBox } from "@/components/birth-voice-box";
import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli } from "@/lib/vedic";
import { analyzeFinance } from "@/lib/finance";
import { Coins, TrendingUp, ShieldAlert, Sparkles, PiggyBank } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/finance")({
  component: () => (
    <PremiumGate featureName="Finance">
      <FinancePage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Wealth & Finance — TAROMAYA" },
      { name: "description", content: "Dhana yogas, income sources, wealth score and investment guidance from the 2nd, 11th and 9th houses of your Vedic chart." },
    ],
  }),
});

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090", place: "New Delhi, Delhi, India" };

function FinancePage() {
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
      return analyzeFinance(chart);
    } catch { return null; }
  }, [form]);

  return (
    <PageShell
      eyebrow="Dhana · Labha · Bhagya"
      title="Wealth architecture"
      subtitle="Dhana yogas, income streams and wealth score drawn from the 2nd house of kutumba, the 11th of labha, and the 9th of bhagya."
    >
      <GlassCard title="Birth data">
        <BirthVoiceBox value={form} onChange={(p) => setForm((prev) => ({ ...prev, ...p }))} />
      </GlassCard>

      {reading && (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="glass rounded-3xl p-6 space-y-3">
              <div className="text-xs uppercase tracking-[0.35em] text-gold/80">Wealth architecture</div>
              <p className="text-pearl leading-relaxed">{reading.summary}</p>
            </div>

            <div className="glass rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-gold/80">Wealth score</div>
                <div className="mt-2 font-display text-6xl gold-text">{reading.wealthScore}<span className="text-2xl text-muted-foreground">/100</span></div>
              </div>
              <div className="mt-4 h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-gold to-amber-300" style={{width:`${reading.wealthScore}%`}} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <Row label="2H (Dhana)" value={`${reading.secondSign} · ${reading.secondLord} in ${reading.secondLordHouse}H`} />
                <Row label="11H (Labha)" value={`${reading.eleventhSign} · ${reading.eleventhLord} in ${reading.eleventhLordHouse}H`} />
                <Row label="9L (Bhagya)" value={`${reading.ninthLord} in ${reading.ninthLordHouse}H`} />
                <Row label="Dhana yogas" value={String(reading.dhanaYogas.length)} />
              </div>
            </div>
          </div>

          <div className="mt-6 glass rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-gold" />
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Dhana yogas</div>
            </div>
            <ul className="space-y-2 text-sm">
              {reading.dhanaYogas.map((y,i)=>(
                <li key={i} className="flex gap-2"><span className="text-gold">◆</span><span className="text-pearl">{y}</span></li>
              ))}
            </ul>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ListCard icon={Coins}      title="Income sources"    items={reading.incomeSources}    tone="gold" />
            <ListCard icon={TrendingUp} title="Best investments"  items={reading.bestInvestments}  tone="emerald" />
            <ListCard icon={ShieldAlert}title="Financial cautions"items={reading.cautions}         tone="rose" />
          </div>

          <div className="mt-6 glass rounded-3xl p-6 flex items-start gap-3">
            <PiggyBank className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Keep systematic savings on the weekday of your 11th-house lord ({reading.eleventhLord}) — that ruler compounds gains karmically. Track expenses on the 12th lord's weekday.
            </p>
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

function ListCard({ icon:Icon, title, items, tone }:{ icon: typeof Coins; title:string; items:string[]; tone:"gold"|"rose"|"emerald" }) {
  const tint = tone === "rose" ? "text-rose-300" : tone === "emerald" ? "text-emerald-300" : "text-gold";
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
