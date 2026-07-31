// Admin-only Astrology Diagnostics panel. Shows the raw inputs, resolved
// coordinates, Julian Day, ayanamsa, ascendant longitude, planetary
// longitudes, house mapping, validation results, engine version, and any
// errors. "Recalculate" re-runs with the current inputs; "Compare" runs it
// twice and diffs so a stateful bug (cache / mutation) becomes visible.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { useIsAdmin } from "@/hooks/use-admin";
import { computeKundli, RASHIS } from "@/lib/vedic";
import { ENGINE_VERSION, AYANAMSA_LABELS, HOUSE_SYSTEM_LABELS } from "@/lib/chart-config";
import { runValidationSuite, type ValidationReport } from "@/lib/engine-validation";
import { RefreshCw, GitCompare, ShieldAlert, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/diagnostics")({
  component: DiagnosticsPage,
  head: () => ({ meta: [{ title: "Astrology Diagnostics — TAROMAYA Admin" }] }),
});

function julianDay(date: Date): number {
  return 2440587.5 + date.getTime() / 86400000;
}

type Row = { label: string; value: string };

function DiagnosticsPage() {
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/" }); }, [isAdmin, loading, navigate]);

  const [year, setYear] = useState(1947);
  const [month, setMonth] = useState(8);
  const [day, setDay] = useState(15);
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [tz, setTz] = useState(5.5);
  const [lat, setLat] = useState(28.6139);
  const [lon, setLon] = useState(77.2090);
  const [place, setPlace] = useState("New Delhi, India");

  const [primary, setPrimary] = useState<ReturnType<typeof computeAll> | null>(null);
  const [comparison, setComparison] = useState<ReturnType<typeof computeAll> | null>(null);
  const [suite, setSuite] = useState<ValidationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const input = useMemo(() => ({ year, month, day, hour, minute, tzOffsetHours: tz, latitude: lat, longitude: lon }), [year, month, day, hour, minute, tz, lat, lon]);

  const recalc = () => {
    setError(null); setBusy(true);
    try {
      setPrimary(computeAll(input));
      setComparison(null);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setPrimary(null); }
    finally { setBusy(false); }
  };
  const compare = () => {
    setError(null); setBusy(true);
    try {
      const a = computeAll(input);
      const b = computeAll(input);
      setPrimary(a); setComparison(b);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const runSuite = () => setSuite(runValidationSuite());

  useEffect(() => { recalc(); runSuite(); /* eslint-disable-next-line */ }, []);

  if (loading) return <PageShell hideAI hideVoice eyebrow="Admin" title="Diagnostics"><Loader2 className="h-4 w-4 animate-spin" /></PageShell>;
  if (!isAdmin) return <PageShell hideAI hideVoice eyebrow="Admin" title="Access denied"><div className="text-sm text-muted-foreground">Admins only.</div></PageShell>;

  return (
    <PageShell hideVoice eyebrow="Admin" title="Astrology Diagnostics" subtitle="Raw engine inspection: inputs, JD, ayanamsa, planetary longitudes, house mapping, validation.">
      <GlassCard>
        <h3 className="mb-3 font-serif text-lg">Raw birth input</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Year"><input type="number" className="input" value={year} onChange={(e) => setYear(+e.target.value)} /></Field>
          <Field label="Month"><input type="number" className="input" value={month} onChange={(e) => setMonth(+e.target.value)} /></Field>
          <Field label="Day"><input type="number" className="input" value={day} onChange={(e) => setDay(+e.target.value)} /></Field>
          <Field label="Hour"><input type="number" className="input" value={hour} onChange={(e) => setHour(+e.target.value)} /></Field>
          <Field label="Minute"><input type="number" className="input" value={minute} onChange={(e) => setMinute(+e.target.value)} /></Field>
          <Field label="Timezone (UTC±)"><input type="number" step="0.25" className="input" value={tz} onChange={(e) => setTz(+e.target.value)} /></Field>
          <Field label="Latitude"><input type="number" step="0.0001" className="input" value={lat} onChange={(e) => setLat(+e.target.value)} /></Field>
          <Field label="Longitude"><input type="number" step="0.0001" className="input" value={lon} onChange={(e) => setLon(+e.target.value)} /></Field>
          <div className="col-span-2 md:col-span-4">
            <Field label="Place label"><input className="input" value={place} onChange={(e) => setPlace(e.target.value)} /></Field>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={recalc} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/40 px-4 py-2 text-sm hover:bg-primary/30 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Recalculate
          </button>
          <button onClick={compare} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50">
            <GitCompare className="h-4 w-4" /> Compare (run twice)
          </button>
          <button onClick={runSuite} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/5">
            <ShieldAlert className="h-4 w-4" /> Re-run validation suite
          </button>
          <span className="ml-auto self-center font-mono text-xs text-muted-foreground">{ENGINE_VERSION}</span>
        </div>
        {error && <p className="mt-3 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">Error: {error}</p>}
      </GlassCard>

      {primary && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <h3 className="mb-2 font-serif text-lg">Resolved values</h3>
            <ResolvedTable rows={primary.rows} />
          </GlassCard>
          <GlassCard>
            <h3 className="mb-2 font-serif text-lg">Planetary longitudes (sidereal)</h3>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b border-white/10">
                  <th className="py-1 pr-3 text-left font-normal">Body</th>
                  <th className="py-1 pr-3 text-left font-normal">Longitude</th>
                  <th className="py-1 pr-3 text-left font-normal">Rashi</th>
                  <th className="py-1 pr-3 text-left font-normal">Nakshatra/Pada</th>
                  <th className="py-1 text-left font-normal">Retro</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {primary.planetRows.map((p) => (
                  <tr key={p.name} className="border-b border-white/5 last:border-0">
                    <td className="py-1 pr-3">{p.name}</td>
                    <td className="py-1 pr-3">{p.longitude.toFixed(4)}°</td>
                    <td className="py-1 pr-3">{p.rashi}</td>
                    <td className="py-1 pr-3">{p.nakshatra}/{p.pada}</td>
                    <td className="py-1">{p.retro ? "R" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-2 font-serif text-lg">House mapping (whole-sign)</h3>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground"><tr className="border-b border-white/10"><th className="py-1 pr-3 text-left font-normal">House</th><th className="py-1 pr-3 text-left font-normal">Rashi</th><th className="py-1 text-left font-normal">Planets</th></tr></thead>
              <tbody className="font-mono">
                {primary.houses.map((h) => (
                  <tr key={h.house} className="border-b border-white/5 last:border-0">
                    <td className="py-1 pr-3">{h.house}</td>
                    <td className="py-1 pr-3">{h.rashi}</td>
                    <td className="py-1">{h.planets || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-2 font-serif text-lg">Validation suite</h3>
            {suite ? (
              <>
                <div className="mb-2 flex items-center gap-4 text-xs">
                  <span className="text-emerald-300">✓ {suite.passed} passed</span>
                  <span className={suite.failed > 0 ? "text-red-300" : "text-muted-foreground"}>✗ {suite.failed} failed</span>
                </div>
                <ul className="space-y-1 text-xs">
                  {suite.cases.map((c) => (
                    <li key={c.id} className={c.passed ? "text-muted-foreground" : "text-red-300"}>
                      {c.passed ? "✓" : "✗"} {c.label} — drift {Number.isFinite(c.driftDegrees) ? c.driftDegrees.toFixed(3) + "°" : "—"}
                    </li>
                  ))}
                </ul>
              </>
            ) : <Loader2 className="h-4 w-4 animate-spin" />}
          </GlassCard>
        </div>
      )}

      {comparison && (
        <div className="mt-6">
          <GlassCard>
            <h3 className="mb-2 font-serif text-lg">Comparison (two consecutive runs)</h3>
            <p className="mb-2 text-xs text-muted-foreground">If any row shows a non-zero diff, the engine is non-deterministic for this input.</p>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground"><tr className="border-b border-white/10"><th className="py-1 pr-3 text-left font-normal">Field</th><th className="py-1 pr-3 text-left font-normal">Run A</th><th className="py-1 pr-3 text-left font-normal">Run B</th><th className="py-1 text-left font-normal">Δ</th></tr></thead>
              <tbody className="font-mono">
                {compareRows(primary!, comparison).map((r) => (
                  <tr key={r.field} className={`border-b border-white/5 last:border-0 ${r.diff !== "0" && r.diff !== "—" ? "text-amber-300" : ""}`}>
                    <td className="py-1 pr-3">{r.field}</td>
                    <td className="py-1 pr-3">{r.a}</td>
                    <td className="py-1 pr-3">{r.b}</td>
                    <td className="py-1">{r.diff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </div>
      )}
    </PageShell>
  );
}

function computeAll(input: Parameters<typeof computeKundli>[0]) {
  const localMs = Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, 0);
  const utcMs = localMs - input.tzOffsetHours * 3600 * 1000;
  const utc = new Date(utcMs);
  const chart = computeKundli(input);
  const rows: Row[] = [
    { label: "Local time", value: `${input.year}-${String(input.month).padStart(2,"0")}-${String(input.day).padStart(2,"0")} ${String(input.hour).padStart(2,"0")}:${String(input.minute).padStart(2,"0")}` },
    { label: "UTC time", value: utc.toISOString() },
    { label: "Julian Day (UT)", value: julianDay(utc).toFixed(6) },
    { label: "Latitude, Longitude", value: `${input.latitude.toFixed(4)}°, ${input.longitude.toFixed(4)}°` },
    { label: "Ayanamsa (Lahiri)", value: `${chart.ayanamsa.toFixed(6)}°` },
    { label: "Ayanamsa system", value: AYANAMSA_LABELS.lahiri },
    { label: "House system", value: HOUSE_SYSTEM_LABELS["whole-sign"] },
    { label: "Ascendant longitude (sidereal)", value: `${chart.ascendant.longitude.toFixed(6)}°` },
    { label: "Ascendant sign", value: RASHIS[chart.ascendant.rashi] },
    { label: "Engine version", value: ENGINE_VERSION },
  ];
  const planetRows = chart.planets.map((p) => ({
    name: p.name, longitude: p.longitude, rashi: RASHIS[p.rashi],
    nakshatra: p.nakshatra + 1, pada: p.pada, retro: p.retrograde,
  }));
  const bySign: Record<number, string[]> = {};
  for (const p of chart.planets) (bySign[p.rashi] ??= []).push(p.name);
  const houses = chart.houses.map((sign, i) => ({
    house: i + 1, rashi: RASHIS[sign], planets: (bySign[sign] ?? []).join(", "),
  }));
  return { rows, planetRows, houses, chart };
}

function compareRows(a: ReturnType<typeof computeAll>, b: ReturnType<typeof computeAll>) {
  const out: { field: string; a: string; b: string; diff: string }[] = [];
  const map = (rows: Row[]) => Object.fromEntries(rows.map((r) => [r.label, r.value]));
  const ma = map(a.rows), mb = map(b.rows);
  for (const key of Object.keys(ma)) {
    const av = ma[key], bv = mb[key];
    const na = Number(av?.replace(/[°%]/g,"")); const nb = Number(bv?.replace(/[°%]/g,""));
    const diff = Number.isFinite(na) && Number.isFinite(nb) ? (na - nb).toExponential(2) : (av === bv ? "0" : "—");
    out.push({ field: key, a: av, b: bv, diff });
  }
  return out;
}

function ResolvedTable({ rows }: { rows: Row[] }) {
  return (
    <table className="w-full text-xs">
      <tbody className="font-mono">
        {rows.map((r) => (
          <tr key={r.label} className="border-b border-white/5 last:border-0">
            <td className="py-1 pr-3 text-muted-foreground">{r.label}</td>
            <td className="py-1">{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
