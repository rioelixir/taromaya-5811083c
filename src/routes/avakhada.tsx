import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli } from "@/lib/vedic";
import { computeAvakhada } from "@/lib/avakhada";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/avakhada")({
  component: () => (
    <PremiumGate featureName="Avakhada Chakra">
      <AvakhadaPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Avakhada Chakra — TAROMAYA" },
      { name: "description", content: "Classical AstroSage-style Avakhada summary: Varna, Vashya, Yoni, Gana, Nadi, Tatva, Paya, and name syllable from your Vedic chart." },
    ],
  }),
});

type FormState = {
  date: string; time: string; tz: string; lat: string; lon: string; place: string;
};

const DEFAULTS: FormState = {
  date: "1995-06-15", time: "07:45", tz: "5.5",
  lat: "28.6139", lon: "77.2090", place: "New Delhi, India",
};

function AvakhadaPage() {
  const [form, setForm] = useState<FormState>(DEFAULTS);

  const chart = useMemo(() => {
    try {
      const [y, m, d] = form.date.split("-").map(Number);
      const [hh, mm] = form.time.split(":").map(Number);
      return computeKundli({
        year: y, month: m, day: d, hour: hh, minute: mm,
        tzOffsetHours: Number(form.tz),
        latitude: Number(form.lat), longitude: Number(form.lon),
      });
    } catch { return null; }
  }, [form]);

  const av = useMemo(() => (chart ? computeAvakhada(chart) : null), [chart]);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <PageShell
      title="Avakhada Chakra"
      subtitle="Classical natal summary — Varna, Vashya, Yoni, Gana, Nadi, Tatva, Paya, and name syllable"
    >
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <GlassCard>
          <h3 className="mb-3 font-serif text-lg">Birth Details</h3>
          <div className="space-y-3 text-xs">
            <Field label="Date"><input type="date" value={form.date} onChange={set("date")} className={inputCls} /></Field>
            <Field label="Time"><input type="time" value={form.time} onChange={set("time")} className={inputCls} /></Field>
            <Field label="Timezone (hours east of UTC)"><input type="number" step="0.25" value={form.tz} onChange={set("tz")} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Latitude"><input type="number" step="0.0001" value={form.lat} onChange={set("lat")} className={inputCls} /></Field>
              <Field label="Longitude"><input type="number" step="0.0001" value={form.lon} onChange={set("lon")} className={inputCls} /></Field>
            </div>
            <Field label="Place">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input value={form.place} onChange={set("place")} className={`${inputCls} pl-7`} />
              </div>
            </Field>
          </div>
        </GlassCard>

        {av && chart && (
          <div className="space-y-4">
            <GlassCard>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Cell label="Lagna" value={av.ascendant.rashi} sub={`Lord: ${av.ascendant.lord}`} />
                <Cell label="Rashi (Moon)" value={av.moonSign.rashi} sub={`Lord: ${av.moonSign.lord}`} />
                <Cell label="Sun Sign" value={av.sunSign.rashi} sub={`Lord: ${av.sunSign.lord}`} />
                <Cell label="Nakshatra" value={av.nakshatra.name} sub={`Pada ${av.nakshatra.pada} · Lord ${av.nakshatra.lord}`} />
                <Cell label="Name Syllable" value={av.nameSyllable} sub={`Charan ${av.nakshatra.charan}`} highlight />
                <Cell label="Tatva" value={av.tatvaLabel} sub={av.tatva} />
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="mb-3 font-serif text-lg">Classical Attributes</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                <Cell label="Varna" value={av.varna} />
                <Cell label="Vashya" value={av.vashya} />
                <Cell label="Yoni" value={av.yoni} />
                <Cell label="Gana" value={av.gana} />
                <Cell label="Nadi" value={av.nadi} />
                <Cell label="Paya" value={av.paya} />
                <Cell label="Yunja" value={av.yunja} />
                <Cell
                  label="Gandanta"
                  value={av.ganda ? "Yes" : "No"}
                  sub={av.gandaReason}
                  danger={av.ganda}
                />
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="mb-2 font-serif text-lg">What this means</h3>
              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <p><span className="text-primary">Varna</span> — social-spiritual temperament layer used in Ashtakoot.</p>
                <p><span className="text-primary">Vashya</span> — magnetism / influence group of the Moon rashi.</p>
                <p><span className="text-primary">Yoni</span> — instinctive / sexual archetype from birth nakshatra.</p>
                <p><span className="text-primary">Gana</span> — Deva / Manushya / Rakshasa nature of the nakshatra.</p>
                <p><span className="text-primary">Nadi</span> — pulse of constitution; Adi (Vata), Madhya (Pitta), Antya (Kapha).</p>
                <p><span className="text-primary">Tatva</span> — elemental essence of the Moon rashi.</p>
                <p><span className="text-primary">Paya</span> — birth metal (Gold, Silver, Copper) by nakshatra bucket.</p>
                <p><span className="text-primary">Name Syllable</span> — traditional starting sound for the naming ceremony.</p>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </PageShell>
  );
}

const inputCls = "w-full rounded-md border border-border/40 bg-background/40 px-2 py-1.5 font-mono text-xs";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Cell({ label, value, sub, highlight, danger }: {
  label: string; value: string; sub?: string; highlight?: boolean; danger?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${
      danger ? "border-rose-400/40 bg-rose-500/5"
        : highlight ? "border-primary/50 bg-primary/10"
        : "border-border/40 bg-background/30"
    }`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-serif text-lg ${highlight ? "text-primary" : ""}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
