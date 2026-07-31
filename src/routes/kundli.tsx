import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type ReactNode } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { ChartZoom } from "@/components/chart-zoom";
import {
  computeKundli, formatDegree, lahiriAyanamsa,
  NAKSHATRAS, PLANET_SHORT, RASHIS, RASHI_LORDS,
  type KundliChart, type PlanetName,
} from "@/lib/vedic";
import {
  computeVarga, computeVimshottari, computeAshtottari, computeYogini,
  detectYogas, detectDoshas,
  VARGA_LABELS, VARGA_ORDER, fmtDate,
  type VargaCode, type DashaTree,
} from "@/lib/vedic-extended";
import {
  computeAshtakavarga, computeShadbala, computeKP,
  computeLalKitab, recommendGemstones,
} from "@/lib/vedic-deep";
import { interpretKundli } from "@/lib/kundli.functions";
import { saveKundli } from "@/lib/kundli-storage.functions";
import { getPdfQuota, recordPdfDownload } from "@/lib/pdf-quota.functions";
import { QuotaBadge } from "./reports";
import { useAuth } from "@/hooks/use-auth";
import { useAutofillBirth } from "@/hooks/use-birth-profile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  Sparkles, Loader2, MapPin, Save, Check, AlertTriangle,
  CheckCircle2, XCircle, Gem, Scroll, Activity, Grid3x3, KeyRound, Download,
} from "lucide-react";
import { CalcSettingsPanel, type CalcSettings } from "@/components/calc-settings-panel";
import { AccuracyPanel } from "@/components/accuracy-panel";
import { CurrentTransit } from "@/components/current-transit";
import { DateSelect } from "@/components/date-select";


export const Route = createFileRoute("/kundli")({
  component: () => (<PremiumGate featureName="Kundli"><KundliPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Kundli — TAROMAYA" },
      { name: "description", content: "Vedic birth chart with divisional charts (D1–D60), Vimshottari dasha, yogas, doshas, and AI interpretation." },
    ],
  }),
});

type FormState = {
  name: string; date: string; time: string; seconds: string; tz: string;
  lat: string; lon: string; place: string;
  ayanamsa: string; houseSystem: string; nodeType: string;
  elevation: string; unknownTime: boolean;
};

const DEFAULTS: FormState = {
  name: "", date: "1995-06-15", time: "07:45", seconds: "0",
  tz: "5.5", lat: "28.6139", lon: "77.2090",
  place: "New Delhi, India",
  ayanamsa: "lahiri", houseSystem: "whole-sign", nodeType: "true",
  elevation: "0", unknownTime: false,
};

type TabId = "overview" | "transit" | "vargas" | "dasha" | "yogas" | "doshas" | "planets" | "ashtaka" | "shadbala" | "kp" | "lalkitab" | "gems" | "reading";
const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "transit", label: "Current Transit" },
  { id: "vargas", label: "Divisional" },
  { id: "dasha", label: "Dasha" },
  { id: "yogas", label: "Yogas" },
  { id: "doshas", label: "Doshas" },
  { id: "planets", label: "Planets" },
  { id: "ashtaka", label: "Ashtakavarga" },
  { id: "shadbala", label: "Shadbala" },
  { id: "kp", label: "KP Sub-Lords" },
  { id: "lalkitab", label: "Lal Kitab" },
  { id: "gems", label: "Gemstones" },
  { id: "reading", label: "AI Reading" },
];

