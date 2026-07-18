import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { formatDegree, RASHIS, PLANET_SHORT, type KundliInput } from "@/lib/vedic";
import { computeVarshphal, planetHouse, type VarshphalChart } from "@/lib/varshphal";
import { Sparkles, Loader2, CalendarClock, Crown, Sun } from "lucide-react";

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
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Native" className="input" />
          </Field>
          <Field label="Birth date">
            <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className="input" />
          </Field>
          <Field label="Birth time">
            <input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} className="input" />
          </Field>
          <Field label="Timezone (h east of UTC)">
            <input value={f.tz} onChange={(e) => setF({ ...f, tz: e.target.value })} className="input" />
          </Field>
          <Field label="Latitude">
            <input value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} className="input" />
          </Field>
          <Field label="Longitude">
            <input value={f.lon} onChange={(e) => setF({ ...f, lon: e.target.value })} className="input" />
          </Field>
          <Field label="Place (label)">
            <input value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })} className="input" />
          </Field>
          <Field label="Target year">
            <input value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} className="input" />
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
