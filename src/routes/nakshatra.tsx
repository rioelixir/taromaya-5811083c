import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computeKundli, NAKSHATRAS, PLANET_GLYPHS, RASHIS } from "@/lib/vedic";
import {
  nakshatraProfile, padaNavamsha, padaElement, padaTheme,
  ganaCompat, nadiCompat, yoniCompat, type NakshatraProfile,
} from "@/lib/nakshatra-deep";
import { Star, Compass, Flame, Droplet, Wind, Mountain, Sparkles } from "lucide-react";
import { useAutofillBirth } from "@/hooks/use-birth-profile";

export const Route = createFileRoute("/nakshatra")({
  component: () => (
    <PremiumGate featureName="Nakshatra Intelligence">
      <NakshatraPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Nakshatra Intelligence — TAROMAYA" },
      {
        name: "description",
        content:
          "Deep 27-nakshatra dashboard with pada-level navamsha, deity, symbol, yoni, gana, nadi, guna, tattva and compatibility.",
      },
    ],
  }),
});

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090" };

const TATTVA_ICON: Record<string, typeof Flame> = {
  Fire: Flame, Water: Droplet, Air: Wind, Earth: Mountain, Ether: Sparkles,
};

function Chip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl px-3 py-2 flex items-center justify-between gap-3">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <span className="text-sm text-pearl">{value}</span>
    </div>
  );
}