function KundliPage() {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  useAutofillBirth<FormState>(setForm);
  const [chart, setChart] = useState<KundliChart | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const interpret = useServerFn(interpretKundli);
  const save = useServerFn(saveKundli);
  const { user } = useAuth();

  const canSubmit = useMemo(
    () => !!(form.date && form.time && form.tz && form.lat && form.lon),
    [form],
  );

  const birthDate = useMemo(() => {
    if (!chart) return null;
    const [y, m, d] = form.date.split("-").map(Number);
    const [hh, mm] = form.time.split(":").map(Number);
    const local = Date.UTC(y, m - 1, d, hh, mm);
    return new Date(local - Number(form.tz) * 3600000);
  }, [chart, form]);

  const compute = () => {
    setError(null); setReading(null);
    try {
      const [y, m, d] = form.date.split("-").map(Number);
      const [hh, mm] = form.time.split(":").map(Number);
      const c = computeKundli({
        year: y, month: m, day: d,
        hour: form.unknownTime ? 12 : hh,
        minute: form.unknownTime ? 0 : mm,
        seconds: form.unknownTime ? 0 : Number(form.seconds) || 0,
        tzOffsetHours: Number(form.tz),
        latitude: Number(form.lat), longitude: Number(form.lon),
        config: {
          ayanamsa: form.ayanamsa as never,
          houseSystem: form.houseSystem as never,
          nodeType: form.nodeType as never,
          elevationMeters: Number(form.elevation) || 0,
        },
      });
      setChart(c);
      setTab("overview");
      void requestReading(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not compute chart.");
    }
  };

  const requestReading = async (c: KundliChart) => {
    setLoadingReading(true);
    try {
      const res = await interpret({
        data: {
          name: form.name,
          ascendant: { rashi: RASHIS[c.ascendant.rashi], degree: formatDegree(c.ascendant.degreeInRashi) },
          moonNakshatra: {
            name: NAKSHATRAS[c.moonNakshatra.index], pada: c.moonNakshatra.pada, lord: c.moonNakshatra.lord,
          },
          planets: c.planets.map((p) => ({
            name: p.name, rashi: RASHIS[p.rashi],
            house: ((p.rashi - c.ascendant.rashi + 12) % 12) + 1,
            degree: formatDegree(p.degreeInRashi),
            nakshatra: NAKSHATRAS[p.nakshatra], retrograde: p.retrograde,
          })),
        },
      });
      setReading(res.text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Reading failed.";
      if (msg.includes("429")) setError("The stars are busy — try again shortly.");
      else if (msg.includes("402")) setError("AI credits exhausted. Please add credits.");
      else setError(msg);
    } finally {
      setLoadingReading(false);
    }
  };

  const onSave = async () => {
    if (!user) return;
    setSaving(true); setSaveMsg(null);
    try {
      await save({
        data: {
          name: form.name || form.place || "Untitled chart",
          birthDate: form.date, birthTime: form.time,
          tzOffset: Number(form.tz),
          latitude: Number(form.lat), longitude: Number(form.lon),
          place: form.place,
          ayanamsa: form.ayanamsa,
          houseSystem: form.houseSystem,
          nodeType: form.nodeType,
          birthSeconds: Number(form.seconds) || 0,
          elevationMeters: Number(form.elevation) || 0,
          unknownTime: form.unknownTime,
          chartConfig: {
            ayanamsa: form.ayanamsa,
            houseSystem: form.houseSystem,
            nodeType: form.nodeType,
            elevationMeters: Number(form.elevation) || 0,
          },
        },
      });
      setSaveMsg("Saved to your library.");
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      eyebrow="Vedic Kundli"
      title="Your birth chart"
      subtitle="Sidereal Lahiri calculations, whole-sign houses, divisional charts, Vimshottari dasha, yogas, and doshas — all computed privately in your browser."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <BirthForm form={form} setForm={setForm} canSubmit={canSubmit} onCompute={compute} error={error} />

        <div className="space-y-6">
          {chart ? (
            <>
              <GlassCard>
                <div className="grid gap-4 md:grid-cols-2">
                  <ChartZoom label="Lagna Chart · North Indian"><NorthIndianLagnaChart chart={chart} /></ChartZoom>
                  <ChartZoom label="Rashi Chart · South Indian"><SouthIndianChart chart={chart} /></ChartZoom>
                </div>
              </GlassCard>
              <ChartSummary chart={chart} />

              {user ? (
                <div className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    {saveMsg ? saveMsg : "Save this chart to open it anytime."}
                  </div>
                  <button
                    onClick={onSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium px-4 py-2 text-xs disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save
                  </button>
                </div>
              ) : (
                <div className="glass rounded-2xl p-4 text-xs text-muted-foreground flex items-center justify-between gap-3">
                  Sign in to save charts and revisit them later.
                  <Link to="/auth" className="text-gold hover:underline">Sign in</Link>
                </div>
              )}
              <KundliPdfSection chart={chart} form={form} birthDate={birthDate!} />
            </>
          ) : (
            <GlassCard title="Waiting for your details" desc="Enter your birth date, time, and coordinates. Chart, dasha, yogas and doshas will appear here.">
              <div className="mt-4 aspect-square rounded-2xl border border-white/10 bg-black/20 grid place-items-center text-muted-foreground text-sm">
                Chart preview
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {chart && birthDate && (
        <div className="mt-8">
          <div className="flex flex-wrap gap-2 border-b border-white/5 pb-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm rounded-t-lg whitespace-nowrap transition ${
                  tab === t.id
                    ? "bg-gradient-to-b from-gold/15 to-transparent text-pearl gold-border border-b-0"
                    : "text-muted-foreground hover:text-pearl"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="pt-6">
            {tab === "overview" && <OverviewTab chart={chart} />}
            {tab === "transit" && (
              <CurrentTransit
                chart={chart}
                latitude={Number(form.lat)}
                longitude={Number(form.lon)}
                tzOffsetHours={Number(form.tz)}
                place={form.place}
              />
            )}
            {tab === "vargas" && <VargasTab chart={chart} />}
            {tab === "dasha" && <DashaTab chart={chart} birthDate={birthDate} />}
            {tab === "yogas" && <YogasTab chart={chart} />}
            {tab === "doshas" && <DoshasTab chart={chart} />}
            {tab === "planets" && <PlanetTable chart={chart} />}
            {tab === "ashtaka" && <AshtakavargaTab chart={chart} />}
            {tab === "shadbala" && <ShadbalaTab chart={chart} />}
            {tab === "kp" && <KPTab chart={chart} />}
            {tab === "lalkitab" && <LalKitabTab chart={chart} />}
            {tab === "gems" && <GemstonesTab chart={chart} />}
            {tab === "reading" && <ReadingTab reading={reading} loading={loadingReading} />}
          </div>

          <div className="mt-6 space-y-3">
            <CalcSettingsPanel settings={buildCalcSettings(chart, form, birthDate)} />
            <AccuracyPanel compact />
          </div>
        </div>
      )}
    </PageShell>
  );
}

// ── Birth form
function BirthForm({
  form, setForm, canSubmit, onCompute, error,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  canSubmit: boolean;
  onCompute: () => void;
  error: string | null;
}) {
  return (
    <GlassCard title="Birth details">
      <div className="grid gap-3">
        <Field label="Name (optional)">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Your name" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <DateSelect value={form.date} onChange={(iso) => setForm({ ...form, date: iso })} />
          <Field label="Time (24h)"><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputCls} disabled={form.unknownTime} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Seconds"><input value={form.seconds} onChange={(e) => setForm({ ...form, seconds: e.target.value })} className={inputCls} inputMode="numeric" disabled={form.unknownTime} placeholder="0" /></Field>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={form.unknownTime} onChange={(e) => setForm({ ...form, unknownTime: e.target.checked })} className="accent-gold" />
          Time unknown (use noon chart)
        </label>
        <PlacePicker
          value={{ place: form.place, lat: form.lat, lon: form.lon, tz: form.tz }}
          onChange={(p) => setForm({ ...form, place: p.place, lat: p.lat, lon: p.lon, tz: p.tz })}
          forDate={form.date}
          forTime={form.time}
        />
        <Field label="Elevation (m)">
          <input value={form.elevation} onChange={(e) => setForm({ ...form, elevation: e.target.value })} className={inputCls} inputMode="numeric" placeholder="0" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Ayanamsa">
            <select value={form.ayanamsa} onChange={(e) => setForm({ ...form, ayanamsa: e.target.value })} className={inputCls}>
              <option value="lahiri">Lahiri</option>
              <option value="raman">Raman</option>
              <option value="kp-old">KP (Old)</option>
              <option value="kp-new">KP (New)</option>
              <option value="tropical">Tropical</option>
            </select>
          </Field>
          <Field label="House system">
            <select value={form.houseSystem} onChange={(e) => setForm({ ...form, houseSystem: e.target.value })} className={inputCls}>
              <option value="whole-sign">Whole Sign</option>
              <option value="placidus">Placidus</option>
              <option value="koch">Koch</option>
              <option value="equal">Equal</option>
              <option value="sripati">Sripati</option>
              <option value="bhava-chalit">Bhava Chalit</option>
            </select>
          </Field>
          <Field label="Rahu / Ketu">
            <select value={form.nodeType} onChange={(e) => setForm({ ...form, nodeType: e.target.value })} className={inputCls}>
              <option value="true">True Node</option>
              <option value="mean">Mean Node</option>
            </select>
          </Field>
        </div>
        <button
          disabled={!canSubmit} onClick={onCompute}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium py-3 disabled:opacity-40 hover:brightness-110 transition"
        >
          <Sparkles className="h-4 w-4" /> Compute chart
        </button>
        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-200">{error}</div>}
      </div>
    </GlassCard>
  );
}

const inputCls =
  "w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

// ── South Indian chart
const CELL_TO_RASHI: Record<string, number> = {
  "0-0": 11, "0-1": 0, "0-2": 1, "0-3": 2,
  "1-0": 10,                       "1-3": 3,
  "2-0": 9,                        "2-3": 4,
  "3-0": 8, "3-1": 7, "3-2": 6, "3-3": 5,
};

/** Full planet names for display (never short codes). */
const PLANET_FULL: Record<PlanetName, string> = {
  Sun: "Sun", Moon: "Moon", Mars: "Mars", Mercury: "Mercury", Jupiter: "Jupiter",
  Venus: "Venus", Saturn: "Saturn", Rahu: "Rahu", Ketu: "Ketu",
};

/** North-Indian diamond Lagna chart (houses are fixed, signs rotate). */
function NorthIndianLagnaChart({ chart }: { chart: KundliChart }) {
  const S = 400;
  const asc = chart.ascendant.rashi;
  const planetsByHouse = new Map<number, { name: PlanetName; retrograde: boolean }[]>();
  for (const p of chart.planets) {
    const h = ((p.rashi - asc + 12) % 12) + 1;
    const arr = planetsByHouse.get(h) ?? [];
    arr.push({ name: p.name, retrograde: p.retrograde });
    planetsByHouse.set(h, arr);
  }
  // Anchor points for the 12 house cells in a North-Indian diamond.
  const P: Record<number, [number, number]> = {
    1:  [S*0.50, S*0.30], 2:  [S*0.25, S*0.15], 3:  [S*0.12, S*0.30],
    4:  [S*0.30, S*0.50], 5:  [S*0.12, S*0.70], 6:  [S*0.25, S*0.85],
    7:  [S*0.50, S*0.70], 8:  [S*0.75, S*0.85], 9:  [S*0.88, S*0.70],
    10: [S*0.70, S*0.50], 11: [S*0.88, S*0.30], 12: [S*0.75, S*0.15],
  };

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Lagna Chart · North Indian</div>
      <div className="rounded-2xl border border-gold/30 bg-white p-3">
        <svg viewBox={`0 0 ${S} ${S}`} className="w-full" role="img" aria-label="North Indian Lagna Chart">
          <rect x={0} y={0} width={S} height={S} fill="#ffffff" />
          <rect x={2} y={2} width={S-4} height={S-4} fill="none" stroke="#1a1a1a" strokeWidth={1.5} />
          <line x1={2} y1={2} x2={S-2} y2={S-2} stroke="#1a1a1a" strokeWidth={1.5} />
          <line x1={S-2} y1={2} x2={2} y2={S-2} stroke="#1a1a1a" strokeWidth={1.5} />
          <polygon points={`${S/2},2 ${S-2},${S/2} ${S/2},${S-2} 2,${S/2}`} fill="none" stroke="#1a1a1a" strokeWidth={1.5} />
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
            const sign = (asc + h - 1) % 12;
            const [cx, cy] = P[h];
            const planets = planetsByHouse.get(h) ?? [];
            const planetCount = planets.length;
            // Vertical stack: house# on top, then planets
            const startY = cy - (planetCount * 6);
            return (
              <g key={h}>
                {/* Sign number only — no house numbers */}
                <text x={cx} y={startY - 2} textAnchor="middle" fontSize={13}
                  fontWeight={700} fill="#7c3aed" fontFamily="ui-sans-serif, system-ui, sans-serif">
                  {sign + 1}{h === 1 ? " · Asc" : ""}
                </text>
                {/* Full planet names, stacked */}
                {planets.map((p, idx) => (
                  <text key={p.name} x={cx} y={startY + 16 + idx * 14}
                    textAnchor="middle" fontSize={12} fontWeight={600}
                    fill="#111827" fontFamily="ui-sans-serif, system-ui, sans-serif">
                    {PLANET_FULL[p.name]}{p.retrograde ? " (R)" : ""}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <div>Ascendant: <span className="text-pearl">{RASHIS[chart.ascendant.rashi]} {formatDegree(chart.ascendant.degreeInRashi)}</span></div>
        <div>Lord: <span className="text-pearl">{RASHI_LORDS[chart.ascendant.rashi]}</span></div>
      </div>
    </div>
  );
}


function SouthIndianChart({ chart }: { chart: KundliChart }) {
  const planetsByRashi = new Map<number, { name: PlanetName; retrograde: boolean }[]>();
  for (const p of chart.planets) {
    const arr = planetsByRashi.get(p.rashi) ?? [];
    arr.push({ name: p.name, retrograde: p.retrograde });
    planetsByRashi.set(p.rashi, arr);
  }
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Rashi Chart · South Indian</div>
      <div className="grid grid-cols-4 grid-rows-4 aspect-square rounded-2xl overflow-hidden border-2 border-gold/40 bg-white">
        {Array.from({ length: 16 }).map((_, i) => {
          const r = Math.floor(i / 4); const c = i % 4;
          const key = `${r}-${c}`;
          const rashi = CELL_TO_RASHI[key];
          const isCenter = rashi === undefined;
          if (isCenter) {
            if (r === 1 && c === 1) {
              return (
                <div key={i} className="col-span-2 row-span-2 grid place-items-center text-center border border-gold/30 bg-gradient-to-br from-purple-50 to-amber-50">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-purple-700">Lagna</div>
                    <div className="font-display text-2xl text-gray-900 mt-1 font-bold">{chart.ascendant.rashi + 1}</div>
                    <div className="text-[11px] text-gray-600 mt-1">{formatDegree(chart.ascendant.degreeInRashi)}</div>
                  </div>
                </div>
              );
            }
            return null;
          }
          const isAsc = rashi === chart.ascendant.rashi;
          const planets = planetsByRashi.get(rashi) ?? [];
          return (
            <div key={i} className={`relative border border-gray-300 p-2 text-[10px] ${isAsc ? "bg-amber-50" : "bg-white"}`}>
              <div className="flex items-start justify-between gap-1">
                <span className="text-[11px] font-bold text-gray-800">{rashi + 1}</span>
                {isAsc && <span className="text-[10px] font-bold text-purple-700">Asc</span>}
              </div>
              <div className="mt-1.5 flex flex-col gap-0.5">
                {planets.map((p) => (
                  <span key={p.name} className="text-[11px] font-semibold text-gray-900 leading-tight" title={p.name}>
                    {PLANET_FULL[p.name]}{p.retrograde ? " (R)" : ""}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <div>Ayanamsa (Lahiri): <span className="text-pearl">{chart.ayanamsa.toFixed(4)}°</span></div>
        <div>Moon Nakshatra: <span className="text-pearl">{NAKSHATRAS[chart.moonNakshatra.index]} · pada {chart.moonNakshatra.pada}</span></div>
      </div>
    </div>
  );
}

function ChartSummary({ chart }: { chart: KundliChart }) {
  const lagna = RASHIS[chart.ascendant.rashi];
  const lord = RASHI_LORDS[chart.ascendant.rashi];
  const nak = NAKSHATRAS[chart.moonNakshatra.index];
  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat label="Lagna" value={lagna} sub={formatDegree(chart.ascendant.degreeInRashi)} />
      <Stat label="Lagna lord" value={lord} sub="Guiding planet" />
      <Stat label="Janma Nakshatra" value={nak} sub={`Pada ${chart.moonNakshatra.pada} · ${chart.moonNakshatra.lord}`} />
    </div>
  );
}
function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg text-pearl">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ── Tabs

function OverviewTab({ chart }: { chart: KundliChart }) {
  const yogas = detectYogas(chart).filter((y) => y.present);
  const doshas = detectDoshas(chart).filter((d) => d.present);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <GlassCard title="Auspicious yogas active" desc={`${yogas.length} detected`}>
        <ul className="space-y-2 mt-2">
          {yogas.length === 0 && <li className="text-xs text-muted-foreground">None among the detected set.</li>}
          {yogas.slice(0, 6).map((y) => (
            <li key={y.name} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <div>
                <div className="text-pearl">{y.name}</div>
                <div className="text-xs text-muted-foreground">{y.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>
      <GlassCard title="Doshas present" desc={`${doshas.length} detected`}>
        <ul className="space-y-2 mt-2">
          {doshas.length === 0 && <li className="text-xs text-muted-foreground">No major doshas detected.</li>}
          {doshas.map((d) => (
            <li key={d.name} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-aurora shrink-0 mt-0.5" />
              <div>
                <div className="text-pearl">{d.name} <span className="text-[10px] text-muted-foreground">· {d.severity}</span></div>
                <div className="text-xs text-muted-foreground">{d.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}

function VargasTab({ chart }: { chart: KundliChart }) {
  const codes: VargaCode[] = VARGA_ORDER;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {codes.map((code) => {
        const v = computeVarga(chart, code);
        const label = VARGA_LABELS[code];
        return (
          <GlassCard key={code} title={`${code} · ${label.name}`} desc={label.theme}>
            <VargaMini chart={chart} code={code} ascSign={v.ascendantSign} planets={v.planetSigns} />
          </GlassCard>
        );
      })}
    </div>
  );
}

function VargaMini({
  code, ascSign, planets,
}: {
  chart: KundliChart;
  code: VargaCode;
  ascSign: number;
  planets: { name: PlanetName; sign: number; retrograde: boolean }[];
}) {
  const byRashi = new Map<number, typeof planets>();
  planets.forEach((p) => {
    const a = byRashi.get(p.sign) ?? [];
    a.push(p);
    byRashi.set(p.sign, a);
  });
  return (
    <div className="mt-3">
      <div className="grid grid-cols-4 grid-rows-4 aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/30">
        {Array.from({ length: 16 }).map((_, i) => {
          const r = Math.floor(i / 4); const c = i % 4;
          const rashi = CELL_TO_RASHI[`${r}-${c}`];
          if (rashi === undefined) {
            if (r === 1 && c === 1) return (
              <div key={i} className="col-span-2 row-span-2 grid place-items-center border border-white/5 bg-cosmic/40">
                <div className="text-center">
                  <div className="text-[9px] uppercase tracking-widest text-gold/60">{code}</div>
                  <div className="font-display text-sm text-pearl">{ascSign + 1}</div>
                </div>
              </div>
            );
            return null;
          }
          const isAsc = rashi === ascSign;
          const list = byRashi.get(rashi) ?? [];
          return (
            <div key={i} className={`relative border border-white/5 p-1 text-[9px] ${isAsc ? "bg-gold/[0.08]" : ""}`}>
              <div className="text-[8px] text-muted-foreground/70">{rashi + 1}</div>
              <div className="mt-1 flex flex-wrap gap-0.5">
                {list.map((p) => (
                  <span key={p.name} className="inline-block rounded px-1 bg-white/5 text-pearl text-[9px]">
                    {PLANET_SHORT[p.name]}{p.retrograde ? "ᴿ" : ""}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type DashaSystem = "vimshottari" | "yogini" | "ashtottari";
const DASHA_META: Record<DashaSystem, { label: string; totalYears: number; desc: string }> = {
  vimshottari: { label: "Vimshottari", totalYears: 120, desc: "120-year nakshatra-based dasha — the primary Parashari timing system." },
  yogini:      { label: "Yogini",       totalYears: 36,  desc: "36-year, 8-yogini cycle — quick, event-focused predictive tool." },
  ashtottari:  { label: "Ashtottari",   totalYears: 108, desc: "108-year, 8-lord dasha — traditional supplement for karma & longevity." },
};

function DashaTab({ chart, birthDate }: { chart: KundliChart; birthDate: Date }) {
  const NAK_SPAN = 360 / 27;
  const moon = chart.planets[1];
  const moonDegInNak = (moon.longitude % NAK_SPAN + NAK_SPAN) % NAK_SPAN;
  const [system, setSystem] = useState<DashaSystem>("vimshottari");

  const tree: DashaTree = useMemo(() => {
    if (system === "yogini") return computeYogini(birthDate, chart.moonNakshatra.index, moonDegInNak);
    if (system === "ashtottari") return computeAshtottari(birthDate, chart.moonNakshatra.index, moonDegInNak);
    return computeVimshottari(birthDate, chart.moonNakshatra.index, moonDegInNak);
  }, [system, birthDate, chart.moonNakshatra.index, moonDegInNak]);

  const meta = DASHA_META[system];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(DASHA_META) as DashaSystem[]).map((s) => (
          <button
            key={s}
            onClick={() => setSystem(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-display tracking-wide border transition ${
              system === s
                ? "border-gold/60 bg-gold/15 text-gold"
                : "border-white/10 text-muted-foreground hover:text-pearl hover:border-white/20"
            }`}
          >
            {DASHA_META[s].label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <GlassCard title="Current Mahadasha" desc={`${fmtDate(tree.currentMaha.start)} → ${fmtDate(tree.currentMaha.end)}`}>
          <div className="mt-2 font-display text-2xl gold-text">{tree.currentMaha.lord}</div>
        </GlassCard>
        <GlassCard title="Current Antardasha" desc={`${fmtDate(tree.currentAntar.start)} → ${fmtDate(tree.currentAntar.end)}`}>
          <div className="mt-2 font-display text-2xl gold-text">{tree.currentAntar.lord}</div>
        </GlassCard>
        <GlassCard title="Current Pratyantar" desc={`${fmtDate(tree.currentPratyantar.start)} → ${fmtDate(tree.currentPratyantar.end)}`}>
          <div className="mt-2 font-display text-2xl gold-text">{tree.currentPratyantar.lord}</div>
        </GlassCard>
      </div>

      <GlassCard title={`${meta.label} timeline`} desc={meta.desc}>
        <div className="mt-3 space-y-2 max-h-[560px] overflow-y-auto pr-2">
          {tree.maha.map((m, idx) => {
            const now = new Date();
            const isCurrent = m.start <= now && now < m.end;
            return (
              <details key={idx} open={isCurrent} className="rounded-xl border border-white/10 bg-black/20 open:bg-black/30">
                <summary className={`cursor-pointer px-3 py-2 flex items-center justify-between text-sm ${isCurrent ? "text-gold" : "text-pearl"}`}>
                  <div className="flex items-center gap-2">
                    {isCurrent && <span className="h-2 w-2 rounded-full bg-gold animate-twinkle" />}
                    <span className="font-display">{m.lord} Mahadasha</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {fmtDate(m.start)} → {fmtDate(m.end)}
                  </span>
                </summary>
                <div className="border-t border-white/5">
                  {m.antar.map((a, ai) => {
                    const isA = a.start <= now && now < a.end;
                    return (
                      <details key={ai} open={isA} className="border-t border-white/5 first:border-t-0">
                        <summary className={`cursor-pointer px-4 py-1.5 flex items-center justify-between text-xs ${isA ? "text-gold" : "text-muted-foreground"}`}>
                          <span>{m.lord} / {a.lord}</span>
                          <span className="text-[10px]">{fmtDate(a.start)} → {fmtDate(a.end)}</span>
                        </summary>
                        <div className="bg-black/20">
                          {a.pratyantar.map((p, pi) => {
                            const isP = p.start <= now && now < p.end;
                            return (
                              <div key={pi} className={`px-6 py-1 flex items-center justify-between text-[11px] ${isP ? "text-gold" : "text-muted-foreground/80"}`}>
                                <span>› {p.lord}</span>
                                <span className="text-[9px]">{fmtDate(p.start)} → {fmtDate(p.end)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function YogasTab({ chart }: { chart: KundliChart }) {
  const yogas = detectYogas(chart);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {yogas.map((y) => (
        <div key={y.name} className="glass rounded-2xl p-4">
          <div className="flex items-start gap-3">
            {y.present ? <CheckCircle2 className="h-5 w-5 text-gold shrink-0" /> : <XCircle className="h-5 w-5 text-muted-foreground/40 shrink-0" />}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-display text-lg text-pearl">{y.name}</div>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{y.category}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{y.detail}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DoshasTab({ chart }: { chart: KundliChart }) {
  const doshas = detectDoshas(chart);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {doshas.map((d) => (
        <div key={d.name} className={`glass rounded-2xl p-5 ${d.present ? "border-aurora/30" : ""}`}>
          <div className="flex items-center justify-between">
            <div className="font-display text-lg text-pearl">{d.name}</div>
            {d.present ? (
              <span className="text-[10px] uppercase tracking-widest text-aurora px-2 py-1 rounded-full border border-aurora/30 bg-aurora/10">
                {d.severity ?? "Present"}
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-1 rounded-full border border-white/10">
                <Check className="inline h-3 w-3 mr-1" /> Clear
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{d.detail}</p>
          {d.present && d.remedy && (
            <div className="mt-3 rounded-lg bg-black/30 border border-white/5 p-3 text-xs">
              <div className="text-[10px] uppercase tracking-widest text-gold mb-1">Remedy</div>
              <div className="text-pearl/90">{d.remedy}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PlanetTable({ chart }: { chart: KundliChart }) {
  return (
    <GlassCard title="Planetary positions" desc="Sidereal longitudes, whole-sign house, nakshatra, and motion.">
      <div className="grid gap-2 sm:grid-cols-2">
        {chart.planets.map((p) => {
          const house = ((p.rashi - chart.ascendant.rashi + 12) % 12) + 1;
          const pct = (p.degreeInRashi / 30) * 100;
          return (
            <div key={p.name} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base text-pearl">{p.name}</span>
                  {p.retrograde && <span className="text-[10px] uppercase tracking-widest text-aurora">℞</span>}
                </div>
                <span className="text-[10px] uppercase tracking-widest text-gold/80">H{house}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {RASHIS[p.rashi]} · {NAKSHATRAS[p.nakshatra]} · pada {p.pada}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gold to-gold-soft" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>{formatDegree(p.degreeInRashi)}</span>
                <span>{p.retrograde ? "Retrograde" : "Direct"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}


function ReadingTab({ reading, loading }: { reading: string | null; loading: boolean }) {
  return (
    <GlassCard>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold/80">
        <Sparkles className="h-3.5 w-3.5" /> AI Reading
      </div>
      {loading && !reading && (
        <div className="mt-6 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading your chart…
        </div>
      )}
      {reading && <div className="mt-4"><Markdown text={reading} /></div>}
    </GlassCard>
  );
}

function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((ln, i) => {
        if (ln.startsWith("### ")) return <h3 key={i} className="mt-4 font-display text-lg text-gold">{ln.slice(4)}</h3>;
        if (ln.startsWith("- ")) return <p key={i} className="text-pearl/90 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gold">{renderInline(ln.slice(2))}</p>;
        if (ln.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} className="text-pearl/90 leading-relaxed">{renderInline(ln)}</p>;
      })}
    </div>
  );
}
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i} className="text-pearl">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
  );
}

void lahiriAyanamsa;

// ─────────────────────────────────────────────────────────
// Ashtakavarga
// ─────────────────────────────────────────────────────────
function AshtakavargaTab({ chart }: { chart: KundliChart }) {
  const av = useMemo(() => computeAshtakavarga(chart), [chart]);
  const asc = chart.ascendant.rashi;
  const maxSarva = Math.max(...av.sarva);

  return (
    <div className="space-y-6">
      <GlassCard
        title="Sarvashtakavarga"
        desc={`Total ${av.sarvaTotal} bindus · high-scoring signs are prosperous fields for the planet transiting them.`}
      >
        <div className="mt-4 grid grid-cols-6 md:grid-cols-12 gap-2">
          {av.sarva.map((v, i) => {
            const intensity = v / maxSarva;
            return (
              <div key={i} className="rounded-xl border border-white/10 p-2 text-center relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-t from-gold/40 to-gold/5"
                  style={{ opacity: intensity }}
                />
                <div className="relative">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">sign {i + 1}</div>
                  <div className="mt-1 font-display text-2xl text-pearl">{v}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">
          Signs above 30 bindus are strong · below 25 need caution when transited by malefics.
        </div>
      </GlassCard>

      <GlassCard title="Bhinna Ashtakavarga" desc="Individual bindu distribution — bar height shows relative strength per sign (max 8).">
        <div className="mt-4 space-y-3">
          {av.bhinna.map((row) => (
            <div key={row.planet}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-medium text-pearl">{row.planet}</span>
                <span className="text-[10px] uppercase tracking-widest text-gold">Σ {row.total}</span>
              </div>
              <div className="grid grid-cols-12 gap-1 items-end h-16">
                {row.bindus.map((b, i) => {
                  const h = (b / 8) * 100;
                  const tone = b >= 5 ? "from-gold to-gold-soft" : b <= 2 ? "from-white/10 to-white/5" : "from-gold/40 to-gold/10";
                  return (
                    <div key={i} className="flex flex-col items-center justify-end h-full" title={`${RASHIS[i]}: ${b}`}>
                      <div className={`w-full rounded-t bg-gradient-to-t ${tone}`} style={{ height: `${Math.max(6, h)}%` }} />
                      <div className="mt-1 text-[8px] text-muted-foreground">{i + 1}</div>
                      <div className="text-[9px] font-mono text-pearl">{b}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Shadbala
// ─────────────────────────────────────────────────────────
function ShadbalaTab({ chart }: { chart: KundliChart }) {
  const rows = useMemo(() => computeShadbala(chart), [chart]);
  const maxTotal = Math.max(...rows.map((r) => r.total));

  return (
    <div className="space-y-4">
      <GlassCard title="Six-fold planetary strength" desc="Sthana · Dig · Kala · Chesta · Naisargika · Drig — measured in Rupas.">
        <div className="space-y-3 mt-4">
          {rows.map((r) => {
            const pct = (r.total / maxTotal) * 100;
            const passes = r.ratio >= 1;
            return (
              <div key={r.planet} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gold/80" />
                    <span className="font-display text-lg text-pearl">{r.planet}</span>
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${passes ? "bg-gold/10 text-gold border border-gold/30" : "bg-aurora/10 text-aurora border border-aurora/30"}`}>
                      {passes ? "Sufficient" : "Deficient"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.total.toFixed(2)} / {r.required.toFixed(2)} Rupas
                    <span className="ml-2 text-pearl">({(r.ratio * 100).toFixed(0)}%)</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-3">
                  <div className="h-full bg-gradient-to-r from-gold to-gold-soft" style={{ width: `${pct}%` }} />
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-[10px]">
                  {[
                    ["Sthana", r.sthana],
                    ["Dig", r.dig],
                    ["Kala", r.kala],
                    ["Chesta", r.chesta],
                    ["Naisargika", r.naisargika],
                    ["Drig", r.drig],
                  ].map(([label, val]) => (
                    <div key={label as string} className="rounded-lg bg-black/30 border border-white/5 p-2 text-center">
                      <div className="uppercase tracking-widest text-muted-foreground">{label}</div>
                      <div className="mt-1 font-display text-sm text-pearl">{(val as number).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// KP
// ─────────────────────────────────────────────────────────
function KPTab({ chart }: { chart: KundliChart }) {
  const rows = useMemo(() => computeKP(chart, NAKSHATRAS, RASHIS), [chart]);
  return (
    <GlassCard title="KP Sub-lords" desc="Krishnamurti Paddhati: Nakshatra star lord → Sub-lord → Sub-sub for precise cuspal analysis.">
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.who} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-display text-sm text-pearl">
                <KeyRound className="h-3 w-3 text-gold" />{r.who}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.sign} · {r.nakshatra}</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px]">
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-mono text-gold">{r.starLord}</span>
              <span className="text-muted-foreground">→</span>
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-mono text-gold">{r.subLord}</span>
              <span className="text-muted-foreground">→</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-muted-foreground">{r.subSubLord}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-[11px] text-muted-foreground">
        In KP the sub-lord of a cusp or planet is the final significator — it decides whether the promise of the star lord fructifies.
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────
// Lal Kitab
// ─────────────────────────────────────────────────────────
function LalKitabTab({ chart }: { chart: KundliChart }) {
  const rows = useMemo(() => computeLalKitab(chart, RASHIS), [chart]);
  const badgeColor = (s: string) =>
    s === "Strong" ? "bg-gold/10 text-gold border-gold/30"
    : s === "Weak" ? "bg-aurora/10 text-aurora border-aurora/30"
    : "bg-white/5 text-muted-foreground border-white/10";
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map((r) => (
        <div key={r.planet} className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scroll className="h-4 w-4 text-gold/80" />
              <div className="font-display text-lg text-pearl">{r.planet}</div>
              <div className="text-[10px] text-muted-foreground">· H{r.house} · {r.rashi}</div>
            </div>
            <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${badgeColor(r.status)}`}>
              {r.status}
            </span>
          </div>
          <p className="mt-3 text-sm text-pearl/90 leading-relaxed">{r.reading}</p>
          <div className="mt-3 rounded-xl bg-black/30 border border-white/5 p-3">
            <div className="text-[10px] uppercase tracking-widest text-gold mb-1">Upaya (Remedy)</div>
            <div className="text-xs text-pearl/90 leading-relaxed">{r.remedy}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Gemstones
// ─────────────────────────────────────────────────────────
function GemstonesTab({ chart }: { chart: KundliChart }) {
  const shad = useMemo(() => computeShadbala(chart), [chart]);
  const rec = useMemo(() => recommendGemstones(chart, shad), [chart, shad]);

  const Card = ({ tone, kind, data }: { tone: "primary" | "supporting"; kind: string; data: typeof rec.primary }) => (
    <div className={`glass rounded-2xl p-5 relative overflow-hidden ${tone === "primary" ? "gold-border" : ""}`}>
      <div className={`absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl ${tone === "primary" ? "bg-gold/20" : "bg-aurora/15"}`} />
      <div className="relative">
        <div className="flex items-center gap-2">
          <Gem className={`h-4 w-4 ${tone === "primary" ? "text-gold" : "text-aurora"}`} />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{kind}</span>
        </div>
        <div className="mt-2 font-display text-2xl gold-text">{data.stone}</div>
        <div className="mt-1 text-xs text-muted-foreground">For {data.for}</div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
          <Meta label="Metal" value={data.metal} />
          <Meta label="Finger" value={data.finger} />
          <Meta label="Day" value={data.day} />
          <Meta label="Color" value={data.color} />
        </div>
        <div className="mt-3 rounded-xl bg-black/30 border border-white/5 p-3">
          <div className="text-[10px] uppercase tracking-widest text-gold mb-1">Mantra (108×)</div>
          <div className="font-display text-sm text-pearl">{data.mantra}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Card tone="primary" kind="Primary Ratna · Lagna Lord" data={rec.primary} />
        <Card tone="supporting" kind="Supporting Ratna · Strongest Benefic" data={rec.supporting} />
      </div>

      <GlassCard title="Rudraksha" desc={`${rec.rudraksha.mukhi} for ${rec.rudraksha.for}`}>
        <p className="mt-3 text-sm text-pearl/90 leading-relaxed">{rec.rudraksha.benefit}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Energise on the planet's day at sunrise with the primary mantra (108 repetitions), then wear on a red or black thread touching the chest.
        </p>
      </GlassCard>

      <GlassCard title="Stones to avoid" desc="These planets are best not amplified for your Lagna.">
        <div className="flex flex-wrap gap-2 mt-3">
          {rec.avoid.map((p) => (
            <span key={p} className="text-xs px-3 py-1 rounded-full border border-aurora/30 bg-aurora/5 text-aurora">
              {p}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">{rec.notes}</p>
      </GlassCard>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/30 border border-white/5 p-2">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-pearl">{value}</div>
    </div>
  );
}

void Grid3x3;

/* ============ Kundli PDF download (monthly quota) ============ */

function KundliPdfSection({ chart, form, birthDate }: {
  chart: KundliChart; form: FormState; birthDate: Date;
}) {
  const fetchQuota = useServerFn(getPdfQuota);
  const recordDownload = useServerFn(recordPdfDownload);
  const qc = useQueryClient();
  const quotaQuery = useQuery({
    queryKey: ["pdf-quota"],
    queryFn: () => fetchQuota(),
  });
  const q = quotaQuery.data?.kundli;
  const [busy, setBusy] = useState(false);
  const blocked = !!q && !q.isAdmin && q.remaining !== null && q.remaining <= 0;

  const download = async () => {
    setBusy(true);
    try {
      await recordDownload({ data: { kind: "kundli", label: form.name || "Kundli" } });
      const pdf = buildKundliPdf(chart, form, birthDate);
      const safe = (form.name || "Kundli").replace(/\s+/g, "_");
      pdf.save(`TAROMAYA-Kundli-${safe}-${new Date().toISOString().slice(0,10)}.pdf`);
      qc.invalidateQueries({ queryKey: ["pdf-quota"] });
      toast.success("Kundli PDF downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          Download a complete Kundli PDF — chart, planets, dasha, yogas, doshas, remedies.
        </div>
        <button
          onClick={download}
          disabled={busy || blocked}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium px-4 py-2 text-xs disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
          {blocked ? "Limit reached" : "Download PDF"}
        </button>
      </div>
      <QuotaBadge status={q} loading={quotaQuery.isLoading} label="Kundli PDFs this month" />
    </div>
  );
}

function buildKundliPdf(chart: KundliChart, form: FormState, birthDate: Date): jsPDF {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const BG: [number, number, number] = [11, 12, 24];
  const GOLD: [number, number, number] = [212, 175, 55];
  const TEXT: [number, number, number] = [230, 225, 210];
  const MUTED: [number, number, number] = [160, 155, 145];

  const setBG = () => { pdf.setFillColor(...BG); pdf.rect(0, 0, w, h, "F"); };
  setBG();

  const drawHeader = () => {
    pdf.setTextColor(...GOLD);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("TAROMAYA", margin, 32, { charSpace: 3 });
    pdf.text("KUNDLI REPORT", w - margin, 32, { align: "right", charSpace: 3 });
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.4);
    pdf.line(margin, 42, w - margin, 42);
  };
  drawHeader();

  // Title block
  pdf.setTextColor(...GOLD);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text(form.name || "Seeker", margin, 90);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...MUTED);
  pdf.text(`${form.date}  ·  ${form.time}  ·  TZ ${form.tz}`, margin, 108);
  pdf.text(form.place || `${form.lat}, ${form.lon}`, margin, 122);

  // Summary rows
  let y = 160;
  const line = (label: string, value: string) => {
    pdf.setTextColor(...GOLD);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(label.toUpperCase(), margin, y, { charSpace: 2 });
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...TEXT);
    pdf.setFontSize(11);
    pdf.text(value, margin + 130, y);
    y += 18;
  };

  const ascRashi = RASHIS[chart.ascendant.rashi];
  const moon = chart.planets.find(p => p.name === "Moon")!;
  const sun = chart.planets.find(p => p.name === "Sun")!;
  const nak = NAKSHATRAS[chart.moonNakshatra.index];

  line("Ayanamsa (Lahiri)", `${chart.ayanamsa.toFixed(4)}°`);
  line("Ascendant (Lagna)", `${ascRashi}  ${formatDegree(chart.ascendant.degreeInRashi)}`);
  line("Moon Rashi", `${RASHIS[moon.rashi]}  ${formatDegree(moon.degreeInRashi)}`);
  line("Sun Rashi", `${RASHIS[sun.rashi]}  ${formatDegree(sun.degreeInRashi)}`);
  line("Nakshatra", `${nak}  · Pada ${chart.moonNakshatra.pada}  · ${chart.moonNakshatra.lord}`);

  // Planets table
  y += 10;
  pdf.setDrawColor(...GOLD);
  pdf.line(margin, y, w - margin, y);
  y += 18;
  pdf.setTextColor(...GOLD);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("PLANETARY POSITIONS", margin, y, { charSpace: 2 });
  y += 16;

  pdf.setFontSize(9);
  pdf.setTextColor(...MUTED);
  const cols = [margin, margin + 90, margin + 200, margin + 290, margin + 360, margin + 430];
  ["Planet", "Rashi", "Degree", "House", "Nakshatra", "Retro"].forEach((h, i) =>
    pdf.text(h, cols[i], y),
  );
  y += 6;
  pdf.setDrawColor(80, 78, 70);
  pdf.setLineWidth(0.2);
  pdf.line(margin, y, w - margin, y);
  y += 12;

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...TEXT);
  const asc = chart.ascendant.rashi;
  chart.planets.forEach((p) => {
    const house = ((p.rashi - asc + 12) % 12) + 1;
    const nkIdx = Math.floor((p.longitude % 360) / (360 / 27));
    pdf.text(p.name, cols[0], y);
    pdf.text(RASHIS[p.rashi], cols[1], y);
    pdf.text(formatDegree(p.degreeInRashi), cols[2], y);
    pdf.text(String(house), cols[3], y);
    pdf.text(NAKSHATRAS[nkIdx], cols[4], y);
    pdf.text(p.retrograde ? "R" : "—", cols[5], y);
    y += 14;
    if (y > h - 100) return;
  });

  // Yogas & Doshas
  y += 12;
  const yogas = detectYogas(chart);
  const doshas = detectDoshas(chart);
  pdf.setTextColor(...GOLD);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("YOGAS DETECTED", margin, y, { charSpace: 2 });
  y += 14;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...TEXT);
  if (yogas.length === 0) {
    pdf.setTextColor(...MUTED);
    pdf.text("No major yogas detected.", margin, y); y += 14;
  } else {
    yogas.slice(0, 8).forEach((yg) => {
      const lines = pdf.splitTextToSize(`• ${yg.name} — ${yg.detail}`, w - margin * 2) as string[];
      lines.forEach((ln) => { pdf.text(ln, margin, y); y += 12; });
    });
  }

  y += 8;
  pdf.setTextColor(...GOLD);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("DOSHAS", margin, y, { charSpace: 2 });
  y += 14;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...TEXT);
  if (doshas.length === 0) {
    pdf.setTextColor(...MUTED);
    pdf.text("No major doshas detected.", margin, y);
  } else {
    doshas.forEach((d) => {
      const lines = pdf.splitTextToSize(`• ${d.name} — ${d.detail}`, w - margin * 2) as string[];
      lines.forEach((ln) => { pdf.text(ln, margin, y); y += 12; });
    });
  }

  // Vimshottari — new page
  pdf.addPage();
  setBG(); drawHeader();
  y = 90;
  pdf.setTextColor(...GOLD);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Vimshottari Mahadasha", margin, y);
  y += 22;

  const tree = computeVimshottari(birthDate, chart.moonNakshatra.index, chart.planets.find(p => p.name === "Moon")!.longitude % (360/27));
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...MUTED);
  const mdCols = [margin, margin + 100, margin + 220, margin + 340];
  ["Lord", "Start", "End", "Duration (yr)"].forEach((hd, i) => pdf.text(hd, mdCols[i], y));
  y += 6;
  pdf.setDrawColor(80, 78, 70); pdf.line(margin, y, w - margin, y); y += 12;
  pdf.setTextColor(...TEXT);
  tree.maha.forEach((md) => {
    if (y > h - 80) { pdf.addPage(); setBG(); drawHeader(); y = 90; }
    pdf.text(md.lord, mdCols[0], y);
    pdf.text(fmtDate(md.start), mdCols[1], y);
    pdf.text(fmtDate(md.end), mdCols[2], y);
    pdf.text(md.years.toFixed(2), mdCols[3], y);
    y += 14;
  });

  // Footer note
  pdf.setFontSize(8);
  pdf.setTextColor(...MUTED);
  pdf.text(
    `Generated ${new Date().toLocaleDateString()} · TAROMAYA · App by Riaa`,
    w / 2, h - 24, { align: "center" },
  );

  return pdf;
}

function buildCalcSettings(chart: KundliChart, form: FormState, birthDate: Date | null): CalcSettings {
  const tz = Number(form.tz) || 0;
  const local = birthDate ?? new Date();
  const utc = new Date(local.getTime() - tz * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const localIso = `${local.getFullYear()}-${pad(local.getMonth()+1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(local.getSeconds())}${tz >= 0 ? "+" : "-"}${pad(Math.floor(Math.abs(tz)))}:${pad(Math.round((Math.abs(tz)%1)*60))}`;
  return {
    zodiac: form.ayanamsa === "tropical" ? "Tropical" : "Sidereal",
    config: {
      ayanamsa: form.ayanamsa as CalcSettings["config"]["ayanamsa"],
      houseSystem: form.houseSystem as CalcSettings["config"]["houseSystem"],
      nodeType: form.nodeType as CalcSettings["config"]["nodeType"],
      elevationMeters: Number(form.elevation) || 0,
      topocentric: false,
    },
    latitude: Number(form.lat),
    longitude: Number(form.lon),
    placeLabel: form.place,
    localTimeIso: localIso,
    utcTimeIso: utc.toISOString(),
    tzOffsetHours: tz,
    ascendantLongitude: chart.ascendant.longitude,
    ascendantSign: RASHIS[chart.ascendant.rashi],
    computedAt: new Date().toISOString(),
  };
}

