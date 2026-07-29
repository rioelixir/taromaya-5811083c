import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlacePicker } from "@/components/place-picker";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli } from "@/lib/vedic";
import { analyzeCareer } from "@/lib/career";
import { analyzeHealth } from "@/lib/health";
import { analyzeFinance } from "@/lib/finance";
import { analyzeMangal } from "@/lib/mangal-deep";
import { Briefcase, Heart, Coins, Flame, ArrowRight } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/life-dashboard")({
  component: () => (
    <PremiumGate featureName="Life Dashboard">
      <LifeDashboardPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Life Dashboard — TAROMAYA" },
      { name: "description", content: "A single-glance dashboard of your career, health, finance and Mangal Dosha scores — the complete life-quadrant reading." },
    ],
  }),
});

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090", place: "New Delhi, Delhi, India" };

function LifeDashboardPage() {
  const [form, setForm] = useState(DEFAULT);
  useAutofillBirth<typeof DEFAULT>(setForm);
  const data = useMemo(() => {
    try {
      const [y,m,d] = form.date.split("-").map(Number);
      const [hh,mm] = form.time.split(":").map(Number);
      const chart = computeKundli({
        year:y,month:m,day:d,hour:hh,minute:mm,
        tzOffsetHours:Number(form.tz),
        latitude:Number(form.lat),longitude:Number(form.lon),
      });
      return {
        career: analyzeCareer(chart),
        health: analyzeHealth(chart),
        finance: analyzeFinance(chart),
        mangal: analyzeMangal(chart),
      };
    } catch { return null; }
  }, [form]);

  return (
    <PageShell
      eyebrow="Purushartha · Four life-pillars"
      title="Life dashboard"
      subtitle="Career, health, wealth and Mangal Dosha in one panoramic view — each score is drawn from your chart in real-time."
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

      {data && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <QuadCard
              to="/career"
              icon={Briefcase}
              title="Career"
              score={data.career.score}
              gradient="from-amber-400 via-gold to-fuchsia-400"
              caption={`${data.career.tenthLord} · ${data.career.tenthLordHouse}H`}
              tag={data.career.amatyakaraka + " AmK"}
            />
            <QuadCard
              to="/health"
              icon={Heart}
              title="Vitality"
              score={data.health.vitalityScore}
              gradient="from-emerald-400 via-gold to-rose-400"
              caption={data.health.ascSign}
              tag={data.health.primaryDosha.split(" · ")[0]}
            />
            <QuadCard
              to="/finance"
              icon={Coins}
              title="Wealth"
              score={data.finance.wealthScore}
              gradient="from-emerald-400 via-gold to-amber-300"
              caption={`${data.finance.dhanaYogas.length} Dhana yoga${data.finance.dhanaYogas.length===1?"":"s"}`}
              tag={data.finance.secondLord + " (2L)"}
            />
            <QuadCard
              to="/mangal-dosha"
              icon={Flame}
              title="Mangal"
              score={100 - data.mangal.score}
              gradient={data.mangal.isManglik ? "from-rose-500 via-amber-400 to-gold" : "from-emerald-400 via-gold to-emerald-300"}
              caption={data.mangal.isManglik ? `${data.mangal.severity} Manglik` : "Non-Manglik"}
              tag={`Mars ${data.mangal.marsSign}`}
              scoreLabel={data.mangal.isManglik ? "Marriage harmony" : "Marital ease"}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <SummaryCard title="Career direction" body={data.career.summary} to="/career" />
            <SummaryCard title="Body & vitality" body={data.health.summary} to="/health" />
            <SummaryCard title="Wealth architecture" body={data.finance.summary} to="/finance" />
            <SummaryCard title="Manglik summary" body={data.mangal.summary} to="/mangal-dosha" />
          </div>
        </>
      )}
    </PageShell>
  );
}

function QuadCard({
  to, icon:Icon, title, score, gradient, caption, tag, scoreLabel = "Score",
}:{
  to: string; icon: typeof Briefcase; title:string; score:number; gradient:string; caption:string; tag:string; scoreLabel?:string;
}) {
  return (
    <Link to={to} className="glass rounded-3xl p-5 hover:bg-white/[0.06] transition-colors block group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gold" />
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{title}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors" />
      </div>
      <div className="mt-3 font-display text-5xl gold-text">{score}<span className="text-lg text-muted-foreground">/100</span></div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{scoreLabel}</div>
      <div className={`mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden`}>
        <div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} style={{width:`${Math.max(0,Math.min(100,score))}%`}} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">{caption}</span>
        <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold">{tag}</span>
      </div>
    </Link>
  );
}

function SummaryCard({ title, body, to }:{ title:string; body:string; to:string }) {
  return (
    <Link to={to} className="glass rounded-2xl p-5 hover:bg-white/[0.06] transition-colors block group">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-[0.3em] text-gold/80">{title}</div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors" />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </Link>
  );
}
