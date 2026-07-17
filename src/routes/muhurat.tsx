import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { ACTIVITIES, scanMuhurats, type Activity, type MuhuratWindow } from "@/lib/muhurat";
import { Sparkles, CalendarClock, AlertTriangle, CheckCircle2, MapPin } from "lucide-react";

export const Route = createFileRoute("/muhurat")({
  component: MuhuratPage,
  head: () => ({
    meta: [
      { title: "Muhurat Finder — TAROMAYA" },
      { name: "description", content: "Electional astrology: scan the week or month ahead and find the most auspicious windows for any life event." },
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
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<MuhuratWindow[]>([]);

  const activityMeta = useMemo(() => ACTIVITIES.find(a => a.key === activity)!, [activity]);

  const run = () => {
    setRunning(true);
    // Yield to UI so button shows loading
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
      });
      setResults(all.slice(0, 40));
      setRunning(false);
    }, 30);
  };

  return (
    <PageShell
      eyebrow="Muhurat"
      title="Electional astrology"
      subtitle="Choose an activity, a place, and a window — TAROMAYA scans every 30 minutes and ranks the sky."
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

      {results.length > 0 && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Top {results.length} windows · {activityMeta.label}
            </div>
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {place}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {results.map((w, i) => (
              <WindowCard key={i} w={w} />
            ))}
          </div>
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

function WindowCard({ w }: { w: MuhuratWindow }) {
  const badge =
    w.quality === "Excellent" ? "from-emerald-400/30 to-gold/30 border-emerald-400/40 text-emerald-100" :
    w.quality === "Good"      ? "from-gold/25 to-gold-soft/20 border-gold/40 text-pearl" :
    w.quality === "Fair"      ? "from-white/10 to-white/5 border-white/15 text-muted-foreground" :
                                "from-red-500/15 to-red-500/5 border-red-500/30 text-red-200";
  return (
    <div className={`rounded-2xl border p-5 bg-gradient-to-br ${badge}`}>
      <div className="flex items-center justify-between">
        <div className="font-display text-lg text-pearl">
          {w.from.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
        </div>
        <div className="text-[10px] uppercase tracking-widest">{w.quality} · {w.score}</div>
      </div>
      <div className="mt-1 font-mono text-sm text-pearl">
        {w.from.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        {" – "}
        {w.to.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        {w.panchang.weekday} · {w.panchang.tithi} · {w.panchang.nakshatra} · {w.panchang.yoga} yoga
      </div>
      {w.reasons.length > 0 && (
        <ul className="mt-3 space-y-1">
          {w.reasons.slice(0, 3).map((r, i) => (
            <li key={i} className="text-xs text-pearl/90 flex items-start gap-2">
              <CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-300 shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      )}
      {w.warnings.length > 0 && (
        <ul className="mt-2 space-y-1">
          {w.warnings.slice(0, 2).map((r, i) => (
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
