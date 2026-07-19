import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli } from "@/lib/vedic";
import { analyzeDharma, ROLE_META } from "@/lib/dharma";
import { Crown, Sparkles, Compass } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/dharma")({
  component: () => (
    <PremiumGate featureName="Dharma & Ishta Devata">
      <DharmaPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Dharma & Ishta Devata — TAROMAYA" },
      { name: "description", content: "Discover your Atmakaraka, Ishta Devata and life mission through Jaimini charakarakas and the 10th-house karma axis." },
    ],
  }),
});

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090" };

function DharmaPage() {
  const [form, setForm] = useState(DEFAULT);
  useAutofillBirth<typeof DEFAULT>(setForm);

  const reading = useMemo(() => {
    try {
      const [y, m, d] = form.date.split("-").map(Number);
      const [hh, mm] = form.time.split(":").map(Number);
      const chart = computeKundli({
        year: y, month: m, day: d, hour: hh, minute: mm,
        tzOffsetHours: Number(form.tz),
        latitude: Number(form.lat), longitude: Number(form.lon),
      });
      return analyzeDharma(chart);
    } catch { return null; }
  }, [form]);

  return (
    <PageShell
      eyebrow="Dharma · Ishta Devata · Life Mission"
      title="The deity of your soul"
      subtitle="Jaimini charakarakas rank the eight planets by degree — the highest is your Atmakaraka. The 12th sign from AK in navamsa reveals your Ishta Devata, and the 10th-house lord shapes the outer form of your dharma."
    >
      <GlassCard title="Birth data">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { k: "date", label: "Date", type: "date" },
            { k: "time", label: "Time", type: "time" },
            { k: "tz", label: "TZ", type: "text" },
            { k: "lat", label: "Latitude", type: "text" },
            { k: "lon", label: "Longitude", type: "text" },
          ].map((f) => (
            <label key={f.k} className="text-xs uppercase tracking-widest text-muted-foreground">
              {f.label}
              <input type={f.type} value={(form as Record<string,string>)[f.k]}
                onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                className="mt-1 w-full glass rounded-xl px-3 py-2 text-sm text-pearl outline-none focus:ring-1 focus:ring-gold/60" />
            </label>
          ))}
        </div>
      </GlassCard>

      {reading && (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="glass rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-gold" />
                <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Ishta Devata</div>
              </div>
              <div className="font-display text-4xl gold-text">{reading.ishtaDevata.deity}</div>
              <div className="text-sm text-muted-foreground">
                From the 12th navamsa of your Atmakaraka: {reading.ishtaDevata.sign} · ruled by {reading.ishtaDevata.lord}
              </div>
              <p className="text-sm text-pearl leading-relaxed pt-2">{reading.ishtaDevata.guidance}</p>
            </div>

            <div className="glass rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-gold" />
                <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Life mission</div>
              </div>
              <p className="text-pearl leading-relaxed">{reading.lifeMission}</p>
              <div className="pt-3 border-t border-white/5 grid gap-2 text-xs">
                <Row label="Atmakaraka" value={`${reading.atmakaraka.planet} · ${reading.atmakaraka.degrees.toFixed(2)}°`} />
                <Row label="10th lord" value={`${reading.tenthHouseLord.planet} in ${reading.tenthHouseLord.sign} (${reading.tenthHouseLord.houseFromAsc}H)`} />
              </div>
            </div>
          </div>

          <div className="mt-6 glass rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-gold" />
              <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Jaimini Charakarakas</div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {reading.charakarakas.map((c) => (
                <div key={c.role} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-gold/80">{c.role} · {c.fullName}</div>
                    <div className="text-sm text-muted-foreground/90 italic">{ROLE_META[c.role].theme}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-pearl">{c.planet}</div>
                    <div className="text-[10px] text-muted-foreground">{c.degrees.toFixed(2)}°</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 glass rounded-3xl p-6">
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Atmakaraka dharma path</div>
            <p className="text-pearl leading-relaxed">{reading.atmakarakaDharma}</p>
          </div>
        </>
      )}
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground uppercase tracking-widest text-[10px]">{label}</span>
      <span className="text-pearl text-right">{value}</span>
    </div>
  );
}
