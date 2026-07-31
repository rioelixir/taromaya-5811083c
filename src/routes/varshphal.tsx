import { PremiumGate } from "@/components/premium-gate";
import { DateSelect } from "@/components/date-select";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { formatDegree, RASHIS, PLANET_SHORT, type KundliInput } from "@/lib/vedic";
import { computeVarshphal, planetHouse, type VarshphalChart } from "@/lib/varshphal";
import {
  computeTajikaAspects, detectTajikaYogas, detectKambool, munthaVarsheshLink,
  computeHarshaBala,
} from "@/lib/varshphal-deep";
import { Sparkles, Loader2, CalendarClock, Crown, Sun, ArrowRight, Zap, CheckCircle2, XCircle } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";


const inputCls =
  "w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50";

export const Route = createFileRoute("/varshphal")({
  component: () => (<PremiumGate featureName="Varshphal"><VarshphalPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Varshphal — TAROMAYA" },
      { name: "description", content: "Annual Vedic solar return chart with Muntha, Lord of the Year, and Sahams." },
    ],
  }),
});

type Form = {
  name: string; date: string; time: string; tz: string;
  lat: string; lon: string; place: string; year: string;
};
const DEFAULTS: Form = {
  name: "", date: "1995-06-15", time: "07:45", tz: "5.5",
  lat: "28.6139", lon: "77.2090", place: "New Delhi, India",
  year: String(new Date().getFullYear()),
};

