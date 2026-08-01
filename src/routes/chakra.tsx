import { BirthVoiceBox } from "@/components/birth-voice-box";
import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli } from "@/lib/vedic";
import { analyzeChakras, CHAKRA_META, type Chakra } from "@/lib/chakra";
import { Sparkles, Music, Gem, HeartPulse, AlertTriangle } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/chakra")({
  component: () => (
    <PremiumGate featureName="Chakra Analyzer">
      <ChakraPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Chakra Analyzer — TAROMAYA" },
      {
        name: "description",
        content:
          "Map your seven-chakra energy profile from your Vedic birth chart, with bija mantras, gemstones, mudras and yogic practices for each center.",
      },
    ],
  }),
});

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090", place: "New Delhi, Delhi, India" };

function ChakraWheel({
  active, onSelect,
  values,
}: {
  active: Chakra;
  onSelect: (c: Chakra) => void;
  values: Record<Chakra, number>;
}) {
  const order: Chakra[] = ["Sahasrara","Ajna","Vishuddha","Anahata","Manipura","Svadhisthana","Muladhara"];
  return (
    <div className="relative mx-auto w-full max-w-[280px] aspect-[1/2.4]">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-fuchsia-400/40 via-emerald-400/40 to-rose-500/40" />
      <div className="flex h-full flex-col justify-between py-2">
        {order.map((c) => {
          const meta = CHAKRA_META[c];
          const v = values[c];
          const size = 44 + Math.round((v / 100) * 32);
          const isActive = active === c;
          return (
            <button
              key={c}
              onClick={() => onSelect(c)}
              className="group relative mx-auto grid place-items-center transition-transform hover:scale-105"
              style={{ width: size, height: size }}
              aria-label={`${c} — ${v}%`}
            >
              <span
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${meta.color} ${isActive ? "opacity-100" : "opacity-70"} blur-[1px]`}
              />
              <span
                className={`absolute inset-0 rounded-full ring-2 ${isActive ? "ring-white/70" : "ring-white/10"} transition`}
              />
              <span className="relative font-display text-[11px] text-white/95 drop-shadow">{meta.bija}</span>
              <span className="absolute -right-24 top-1/2 -translate-y-1/2 hidden sm:block text-[10px] uppercase tracking-[0.28em] text-muted-foreground whitespace-nowrap">
                {c} · {v}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChakraDetail({ chakra, value, state }: { chakra: Chakra; value: number; state: string }) {
  const m = CHAKRA_META[chakra];
  return (
    <div className="glass rounded-3xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">{m.english} Chakra</div>
          <div className="mt-1 font-display text-3xl gold-text">{chakra}</div>
          <div className="text-sm text-muted-foreground italic mt-0.5">
            {m.sanskrit} · {m.petals} petals · {m.element}
          </div>
        </div>
        <div
          className={`h-16 w-16 rounded-full grid place-items-center ring-2 ring-white/20 bg-gradient-to-br ${m.color}`}
        >
          <span className="font-display text-white text-lg drop-shadow">{m.bija}</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Activation</span>
          <span className="text-sm text-pearl">{value}% · {state}</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-pearl italic">"{m.affirmation}"</p>

      <div className="grid gap-3 text-xs">
        <Row label="Location" value={m.location} />
        <Row label="Gemstones" value={m.gemstone} />
        <Row label="Mantras" value={m.mantras.join(" · ")} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground uppercase tracking-widest text-[10px]">{label}</span>
      <span className="text-pearl text-right">{value}</span>
    </div>
  );
}

function Card({
  icon: Icon, title, items, tone = "gold",
}: { icon: typeof Sparkles; title: string; items: string[]; tone?: "gold" | "warn" }) {
  const accent = tone === "warn" ? "text-rose-300" : "text-gold";
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${accent}`} />
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{title}</div>
      </div>
      <ul className="space-y-2 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className={accent}>•</span>
            <span className="text-muted-foreground/90">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChakraPage() {
  const [form, setForm] = useState(DEFAULT);
  useAutofillBirth<typeof DEFAULT>(setForm);
  const [selected, setSelected] = useState<Chakra>("Anahata");

  const reading = useMemo(() => {
    try {
      const [y, m, d] = form.date.split("-").map(Number);
      const [hh, mm] = form.time.split(":").map(Number);
      const chart = computeKundli({
        year: y, month: m, day: d, hour: hh, minute: mm,
        tzOffsetHours: Number(form.tz),
        latitude: Number(form.lat), longitude: Number(form.lon),
      });
      return analyzeChakras(chart);
    } catch {
      return null;
    }
  }, [form]);

  const valuesMap = useMemo(() => {
    const map = {} as Record<Chakra, number>;
    reading?.scores.forEach((s) => (map[s.chakra] = s.value));
    return map;
  }, [reading]);

  const selectedScore = reading?.scores.find((s) => s.chakra === selected);

  return (
    <PageShell
      eyebrow="Chakra Analyzer"
      title="Your subtle-body energy profile"
      subtitle="Seven radiant centers derived from your natal chart — with bija mantras, gemstones, mudras and yogic practices to open, balance or soften each one."
    >
      <GlassCard title="Birth data">
        <BirthVoiceBox value={form} onChange={(p) => setForm((prev) => ({ ...prev, ...p }))} />
      </GlassCard>

      {reading && selectedScore && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="glass rounded-3xl p-6 flex flex-col items-center">
            <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-3">
              Sushumna axis
            </div>
            <ChakraWheel active={selected} onSelect={setSelected} values={valuesMap} />
            <div className="mt-6 w-full pt-4 border-t border-white/5 grid gap-2 text-xs">
              <Row label="Overall balance" value={`${reading.overallBalance}%`} />
              <Row label="Dominant" value={reading.dominant} />
              <Row label="Needs care" value={reading.weakest} />
            </div>
          </div>

          <div className="space-y-6">
            <ChakraDetail chakra={selected} value={selectedScore.value} state={selectedScore.state} />

            <div className="grid gap-4 md:grid-cols-2">
              <Card icon={Sparkles} title="Practices" items={CHAKRA_META[selected].practices} />
              <Card icon={Music} title="Mantras" items={CHAKRA_META[selected].mantras} />
              <Card icon={Gem} title="Gemstones" items={CHAKRA_META[selected].gemstone.split(" · ")} />
              <Card
                icon={AlertTriangle}
                title="Imbalance signs"
                items={CHAKRA_META[selected].imbalance.split(", ")}
                tone="warn"
              />
            </div>
          </div>
        </div>
      )}

      {reading && (
        <div className="mt-6 glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <HeartPulse className="h-4 w-4 text-gold" />
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">All seven centers</div>
          </div>
          <div className="grid gap-3">
            {reading.scores.map((s) => {
              const m = CHAKRA_META[s.chakra];
              return (
                <button
                  key={s.chakra}
                  onClick={() => setSelected(s.chakra)}
                  className={`text-left group ${selected === s.chakra ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${m.color}`} />
                      <span className="text-sm text-pearl font-medium">{s.chakra}</span>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {m.english} · {m.bija}
                      </span>
                    </div>
                    <span className="text-xs text-pearl">{s.value}% · {s.state}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all`}
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}