function ProfileCard({ p, birthPada }: { p: NakshatraProfile; birthPada?: number }) {
  const TIcon = TATTVA_ICON[p.tattva] ?? Sparkles;
  return (
    <div className="glass rounded-3xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-gold/80">Nakshatra #{p.index + 1}</div>
          <div className="mt-1 font-display text-3xl gold-text">{p.name}</div>
          <div className="text-sm text-muted-foreground italic">{p.deityShort}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Lord</div>
          <div className="font-display text-xl text-pearl">{p.lord}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Chip label="Deity" value={p.deity} />
        <Chip label="Symbol" value={p.symbol} />
        <Chip label="Body" value={p.bodyPart} />
        <Chip label="Yoni" value={`${p.yoni} (${p.yoniGender})`} />
        <Chip label="Gana" value={p.gana} />
        <Chip label="Nadi" value={p.nadi} />
        <Chip label="Guna" value={p.guna} />
        <Chip label="Varna" value={p.varna as string} />
        <Chip label="Tattva" value={p.tattva} />
        <Chip label="Direction" value={p.direction} />
        <Chip label="Group" value={p.group} />
        <Chip label="Gem" value={p.gemstone} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="text-xs uppercase tracking-widest text-emerald-400/80 mb-2">Strengths</div>
          <ul className="text-sm text-pearl space-y-1">{p.strengths.map((s) => <li key={s}>· {s}</li>)}</ul>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="text-xs uppercase tracking-widest text-red-400/80 mb-2">Shadows</div>
          <ul className="text-sm text-pearl space-y-1">{p.shadows.map((s) => <li key={s}>· {s}</li>)}</ul>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass rounded-2xl p-4">
          <div className="text-xs uppercase tracking-widest text-gold/80 mb-2">Favourable</div>
          <div className="text-sm text-pearl">{p.favourable.join(" · ")}</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Avoid</div>
          <div className="text-sm text-pearl">{p.unfavourable.join(" · ")}</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="text-xs uppercase tracking-widest text-gold/80 mb-2">Career fields</div>
        <div className="flex flex-wrap gap-2">
          {p.career.map((c) => (
            <span key={c} className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">{c}</span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4">
        <div className="text-xs uppercase tracking-widest text-gold mb-1">Mantra</div>
        <div className="font-display text-lg text-pearl">{p.mantra}</div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <TIcon className="h-4 w-4 text-gold" />
          <div className="font-display text-lg text-pearl">Padas & Navamsha</div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[1, 2, 3, 4].map((k) => {
            const nav = padaNavamsha(p.index, k);
            const el = padaElement(p.index, k);
            const highlight = birthPada === k;
            return (
              <div
                key={k}
                className={`rounded-xl p-3 border ${
                  highlight
                    ? "border-gold/60 bg-gold/10 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-pearl">Pada {k}</div>
                  {highlight && (
                    <span className="text-[9px] uppercase tracking-widest text-gold">Your pada</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {RASHIS[nav]} navamsha · {el}
                </div>
                <div className="text-xs text-muted-foreground mt-1 italic">{padaTheme(p.index, k)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NakshatraPage() {
  const [form, setForm] = useState(DEFAULT);
  useAutofillBirth<typeof DEFAULT>(setForm);
  const [selected, setSelected] = useState<number | null>(null);
  const [partnerNak, setPartnerNak] = useState<number>(0);

  const chart = useMemo(() => {
    try {
      const [y, m, d] = form.date.split("-").map(Number);
      const [hh, mm] = form.time.split(":").map(Number);
      return computeKundli({
        year: y, month: m, day: d, hour: hh, minute: mm,
        tzOffsetHours: Number(form.tz),
        latitude: Number(form.lat), longitude: Number(form.lon),
      });
    } catch {
      return null;
    }
  }, [form]);

  const birthNak = chart?.moonNakshatra.index ?? null;
  const birthPada = chart?.moonNakshatra.pada;
  const activeIndex = selected ?? birthNak ?? 0;
  const profile = nakshatraProfile(activeIndex);
  const partner = nakshatraProfile(partnerNak);

  const gana = ganaCompat(profile.gana, partner.gana);
  const nadi = nadiCompat(profile.nadi, partner.nadi);
  const yoni = yoniCompat(profile.yoni, partner.yoni);
  const compatTotal = gana.score + nadi.score + yoni.score;

  return (
    <PageShell
      eyebrow="Nakshatra Intelligence"
      title="The 27 lunar mansions"
      subtitle="Each nakshatra is a personality, a body of stars, and a doorway. Explore the full pada-level chart of your Moon and cross-reference deity, gana, yoni and nadi."
    >
      <GlassCard title="Birth data">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { k: "date", label: "Date", type: "date" },
            { k: "time", label: "Time", type: "time" },
            { k: "tz", label: "TZ offset", type: "text" },
            { k: "lat", label: "Latitude", type: "text" },
            { k: "lon", label: "Longitude", type: "text" },
          ].map((f) => (
            <label key={f.k} className="text-xs uppercase tracking-widest text-muted-foreground">
              {f.label}
              <input
                type={f.type}
                value={(form as any)[f.k]}
                onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                className="mt-1 w-full glass rounded-xl px-3 py-2 text-sm text-pearl outline-none focus:ring-1 focus:ring-gold/60"
              />
            </label>
          ))}
        </div>
        {chart && (
          <div className="mt-4 text-sm text-pearl flex flex-wrap gap-4">
            <span>
              <span className="text-muted-foreground">Moon nakshatra:</span>{" "}
              <span className="text-gold">{NAKSHATRAS[chart.moonNakshatra.index]}</span> ·{" "}
              Pada {chart.moonNakshatra.pada} · Lord {chart.moonNakshatra.lord}
            </span>
          </div>
        )}
      </GlassCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <GlassCard title="All 27 nakshatras">
          <div className="max-h-[80vh] overflow-y-auto pr-2 space-y-1">
            {NAKSHATRAS.map((n, i) => {
              const isBirth = i === birthNak;
              const isActive = i === activeIndex;
              return (
                <button
                  key={n}
                  onClick={() => setSelected(i)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between transition-colors ${
                    isActive
                      ? "bg-gold/15 text-pearl border border-gold/40"
                      : "hover:bg-white/[0.05] text-pearl/80 border border-transparent"
                  }`}
                >
                  <span>
                    <span className="text-muted-foreground text-xs mr-2">{String(i + 1).padStart(2, "0")}</span>
                    {n}
                  </span>
                  {isBirth && <Star className="h-3 w-3 text-gold" />}
                </button>
              );
            })}
          </div>
        </GlassCard>

        <div className="space-y-6">
          <ProfileCard p={profile} birthPada={birthNak === activeIndex ? birthPada : undefined} />

          <GlassCard
            title="Nakshatra compatibility"
            desc="Cross-reference this nakshatra with any other for Gana / Nadi / Yoni matching (out of 18)."
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">Partner nakshatra</span>
              <select
                value={partnerNak}
                onChange={(e) => setPartnerNak(Number(e.target.value))}
                className="glass rounded-xl px-3 py-2 text-sm text-pearl outline-none focus:ring-1 focus:ring-gold/60"
              >
                {NAKSHATRAS.map((n, i) => (
                  <option key={n} value={i} className="bg-background text-pearl">
                    {String(i + 1).padStart(2, "0")} · {n}
                  </option>
                ))}
              </select>
              <div className="ml-auto flex items-center gap-2">
                <Compass className="h-4 w-4 text-gold" />
                <span className="font-display text-2xl gold-text">{compatTotal}</span>
                <span className="text-xs text-muted-foreground">/ 18</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Gana", res: gana, max: 6 },
                { label: "Nadi", res: nadi, max: 8 },
                { label: "Yoni", res: yoni, max: 4 },
              ].map((row) => (
                <div key={row.label} className="glass rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">{row.label}</span>
                    <span className="text-sm text-pearl">
                      {row.res.score} / {row.max}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold/50 to-gold"
                      style={{ width: `${(row.res.score / row.max) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{row.res.note}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          {chart && (
            <GlassCard title="Your planets by nakshatra" desc="Every graha's lunar-mansion placement and pada.">
              <div className="grid gap-2 sm:grid-cols-2">
                {chart.planets.map((p) => {
                  const prof = nakshatraProfile(p.nakshatra);
                  return (
                    <button
                      key={p.name}
                      onClick={() => setSelected(p.nakshatra)}
                      className="glass rounded-xl p-3 flex items-center justify-between hover:bg-white/[0.06] transition-colors text-left"
                    >
                      <div>
                        <div className="text-sm text-pearl">
                          <span className="text-gold mr-2">{PLANET_GLYPHS[p.name as keyof typeof PLANET_GLYPHS]}</span>
                          {p.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {prof.name} · Pada {p.pada} · Lord {prof.lord}
                        </div>
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground text-right">
                        <div>{prof.gana}</div>
                        <div>{prof.nadi} nadi</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </PageShell>
  );
}
