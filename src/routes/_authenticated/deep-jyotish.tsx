import { createFileRoute, Link } from "@tanstack/react-router";
import { PremiumGate } from "@/components/premium-gate";
import { PageShell, GlassCard } from "@/components/page-shell";
import { useBirthProfile, birthProfileToKundliInput } from "@/hooks/use-birth-profile";
import { useMemo } from "react";
import { computeKundli, RASHIS, formatDegree, PLANET_SHORT, type KundliChart } from "@/lib/vedic";
import { computeCharaKarakas, computeCharaDasha, KARAKA_MEANING, type ChartLite as JChartLite } from "@/lib/jaimini";
import { kpPlanets, kpCusps, cuspalSignificators, type ChartLite as KChartLite } from "@/lib/kp";
import { computePanchang, fmtTime, fmtRange, type Panchang } from "@/lib/panchang";
import { Sparkles, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/deep-jyotish")({
  component: () => (
    <PremiumGate featureName="Deep Jyotish Reports">
      <DeepJyotishPage />
    </PremiumGate>
  ),
});

/** Adapt vedic KundliChart to the ChartLite shape KP/Jaimini modules expect. */
function toChartLite(k: KundliChart): JChartLite & KChartLite {
  return {
    ascendant: {
      rashi: k.ascendant.rashi,
      degreeInRashi: k.ascendant.degreeInRashi,
      longitude: k.ascendant.longitude,
    } as never,
    planets: k.planets.map((p) => ({
      name: p.name,
      longitude: p.longitude,
      rashi: p.rashi,
      degreeInRashi: p.degreeInRashi,
      retrograde: p.retrograde,
      house: ((p.rashi - k.ascendant.rashi + 12) % 12) + 1,
    })),
  } as JChartLite & KChartLite;
}

