import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { ACTIVITIES, scanMuhurats, type Activity, type MuhuratWindow } from "@/lib/muhurat";
import { NAKSHATRAS, RASHIS } from "@/lib/vedic";
import { Sparkles, CalendarClock, AlertTriangle, CheckCircle2, MapPin, Crown, Star, Sun, Moon } from "lucide-react";
import { MuhuratDeepPanel } from "@/components/muhurat-deep-panel";

export const Route = createFileRoute("/muhurat")({
  component: () => (<PremiumGate featureName="Muhurat"><MuhuratPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Muhurat Finder — TAROMAYA" },
      { name: "description", content: "Electional astrology: scan the week or month ahead and find the most auspicious windows for any life event — with Tarabala, Chandrabala, Panchaka and Hora depth." },
    ],
  }),
});

function todayIso() { return new Date().toISOString().slice(0, 10); }

function MuhuratPage() {
  const [activity, setActivity] = useState<Activity>("marriage");
  const [startDate, setStartDate] = useState(todayIso());
  const [days, setDays] = useState(14);
  const [lat, setLat] = useState("28.6139");
  const [lon, setLon] = useState("77.2090");
  const [place, setPlace] = useState("New Delhi, India");
  const [birthNak, setBirthNak] = useState<string>("");
  const [birthRashi, setBirthRashi] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<MuhuratWindow[]>([]);

  const activityMeta = useMemo(() => ACTIVITIES.find(a => a.key === activity)!, [activity]);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      const [y, m, d] = startDate.split("-").map(Number);
      const start = new Date(y, m - 1, d, 0, 0, 0);
      const all = scanMuhurats({
        activity,
        startDate: start,
        days,
        latitude: Number(lat),
        longitude: Number(lon),
        sliceMinutes: 30,
        birth: (birthNak || birthRashi) ? {
          nakshatra: (birthNak || undefined) as any,
          rashi: (birthRashi || undefined) as any,
        } : undefined,
      });
      setResults(all.slice(0, 80));
      setRunning(false);
    }, 30);
  };

  // Group by date, mark best-of-day.
  const grouped = useMemo(() => {
    const byDate = new Map<string, MuhuratWindow[]>();
    for (const w of results) {
      const key = w.from.toDateString();
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(w);
    }
    const days = Array.from(byDate.entries())
      .map(([key, list]) => {
        list.sort((a, b) => a.from.getTime() - b.from.getTime());
        const best = list.reduce((m, w) => (w.score > m.score ? w : m), list[0]);
        return { key, date: new Date(key), list, best };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return days;
  }, [results]);

  return (
    <PageShell
      eyebrow="Muhurat"
      title="Electional astrology"
      subtitle="Choose an activity, place and window. TAROMAYA scans every 30 minutes with Tarabala, Chandrabala, Panchaka and Hora depth."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <GlassCard title="Activity" desc={activityMeta.desc}>
          <div className="grid gap-2 sm:grid-cols-2">
            {ACTIVITIES.map((a) => {
              const active = a.key === activity;
              return (
                <button
                  key={a.key}
                  onClick={() => setActivity(a.key)}
                  className={`text-left rounded-2xl p-4 border transition-all ${
                    active
                      ? "border-gold/60 bg-gold/[0.06] shadow-[0_0_30px_-10px_var(--gold)]"
                      : "border-white/10 hover:border-white/25 bg-white/[0.02]"
                  }`}
                >
                  <div className="font-display text-lg text-pearl">{a.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{a.desc}</div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard title="Search window">
          <div className="grid gap-3">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Start date
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-pearl" />
            </label>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Days ahead ({days})
              <input type="range" min={3} max={45} value={days} onChange={(e) => setDays(Number(e.target.value))}
                className="mt-2 block w-full accent-gold" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Latitude
                <input value={lat} onChange={(e) => setLat(e.target.value)}
                  className="mt-1 block w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-pearl" />
              </label>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Longitude
                <input value={lon} onChange={(e) => setLon(e.target.value)}
                  className="mt-1 block w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-pearl" />
              </label>
            </div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Place
              <input value={place} onChange={(e) => setPlace(e.target.value)}
                className="mt-1 block w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-pearl" />
            </label>

            <div className="mt-1 pt-3 border-t border-white/10">
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold/80 mb-2">Personalise (optional)</div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Janma Nakshatra
                  <select value={birthNak} onChange={(e) => setBirthNak(e.target.value)}
                    className="mt-1 block w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-pearl">
                    <option value="">—</option>
                    {NAKSHATRAS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Janma Rashi
                  <select value={birthRashi} onChange={(e) => setBirthRashi(e.target.value)}
                    className="mt-1 block w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-pearl">
                    <option value="">—</option>
                    {RASHIS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                Adds Tarabala + Chandrabala tuning to every window.
              </div>
            </div>

            <button
              disabled={running}
              onClick={run}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium py-3 hover:brightness-110 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {running ? "Scanning the sky…" : "Find muhurats"}
            </button>
          </div>
        </GlassCard>
      </div>

      {grouped.length > 0 && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {results.length} windows · {grouped.length} days · {activityMeta.label}
            </div>
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {place}
            </div>
          </div>

          {grouped.map((g) => (
            <section key={g.key} className="space-y-3">
              <header className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="font-display text-xl text-pearl">
                  {g.date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                </div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
                  <Crown className="h-3 w-3 text-gold" />
                  Best {g.best.from.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} · {g.best.score}
                </div>
              </header>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {g.list.map((w, i) => (
                  <WindowCard key={i} w={w} isBest={w === g.best} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {!results.length && !running && (
        <div className="mt-10 rounded-3xl glass p-8 text-center text-muted-foreground">
          <CalendarClock className="h-6 w-6 mx-auto text-gold mb-3" />
          Pick an activity above and press <span className="text-pearl">Find muhurats</span> to reveal the sky's most auspicious windows.
        </div>
      )}
    </PageShell>
  );
}

function WindowCard({ w, isBest }: { w: MuhuratWindow; isBest?: boolean }) {
  const badge =
    w.quality === "Excellent" ? "from-emerald-400/30 to-gold/30 border-emerald-400/40 text-emerald-100" :
    w.quality === "Good"      ? "from-gold/25 to-gold-soft/20 border-gold/40 text-pearl" :
    w.quality === "Fair"      ? "from-white/10 to-white/5 border-white/15 text-muted-foreground" :
                                "from-red-500/15 to-red-500/5 border-red-500/30 text-red-200";
  return (
    <div className={`relative rounded-2xl border p-5 bg-gradient-to-br ${badge} ${isBest ? "ring-1 ring-gold/60 shadow-[0_0_40px_-12px_var(--gold)]" : ""}`}>
      {isBest && (
        <div className="absolute -top-2 left-4 rounded-full bg-gradient-to-r from-gold to-gold-soft text-cosmic text-[10px] font-medium tracking-widest px-2 py-0.5 inline-flex items-center gap-1">
          <Crown className="h-3 w-3" /> BEST OF DAY
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="font-mono text-base text-pearl">
          {w.from.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          {" – "}
          {w.to.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className="text-[10px] uppercase tracking-widest">{w.quality} · {w.score}</div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        <span className="rounded-full border border-white/10 px-2 py-0.5">{w.panchang.tithi}</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5"><Star className="inline h-2.5 w-2.5 mr-1" />{w.panchang.nakshatra}</span>
        {w.moonRashi && <span className="rounded-full border border-white/10 px-2 py-0.5"><Moon className="inline h-2.5 w-2.5 mr-1" />{w.moonRashi}</span>}
        {w.hora && (
          <span className="rounded-full border border-gold/30 px-2 py-0.5 text-gold/90">
            {w.hora.isDay ? <Sun className="inline h-2.5 w-2.5 mr-1" /> : <Moon className="inline h-2.5 w-2.5 mr-1" />}
            {w.hora.lord} hora
          </span>
        )}
      </div>
      {w.reasons.length > 0 && (
        <ul className="mt-3 space-y-1">
          {w.reasons.slice(0, 4).map((r, i) => (
            <li key={i} className="text-xs text-pearl/90 flex items-start gap-2">
              <CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-300 shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      )}
      {w.warnings.length > 0 && (
        <ul className="mt-2 space-y-1">
          {w.warnings.slice(0, 3).map((r, i) => (
            <li key={i} className="text-xs text-red-200/90 flex items-start gap-2">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