function VarshphalPage() {
  const [f, setF] = useState<Form>(DEFAULTS);
  useAutofillBirth<Form>(setF);
  const [chart, setChart] = useState<VarshphalChart | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compute = () => {
    setError(null); setBusy(true);
    try {
      const [Y, M, D] = f.date.split("-").map(Number);
      const [h, m] = f.time.split(":").map(Number);
      const birth: KundliInput = {
        year: Y, month: M, day: D, hour: h, minute: m,
        tzOffsetHours: parseFloat(f.tz),
        latitude: parseFloat(f.lat),
        longitude: parseFloat(f.lon),
      };
      const v = computeVarshphal({ birth, targetYear: parseInt(f.year, 10) });
      setChart(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not compute.");
    } finally { setBusy(false); }
  };

  return (
    <PageShell
      eyebrow="Varshphal"
      title="Annual solar return"
      subtitle="Tajika annual chart cast for the exact moment the Sun returns to its birth longitude — with Muntha, Lord of the Year, and classical Sahams."
    >
      <GlassCard>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name">
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Native" className={inputCls} />
          </Field>
          <Field label="Birth date">
            <DateSelect label="" value={f.date} onChange={(v) => setF({ ...f, date: v })} />
          </Field>
          <Field label="Birth time">
            <input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Timezone (h east of UTC)">
            <input value={f.tz} onChange={(e) => setF({ ...f, tz: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Latitude">
            <input value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Longitude">
            <input value={f.lon} onChange={(e) => setF({ ...f, lon: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Place (label)">
            <input value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Target year">
            <input value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={compute}
            disabled={busy}
            className="rounded-full bg-gradient-to-r from-gold to-gold-soft text-primary-foreground px-5 py-2 text-xs uppercase tracking-widest inline-flex items-center gap-2 disabled:opacity-60"
          >
            {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Computing</> : <><Sparkles className="w-3.5 h-3.5" /> Cast Varshphal</>}
          </button>
          {error && <div className="text-xs text-destructive">{error}</div>}
        </div>
      </GlassCard>

      {chart && <VarshphalView v={chart} />}
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs uppercase tracking-widest text-muted-foreground">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function VarshphalView({ v }: { v: VarshphalChart }) {
  const asc = v.chart.ascendant;
  const planets = useMemo(() => v.chart.planets.map((p) => ({
    ...p,
    house: planetHouse(p, asc.rashi),
  })), [v, asc.rashi]);

  return (
    <div className="mt-8 space-y-6">
      <GlassCard>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={<CalendarClock className="w-4 h-4 text-gold" />} label="Solar return (local)" value={v.returnLocal} />
          <Stat icon={<Sun className="w-4 h-4 text-gold" />} label="Age completed" value={`${v.ageCompleted} years`} />
          <Stat icon={<Crown className="w-4 h-4 text-gold" />} label="Varshesh (Lord of the Year)" value={v.varshesh} />
        </div>
        <div className="mt-4 text-xs text-muted-foreground italic">{v.varsheshReason}</div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Annual Lagna</div>
            <div className="font-display text-2xl gold-text">
              {RASHIS[asc.rashi]} · {formatDegree(asc.degreeInRashi)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Muntha</div>
            <div className="font-display text-lg text-pearl">
              {RASHIS[v.muntha.rashi]} · H{v.muntha.house} · Lord {v.muntha.lord}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left py-2">Planet</th>
                <th className="text-left">Sign</th>
                <th className="text-left">Degree</th>
                <th className="text-left">House</th>
                <th className="text-left">Retro</th>
              </tr>
            </thead>
            <tbody>
              {planets.map((p) => (
                <tr key={p.name} className="border-t border-white/5">
                  <td className="py-2 text-pearl">{PLANET_SHORT[p.name]} {p.name}</td>
                  <td>{RASHIS[p.rashi]}</td>
                  <td>{formatDegree(p.degreeInRashi)}</td>
                  <td>H{p.house}</td>
                  <td>{p.retrograde ? "℞" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Sahams (Sensitive points)</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {v.sahams.map((s) => (
            <div key={s.name} className="rounded-xl border border-white/10 p-3">
              <div className="text-sm text-pearl">{s.name}</div>
              <div className="text-xs text-muted-foreground">
                {RASHIS[s.rashi]} · {formatDegree(s.longitude - s.rashi * 30)} · Lord {s.lord}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <TajikaDeepPanel v={v} />
    </div>
  );
}

function TajikaDeepPanel({ v }: { v: VarshphalChart }) {
  const aspects = useMemo(() => computeTajikaAspects(v.chart), [v]);
  const yogas = useMemo(() => detectTajikaYogas(aspects), [aspects]);
  const kambool = useMemo(() => detectKambool(aspects), [aspects]);
  const harsha = useMemo(() => computeHarshaBala(v.chart), [v]);
  const mv = useMemo(
    () => munthaVarsheshLink(v.chart, v.muntha.longitude, v.varshesh),
    [v],
  );

  const topAspects = aspects.slice(0, 10);
  const applyingYogas = yogas.filter((y) => y.name.startsWith("Ithasala")).slice(0, 8);
  const separating = yogas.filter((y) => y.name.startsWith("Isarapha")).slice(0, 6);
  const harshaSorted = [...harsha].sort((a, b) => b.total - a.total);

  const quality = (q: "benefic" | "malefic" | "neutral") =>
    q === "benefic" ? "text-emerald-300 border-emerald-400/30 bg-emerald-500/5"
      : q === "malefic" ? "text-red-300 border-red-400/30 bg-red-500/5"
      : "text-pearl/80 border-white/10 bg-white/[0.02]";

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-gold" />
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Tajika aspects · Deeptamsha orb
          </div>
          <div className="ml-auto text-[10px] text-muted-foreground">
            {aspects.length} active
          </div>
        </div>
        {topAspects.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No planets within combined deeptamsha orb this year — an unusually
            quiet annual chart.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left py-2">Fast</th>
                  <th className="text-left"></th>
                  <th className="text-left">Slow</th>
                  <th className="text-left">Aspect</th>
                  <th className="text-left">Orb</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Strength</th>
                </tr>
              </thead>
              <tbody>
                {topAspects.map((a, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="py-1.5 text-pearl">{PLANET_SHORT[a.from]} {a.from}</td>
                    <td className="text-muted-foreground"><ArrowRight className="inline w-3 h-3" /></td>
                    <td className="text-pearl">{PLANET_SHORT[a.to]} {a.to}</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] border ${
                        a.nature === "friend" ? "border-emerald-400/30 text-emerald-300"
                          : a.nature === "enemy" ? "border-red-400/30 text-red-300"
                          : "border-white/10 text-pearl/80"
                      }`}>{a.aspect}</span>
                    </td>
                    <td className="text-xs text-muted-foreground">{a.orbDeg.toFixed(1)}°</td>
                    <td>
                      <span className={`text-[10px] uppercase tracking-widest ${
                        a.applying ? "text-gold" : "text-muted-foreground"
                      }`}>
                        {a.applying ? "Applying" : "Separating"}
                      </span>
                    </td>
                    <td>
                      <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-gold to-gold-soft"
                          style={{ width: `${(a.strength * 100).toFixed(0)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Ithasala — approaching results
          </div>
          {applyingYogas.length === 0 ? (
            <div className="text-sm text-muted-foreground">No applying Tajika yogas this year.</div>
          ) : (
            <ul className="space-y-2">
              {applyingYogas.map((y, i) => (
                <li key={i} className={`rounded-xl border p-3 ${quality(y.quality)}`}>
                  <div className="text-sm text-pearl flex items-center gap-1.5">
                    {PLANET_SHORT[y.planets[0]]} {y.planets[0]}
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    {PLANET_SHORT[y.planets[1]]} {y.planets[1]}
                    <span className="ml-auto text-[10px] text-muted-foreground">{y.aspect}</span>
                  </div>
                  <div className="mt-1 text-xs text-pearl/80">{y.description}</div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Isarapha — matters already past · Kambool
          </div>
          {separating.length > 0 && (
            <ul className="space-y-2 mb-4">
              {separating.map((y, i) => (
                <li key={i} className={`rounded-xl border p-3 ${quality(y.quality)}`}>
                  <div className="text-sm text-pearl">
                    {PLANET_SHORT[y.planets[0]]} {y.planets[0]} — {PLANET_SHORT[y.planets[1]]} {y.planets[1]}
                    <span className="ml-2 text-[10px] text-muted-foreground">{y.aspect}</span>
                  </div>
                  <div className="mt-1 text-xs text-pearl/80">{y.description}</div>
                </li>
              ))}
            </ul>
          )}
          <div className="text-[10px] uppercase tracking-widest text-gold/80 mb-2">Kambool (Moon yogas)</div>
          {kambool.length === 0 ? (
            <div className="text-sm text-muted-foreground">Moon is unconnected — a self-directed year.</div>
          ) : (
            <ul className="space-y-2">
              {kambool.map((k, i) => (
                <li key={i} className={`rounded-xl border p-3 ${quality(k.quality)}`}>
                  <div className="text-sm text-pearl">Kambool with {k.planets[1]} · {k.aspect}</div>
                  <div className="mt-1 text-xs text-pearl/80">{k.description}</div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Muntha ↔ Varshesh linkage
          </div>
          <div className="text-[10px] text-muted-foreground">Muntha in {RASHIS[v.muntha.rashi]} · H{v.muntha.house}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-4 text-sm">
          {mv.aspect ? (
            <>
              <div className="text-pearl">
                Varshesh <span className="text-gold">{v.varshesh}</span> forms a{" "}
                <span className={
                  mv.nature === "friend" ? "text-emerald-300"
                    : mv.nature === "enemy" ? "text-red-300"
                    : "text-pearl"
                }>{mv.aspect}</span> with Muntha
                <span className="text-muted-foreground"> (arc {mv.angleDeg.toFixed(1)}°)</span>.
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {mv.nature === "friend"
                  ? "The year's ruling planet supports Muntha's house theme — that department of life flourishes."
                  : mv.nature === "enemy"
                  ? "The Varshesh strains the Muntha — this year's central story hits obstacles in that house."
                  : "A neutral link — the theme is present but not amplified."}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">
              Varshesh {v.varshesh} does not form a tight Tajika aspect with Muntha
              (arc {mv.angleDeg.toFixed(1)}°). The year's story unfolds independent of the Muntha theme.
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          Harsha Bala · Five joys of the planets (max 25)
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {harshaSorted.map((h) => (
            <div key={h.planet} className="rounded-xl border border-white/10 p-3">
              <div className="flex items-center gap-2">
                <span className="text-pearl font-medium">{PLANET_SHORT[h.planet]} {h.planet}</span>
                <span className="ml-auto text-sm text-gold">{h.total}/25</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gold to-gold-soft"
                  style={{ width: `${(h.total / 25) * 100}%` }} />
              </div>
              <ul className="mt-2 space-y-1">
                {h.sources.map((s, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    {s.hit
                      ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      : <XCircle className="w-3 h-3 text-white/20" />}
                    <span className={s.hit ? "text-pearl/90" : ""}>{s.label}</span>
                    <span className="ml-auto">{s.points}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}


function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon}{label}
      </div>
      <div className="mt-1 font-display text-lg text-pearl">{value}</div>
    </div>
  );
}