function DeepJyotishPage() {
  const { data: profile, isLoading } = useBirthProfile();

  const computed = useMemo(() => {
    if (!profile) return null;
    const input = birthProfileToKundliInput(profile);
    const chart = computeKundli(input);
    const lite = toChartLite(chart);
    const birthDate = new Date(
      Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, input.seconds ?? 0)
        - input.tzOffsetHours * 3600_000
    );
    const karakas = computeCharaKarakas(lite);
    const dasha = computeCharaDasha(lite, birthDate, 2);
    const kpPl = kpPlanets(lite);
    const kpCu = kpCusps(lite);
    const sig = cuspalSignificators(lite);
    const today = new Date();
    const panch7 = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today.getTime() + i * 86400_000);
      return { date: d, p: computePanchang({ date: d, latitude: input.latitude, longitude: input.longitude }) };
    });
    return { chart, karakas, dasha, kpPl, kpCu, sig, panch7 };
  }, [profile]);

  if (isLoading) {
    return (
      <PageShell title="Deep Jyotish" subtitle="Loading your sky…">
        <GlassCard><div className="py-12 text-center text-muted-foreground">Preparing your report…</div></GlassCard>
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell title="Deep Jyotish" subtitle="One-time setup unlocks every module.">
        <GlassCard>
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-2">
              <div className="font-medium">Add your birth details first</div>
              <p className="text-sm text-muted-foreground max-w-lg">
                Everything here — Dashas, KP sub-lords, Chara Karakas, weekly Panchang — reads from your saved birth chart.
                Add it once; only you can ever see it.
              </p>
              <Link
                to="/birth-details"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium px-5 py-2 text-sm mt-2"
              >
                <Sparkles className="h-4 w-4" /> Enter birth details
              </Link>
            </div>
          </div>
        </GlassCard>
      </PageShell>
    );
  }

  const c = computed!;
  const now = Date.now();
  const activeDasha = c.dasha.find((d) => d.start.getTime() <= now && d.end.getTime() > now);

  return (
    <PageShell
      title="Deep Jyotish"
      subtitle="Chara Dasha · KP Sub-Lord Report · 7-day Panchang — all from your one saved chart."
    >
      <div className="space-y-6">
        {/* Chara Karakas */}
        <GlassCard>
          <SectionHeader title="Chara Karakas (Jaimini)" hint="Soul-signature roles by degree." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {c.karakas.map((k) => (
              <div key={k.karaka} className="rounded-2xl border border-border bg-card/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold gold-text text-lg">{k.karaka}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{RASHIS[k.rashi].slice(0,3)}</span>
                </div>
                <div className="text-sm font-medium">{k.planet}</div>
                <div className="text-[11px] text-muted-foreground">{formatDegree(k.degree)}</div>
                <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{KARAKA_MEANING[k.karaka]}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Chara Dasha */}
        <GlassCard>
          <SectionHeader
            title="Chara Dasha (Jaimini)"
            hint={activeDasha ? `Active: ${RASHIS[activeDasha.sign]} · ${activeDasha.lord} · ${activeDasha.years}y` : ""}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left py-2 px-2">Sign</th>
                  <th className="text-left py-2 px-2">Lord</th>
                  <th className="text-right py-2 px-2">Years</th>
                  <th className="text-left py-2 px-2">Start</th>
                  <th className="text-left py-2 px-2">End</th>
                </tr>
              </thead>
              <tbody>
                {c.dasha.slice(0, 24).map((d, i) => {
                  const active = d.start.getTime() <= now && d.end.getTime() > now;
                  return (
                    <tr key={i} className={`border-b border-border/40 ${active ? "bg-accent/10" : ""}`}>
                      <td className="py-1.5 px-2 font-medium">{RASHIS[d.sign]}</td>
                      <td className="py-1.5 px-2">{d.lord}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{d.years}</td>
                      <td className="py-1.5 px-2 tabular-nums text-muted-foreground">{d.start.toISOString().slice(0,10)}</td>
                      <td className="py-1.5 px-2 tabular-nums text-muted-foreground">{d.end.toISOString().slice(0,10)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* KP Sub-Lord */}
        <GlassCard>
          <SectionHeader title="KP Sub-Lord Report" hint="Placidus-style significators on whole-sign cusps." />
          <div className="grid md:grid-cols-2 gap-6">
            <SubTable title="Planets" rows={c.kpPl} />
            <SubTable title="Cusps" rows={c.kpCu} />
          </div>
          <div className="mt-6">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Cuspal Significators (A → D)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="text-left py-1.5 px-2">Bhava</th>
                    <th className="text-left py-1.5 px-2">Sign</th>
                    <th className="text-left py-1.5 px-2">A · in star of occupants</th>
                    <th className="text-left py-1.5 px-2">B · occupants</th>
                    <th className="text-left py-1.5 px-2">C · in star of lord</th>
                    <th className="text-left py-1.5 px-2">D · lord</th>
                  </tr>
                </thead>
                <tbody>
                  {c.sig.map((r) => (
                    <tr key={r.house} className="border-b border-border/40">
                      <td className="py-1.5 px-2 font-medium">{r.house}</td>
                      <td className="py-1.5 px-2">{RASHIS[r.sign].slice(0,3)}</td>
                      <td className="py-1.5 px-2 text-muted-foreground">{r.A.map(shortName).join(", ") || "—"}</td>
                      <td className="py-1.5 px-2">{r.B.map(shortName).join(", ") || "—"}</td>
                      <td className="py-1.5 px-2 text-muted-foreground">{r.C.map(shortName).join(", ") || "—"}</td>
                      <td className="py-1.5 px-2">{r.D.map(shortName).join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </GlassCard>

        {/* 7-day Panchang */}
        <GlassCard>
          <SectionHeader title="7-Day Panchang" hint="Tithi · Nakshatra · Yoga · Karana · Rahu Kaal." />
          <div className="grid gap-3">
            {c.panch7.map(({ date, p }) => (
              <PanchangRow key={date.toISOString()} date={date} p={p} />
            ))}
          </div>
        </GlassCard>

        <div className="text-center text-[11px] text-muted-foreground">
          Reading your chart from your saved birth details.{" "}
          <Link to="/birth-details" className="text-primary hover:underline">Edit</Link>
        </div>
      </div>
    </PageShell>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
      <h3 className="text-lg font-semibold gold-text">{title}</h3>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

function SubTable({ title, rows }: { title: string; rows: ReturnType<typeof kpPlanets> }) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
              <th className="text-left py-1.5 px-1.5">Who</th>
              <th className="text-left py-1.5 px-1.5">Sign</th>
              <th className="text-left py-1.5 px-1.5">Star</th>
              <th className="text-left py-1.5 px-1.5">Sub</th>
              <th className="text-left py-1.5 px-1.5">Sub-Sub</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/40">
                <td className="py-1 px-1.5 font-medium">{r.who}</td>
                <td className="py-1 px-1.5">{RASHIS[r.sign].slice(0,3)}</td>
                <td className="py-1 px-1.5">{r.starLord}</td>
                <td className="py-1 px-1.5">{r.subLord}</td>
                <td className="py-1 px-1.5 text-muted-foreground">{r.subSubLord}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PanchangRow({ date, p }: { date: Date; p: Panchang }) {
  const label = date.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">
          Sunrise {fmtTime(p.sunrise)} · Sunset {fmtTime(p.sunset)}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
        <Item k="Tithi" v={`${p.tithi.paksha} · ${p.tithi.name}`} />
        <Item k="Nakshatra" v={`${p.nakshatra.name} (${p.nakshatra.pada})`} />
        <Item k="Yoga" v={p.yoga.name} />
        <Item k="Karana" v={p.karana.name} />
        <Item k="Rahu Kaal" v={fmtRange(p.rahuKaal)} />
        <Item k="Yamaganda" v={fmtRange(p.yamaganda)} />
        <Item k="Abhijit" v={fmtRange(p.abhijitMuhurat)} />
        <Item k="Brahma" v={fmtRange(p.brahmaMuhurat)} />
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}

function shortName(n: string): string {
  return PLANET_SHORT[n as keyof typeof PLANET_SHORT] ?? n;
}
