import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type ReactNode } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  Sparkles, Loader2, MapPin, Save, Check, AlertTriangle,
  CheckCircle2, XCircle, Gem, Scroll, Activity, Grid3x3, KeyRound, Download,
} from "lucide-react";

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

type TabId = "overview" | "vargas" | "dasha" | "yogas" | "doshas" | "planets" | "ashtaka" | "shadbala" | "kp" | "lalkitab" | "gems" | "reading";
const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
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
                <SouthIndianChart chart={chart} />
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
          <Field label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} /></Field>
          <Field label="Time (24h)"><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputCls} disabled={form.unknownTime} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Seconds"><input value={form.seconds} onChange={(e) => setForm({ ...form, seconds: e.target.value })} className={inputCls} inputMode="numeric" disabled={form.unknownTime} placeholder="0" /></Field>
          <Field label="Timezone (hrs from UTC)"><input value={form.tz} onChange={(e) => setForm({ ...form, tz: e.target.value })} className={inputCls} placeholder="5.5" inputMode="decimal" /></Field>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={form.unknownTime} onChange={(e) => setForm({ ...form, unknownTime: e.target.checked })} className="accent-gold" />
          Time unknown (use noon chart)
        </label>
        <Field label="Place (for your reference)">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} className={inputCls + " pl-9"} placeholder="City, Country" />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude"><input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className={inputCls} inputMode="decimal" /></Field>
          <Field label="Longitude"><input value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })} className={inputCls} inputMode="decimal" /></Field>
        </div>
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
      <div className="grid grid-cols-4 grid-rows-4 aspect-square rounded-2xl overflow-hidden border border-gold/30 bg-black/40">
        {Array.from({ length: 16 }).map((_, i) => {
          const r = Math.floor(i / 4); const c = i % 4;
          const key = `${r}-${c}`;
          const rashi = CELL_TO_RASHI[key];
          const isCenter = rashi === undefined;
          if (isCenter) {
            if (r === 1 && c === 1) {
              return (
                <div key={i} className="col-span-2 row-span-2 grid place-items-center text-center border border-gold/20 bg-gradient-to-br from-midnight/40 to-cosmic/60">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-gold/70">Lagna</div>
                    <div className="font-display text-xl text-pearl mt-1">{RASHIS[chart.ascendant.rashi]}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{formatDegree(chart.ascendant.degreeInRashi)}</div>
                  </div>
                </div>
              );
            }
            return null;
          }
          const isAsc = rashi === chart.ascendant.rashi;
          const planets = planetsByRashi.get(rashi) ?? [];
          const houseNo = ((rashi - chart.ascendant.rashi + 12) % 12) + 1;
          return (
            <div key={i} className={`relative border border-white/10 p-1.5 text-[10px] ${isAsc ? "bg-gold/[0.06]" : "bg-white/[0.015]"}`}>
              <div className="flex items-start justify-between">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{RASHIS[rashi].slice(0, 3)}</span>
                <span className={`text-[9px] ${isAsc ? "text-gold" : "text-muted-foreground/60"}`}>{isAsc ? "As · " : ""}H{houseNo}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {planets.map((p) => (
                  <span key={p.name} className="inline-flex items-baseline rounded-md px-1 py-0.5 bg-white/5 text-pearl text-[10px]" title={p.name}>
                    {PLANET_SHORT[p.name]}{p.retrograde ? "ᴿ" : ""}
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
                  <div className="font-display text-sm text-pearl">{RASHIS[ascSign].slice(0, 3)}</div>
                </div>
              </div>
            );
            return null;
          }
          const isAsc = rashi === ascSign;
          const list = byRashi.get(rashi) ?? [];
          return (
            <div key={i} className={`relative border border-white/5 p-1 text-[9px] ${isAsc ? "bg-gold/[0.08]" : ""}`}>
              <div className="text-[8px] uppercase text-muted-foreground/70">{RASHIS[rashi].slice(0, 3)}</div>
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="py-2 pr-3">Planet</th><th className="py-2 pr-3">Rashi</th>
              <th className="py-2 pr-3">Degree</th><th className="py-2 pr-3">House</th>
              <th className="py-2 pr-3">Nakshatra</th><th className="py-2 pr-3">Motion</th>
            </tr>
          </thead>
          <tbody className="text-pearl/90">
            {chart.planets.map((p) => {
              const house = ((p.rashi - chart.ascendant.rashi + 12) % 12) + 1;
              return (
                <tr key={p.name} className="border-t border-white/5">
                  <td className="py-2 pr-3">{p.name}</td>
                  <td className="py-2 pr-3">{RASHIS[p.rashi]}</td>
                  <td className="py-2 pr-3">{formatDegree(p.degreeInRashi)}</td>
                  <td className="py-2 pr-3">{house}</td>
                  <td className="py-2 pr-3">{NAKSHATRAS[p.nakshatra]} · {p.pada}</td>
                  <td className="py-2 pr-3">
                    {p.retrograde ? <span className="text-aurora">Retrograde</span> : <span className="text-muted-foreground">Direct</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
            const house = ((i - asc + 12) % 12) + 1;
            const intensity = v / maxSarva;
            return (
              <div key={i} className="rounded-xl border border-white/10 p-2 text-center relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-t from-gold/40 to-gold/5"
                  style={{ opacity: intensity }}
                />
                <div className="relative">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{RASHIS[i].slice(0,3)} · H{house}</div>
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

      <GlassCard title="Bhinna Ashtakavarga" desc="Individual bindu distribution for each of the seven planets.">
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="text-left py-2 pr-3">Planet</th>
                {RASHIS.map((r) => <th key={r} className="py-2 px-1 text-center">{r.slice(0,3)}</th>)}
                <th className="py-2 pl-3 text-right">Σ</th>
              </tr>
            </thead>
            <tbody className="text-pearl/90">
              {av.bhinna.map((row) => (
                <tr key={row.planet} className="border-t border-white/5">
                  <td className="py-2 pr-3 font-medium">{row.planet}</td>
                  {row.bindus.map((b, i) => (
                    <td key={i} className={`py-2 px-1 text-center ${b >= 5 ? "text-gold" : b <= 2 ? "text-muted-foreground/50" : ""}`}>{b}</td>
                  ))}
                  <td className="py-2 pl-3 text-right text-gold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="py-2 pr-3"><KeyRound className="inline h-3 w-3 mr-1" />Point</th>
              <th className="py-2 pr-3">Sign</th>
              <th className="py-2 pr-3">Nakshatra</th>
              <th className="py-2 pr-3">Star Lord</th>
              <th className="py-2 pr-3">Sub Lord</th>
              <th className="py-2 pr-3">Sub-Sub</th>
            </tr>
          </thead>
          <tbody className="text-pearl/90">
            {rows.map((r) => (
              <tr key={r.who} className="border-t border-white/5">
                <td className="py-2 pr-3 font-medium">{r.who}</td>
                <td className="py-2 pr-3">{r.sign}</td>
                <td className="py-2 pr-3">{r.nakshatra}</td>
                <td className="py-2 pr-3 text-gold">{r.starLord}</td>
                <td className="py-2 pr-3 text-gold">{r.subLord}</td>
                <td className="py-2 pr-3 text-muted-foreground">{r.subSubLord}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
