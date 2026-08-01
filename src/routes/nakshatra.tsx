import { BirthVoiceBox } from "@/components/birth-voice-box";
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

const DEFAULT = { date: "1995-06-15", time: "07:45", tz: "5.5", lat: "28.6139", lon: "77.2090", place: "New Delhi, Delhi, India" };

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

      <BirthVoiceBox value={form} onChange={(p) => setForm((prev) => ({ ...prev, ...p }))} />
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
          <GlassCard title="In plain English">
            <p className="text-sm text-muted-foreground">
              A nakshatra is one of 27 star patterns the Moon travels through — think of it as a more
              detailed personality reading than your Moon sign alone. {chart ? (
                <>Your Moon was in <span className="text-primary">{profile.name}</span>, ruled by{" "}
                <span className="text-primary">{profile.lord}</span>, whose short story is "{profile.deityShort}".</>
              ) : (
                <>Enter your birth date and time above to see your own nakshatra.</>
              )}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Below is the full profile card (deity, personality traits, career leanings, favourable and
              unfavourable activities), then a matchmaking tool that compares two nakshatras the way a
              traditional marriage match would.
            </p>
          </GlassCard>

          <ProfileCard p={profile} birthPada={birthNak === activeIndex ? birthPada : undefined} />

          <GlassCard
            title="Nakshatra match making"
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
