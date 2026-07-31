import { PremiumGate } from "@/components/premium-gate";
import { DateSelect } from "@/components/date-select";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { scanFestivalCalendar, type Festival, type FestivalKind } from "@/lib/festivals-scan";
import { Calendar, Sparkles, Sun, Moon, Star, Flame, Flower2 } from "lucide-react";

export const Route = createFileRoute("/festivals")({
  component: () => (<PremiumGate featureName="Festivals"><FestivalsPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Festivals & Vrat Calendar — TAROMAYA" },
      { name: "description", content: "Auto-computed Hindu festivals, vrats, and sankrantis — from tithi, nakshatra, and sidereal Sun transits." },
    ],
  }),
});

function todayIso() { return new Date().toISOString().slice(0, 10); }

const KIND_META: Record<FestivalKind, { color: string; icon: React.ReactNode; label: string }> = {
  major:      { color: "border-gold/50 bg-gradient-to-br from-gold/20 to-gold-soft/10 text-pearl",       icon: <Flame className="h-3.5 w-3.5 text-gold" />,      label: "Major festival" },
  vrat:       { color: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",                        icon: <Flower2 className="h-3.5 w-3.5" />,               label: "Vrat" },
  purnima:    { color: "border-amber-300/40 bg-amber-500/10 text-amber-100",                              icon: <Moon className="h-3.5 w-3.5" />,                  label: "Purnima" },
  amavasya:   { color: "border-indigo-400/40 bg-indigo-500/10 text-indigo-100",                           icon: <Moon className="h-3.5 w-3.5" />,                  label: "Amavasya" },
  sankranti:  { color: "border-orange-400/40 bg-orange-500/10 text-orange-100",                           icon: <Sun className="h-3.5 w-3.5" />,                   label: "Sankranti" },
  auspicious: { color: "border-white/15 bg-white/[0.03] text-pearl",                                       icon: <Star className="h-3.5 w-3.5 text-gold" />,        label: "Auspicious" },
};

function FestivalsPage() {
  const [startDate, setStartDate] = useState(todayIso());
  const [days, setDays] = useState(30);
  const [lat, setLat] = useState("28.6139");
  const [lon, setLon] = useState("77.2090");
  const [place, setPlace] = useState("New Delhi, India");
  const [filter, setFilter] = useState<FestivalKind | "all">("all");

  const scan = useMemo(
    () => scanFestivalCalendar(startDate, days, Number(lat) || 0, Number(lon) || 0),
    [startDate, days, lat, lon]
  );

  const allFestivals: { date: Date; fest: Festival }[] = useMemo(() => {
    const list: { date: Date; fest: Festival }[] = [];
    for (const d of scan.days) for (const f of d.festivals) list.push({ date: d.date, fest: f });
    return list.filter(x => filter === "all" || x.fest.kind === filter);
  }, [scan, filter]);

  return (
    <PageShell
      eyebrow="Festivals & Vrat"
      title="Sacred calendar"
      subtitle="TAROMAYA scans the coming weeks and computes every vrat, sankranti, purnima and major festival from live sidereal panchang."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <GlassCard title="Window">
          <div className="grid gap-3">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Start date
              <DateSelect label="" value={startDate} onChange={(v) => setStartDate(v)} />
            </label>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Days ahead ({days})
              <input type="range" min={7} max={120} value={days} onChange={(e) => setDays(Number(e.target.value))}
                className="mt-2 block w-full accent-gold" />
            </label>
            <PlacePicker
              label="Which place?"
              value={{ place, lat, lon, tz: "0" }}
              onChange={(p) => { setPlace(p.place); setLat(p.lat); setLon(p.lon); }}
              forDate={startDate}
            />

            <div className="mt-2 pt-3 border-t border-white/10">
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold/80 mb-2">Filter</div>
              <div className="flex flex-wrap gap-2">
                {(["all","major","vrat","purnima","amavasya","sankranti","auspicious"] as const).map(k => (
                  <button key={k} onClick={() => setFilter(k)}
                    className={`text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full border ${filter===k ? "border-gold/60 bg-gold/10 text-pearl" : "border-white/10 text-muted-foreground hover:border-white/25"}`}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          title="Upcoming observances"
          desc={`${allFestivals.length} events over ${days} days · ${place}`}
        >
          {allFestivals.length === 0 ? (
            <div className="rounded-2xl border border-white/10 p-6 text-center text-muted-foreground text-sm">
              <Calendar className="h-5 w-5 mx-auto text-gold mb-2" />
              No matching observances in this window.
            </div>
          ) : (
            <ul className="space-y-3 max-h-[560px] overflow-y-auto pr-2">
              {allFestivals.map(({ date, fest }, i) => {
                const meta = KIND_META[fest.kind];
                return (
                  <li key={i} className={`rounded-2xl border p-4 ${meta.color}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {meta.icon}
                        <div className="font-display text-base text-pearl">{fest.name}</div>
                      </div>
                      <div className="text-[10px] uppercase tracking-widest opacity-80">
                        {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="mt-2 text-xs opacity-90">{fest.significance}</div>
                    <div className="mt-2 text-[10px] uppercase tracking-widest opacity-60">{meta.label}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </div>

      <div className="mt-8">
        <GlassCard title="Panchang heatmap" desc="Every day in the window with tithi + festival count.">
          <div className="grid grid-cols-7 gap-1.5">
            {scan.days.map((d, i) => {
              const count = d.festivals.length;
              const intensity =
                count >= 3 ? "bg-gold/40 text-cosmic" :
                count === 2 ? "bg-gold/25 text-pearl" :
                count === 1 ? "bg-gold/12 text-pearl" :
                              "bg-white/[0.03] text-muted-foreground";
              return (
                <div key={i} className={`rounded-lg p-2 text-center ${intensity} border border-white/10`}>
                  <div className="text-[10px] opacity-70">{d.date.toLocaleDateString(undefined, { weekday: "short" })}</div>
                  <div className="font-mono text-sm">{d.date.getDate()}</div>
                  <div className="text-[9px] uppercase tracking-widest opacity-80 truncate">
                    {d.panchang.tithi.name.slice(0, 6)}
                  </div>
                  {count > 0 && (
                    <div className="mt-1 text-[9px] inline-flex items-center gap-0.5">
                      <Sparkles className="h-2.5 w-2.5" /> {count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
