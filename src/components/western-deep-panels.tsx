import { useMemo, useState } from "react";
import { GlassCard } from "@/components/page-shell";
import { BirthVoiceBox } from "@/components/birth-voice-box";
import { PLANET_GLYPHS } from "@/lib/vedic";
import {
  computeWesternChart, computeAspects, SIGN_GLYPHS, SIGN_NAMES, type WesternChart,
} from "@/lib/western";
import {
  ascendantReport, cuspRows, dms, midpointTable, minorPoints, natalInsights,
  parallels, planetInHouseReport, planetInSignReport, planetRows, prenatalSyzygy,
} from "@/lib/western-tables";
import {
  compositeChart, eclipseTable, moonPhaseCalendar, prenatalEclipse, prenatalEpoch,
  progressedLunarEvents, returnChart, secondaryProgressions, upcomingReturns,
} from "@/lib/western-predictive";
import { solarArcDirections, solarArcHits, midpointTree } from "@/lib/western-deep";
import { ChevronDown } from "lucide-react";

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmtDateTime = (d: Date) =>
  `${fmtDate(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left min-h-[56px]"
        aria-expanded={open}
      >
        <span>
          <span className="block font-display text-lg text-pearl">{title}</span>
          {subtitle && <span className="block text-xs text-muted-foreground mt-0.5">{subtitle}</span>}
        </span>
        <ChevronDown className={`w-5 h-5 text-gold transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-white/10 px-5 py-4 text-sm">{children}</div>}
    </div>
  );
}

const TH = "text-left py-2 px-2 text-[11px] uppercase tracking-widest text-muted-foreground font-normal";
const TD = "py-2 px-2 align-top";

export function WesternDeepPanels({
  chart, latitude, longitude,
}: { chart: WesternChart; latitude: number; longitude: number }) {
  const rows = useMemo(() => planetRows(chart), [chart]);
  const cusps = useMemo(() => cuspRows(chart), [chart]);
  const insights = useMemo(() => natalInsights(rows), [rows]);
  const asc = useMemo(() => ascendantReport(chart), [chart]);

  return (
    <div className="mt-6 space-y-3">
      <Section title="Planetary positions" subtitle="Sign, longitude in degrees minutes seconds, full degree, house, speed, retrograde status, element and modality">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[720px]">
            <thead><tr>
              <th className={TH}>Body</th><th className={TH}>Sign</th><th className={TH}>Sign no</th>
              <th className={TH}>Longitude</th><th className={TH}>Full degree</th><th className={TH}>House</th>
              <th className={TH}>Speed per day</th><th className={TH}>Motion</th>
              <th className={TH}>Element</th><th className={TH}>Modality</th>
              <th className={TH}>Declination</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-t border-white/5">
                  <td className={TD}>
                    {r.glyphKey && <span className="gold-text mr-1">{PLANET_GLYPHS[r.glyphKey]}</span>}{r.name}
                  </td>
                  <td className={TD}>{r.signGlyph} {r.sign}</td>
                  <td className={TD}>{r.signNo}</td>
                  <td className={`${TD} font-mono`}>{r.longitudeDms}</td>
                  <td className={`${TD} font-mono`}>{r.fullDegree.toFixed(4)}</td>
                  <td className={TD}>{r.house}</td>
                  <td className={`${TD} font-mono`}>{r.speed.toFixed(4)}</td>
                  <td className={TD}>
                    {r.stationary ? <span className="text-amber-300">Stationary</span>
                      : r.retrograde ? <span className="text-cyan-300">Retrograde</span>
                      : <span className="text-emerald-300">Direct</span>}
                  </td>
                  <td className={TD}>{r.element}</td>
                  <td className={TD}>{r.modality}</td>
                  <td className={`${TD} font-mono`}>{r.declination.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="House cusps" subtitle="House number, sign, sign number, longitude in degrees minutes seconds and full degree">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[520px]">
            <thead><tr>
              <th className={TH}>House</th><th className={TH}>Sign</th><th className={TH}>Sign no</th>
              <th className={TH}>Cusp longitude</th><th className={TH}>Full degree</th><th className={TH}>Span</th>
            </tr></thead>
            <tbody>
              {cusps.map((c) => (
                <tr key={c.house} className="border-t border-white/5">
                  <td className={TD}>{c.house}</td>
                  <td className={TD}>{c.signGlyph} {c.sign}</td>
                  <td className={TD}>{c.signNo}</td>
                  <td className={`${TD} font-mono`}>{c.longitudeDms}</td>
                  <td className={`${TD} font-mono`}>{c.fullDegree.toFixed(4)}</td>
                  <td className={`${TD} font-mono`}>{c.size.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          House system in use: {chart.houseSystem === "placidus" ? "Porphyry quadrant division" : chart.houseSystem === "equal" ? "Equal house from the Ascendant" : "Whole sign"}.
          The Ascendant and Midheaven are computed with true obliquity and apparent sidereal time.
        </p>
      </Section>

      <Section title="Ascendant report" subtitle="Personality, career, health, finance and relationships for the rising sign">
        <div className="space-y-3">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-xs text-muted-foreground">Rising sign</div>
            <div className="font-display text-xl gold-text">{asc.sign} {asc.degree}</div>
            <div className="text-xs text-muted-foreground mt-1">Chart ruler: {asc.ruler}</div>
          </div>
          {([["Personality", asc.personality], ["Career", asc.career], ["Health", asc.health], ["Finance", asc.finance], ["Relationships", asc.relationships]] as const).map(([k, v]) => (
            <div key={k}>
              <div className="text-[11px] uppercase tracking-widest text-gold">{k}</div>
              <p className="text-pearl/90 leading-relaxed">{v}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Natal insights" subtitle="Elements and modes, chart balance, polarity and hemispheric focus">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Elements</div>
            {insights.elements.map((e) => (
              <div key={e.name} className="mb-1.5">
                <div className="flex justify-between text-xs"><span>{e.name}</span><span className="gold-text">{e.count} · {e.pct}%</span></div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-gradient-to-r from-gold to-gold-soft" style={{ width: `${e.pct}%` }} /></div>
              </div>
            ))}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Modes</div>
            {insights.modes.map((m) => (
              <div key={m.name} className="mb-1.5">
                <div className="flex justify-between text-xs"><span>{m.name}</span><span className="gold-text">{m.count} · {m.pct}%</span></div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-gradient-to-r from-gold to-gold-soft" style={{ width: `${m.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-pearl/90">{insights.balance}</p>
        <p className="mt-2 text-pearl/90">{insights.hemispheres.note}</p>
        <div className="mt-2 text-xs text-muted-foreground">
          Above horizon {insights.hemispheres.north} · below horizon {insights.hemispheres.south} ·
          eastern {insights.hemispheres.east} · western {insights.hemispheres.west} ·
          positive signs {insights.polarity.positive} · receptive signs {insights.polarity.negative}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {insights.quadrants.map((q) => (
            <div key={q.name} className="rounded-xl bg-white/5 p-3 text-xs">
              <div className="gold-text">{q.name} — {q.count} bodies</div>
              <div className="text-muted-foreground mt-0.5">{q.theme}</div>
            </div>
          ))}
        </div>
        {insights.lacking.length > 0 && (
          <p className="mt-3 text-xs text-amber-300">
            Missing emphasis: {insights.lacking.join(", ")}. These qualities are learned by deliberate practice rather than instinct.
          </p>
        )}
      </Section>

      <Section title="Planet in sign analysis" subtitle="How each body expresses through its sign">
        <div className="space-y-3">
          {planetInSignReport(rows).map((r) => (
            <div key={r.planet}>
              <div className="text-[11px] uppercase tracking-widest text-gold">{r.planet} in {r.sign}</div>
              <p className="text-pearl/90 leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Planet in house analysis" subtitle="Where each body concentrates its results">
        <div className="space-y-3">
          {planetInHouseReport(rows).map((r) => (
            <div key={r.planet}>
              <div className="text-[11px] uppercase tracking-widest text-gold">{r.planet} in house {r.house}</div>
              <p className="text-pearl/90 leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Minor bodies and calculated points" subtitle="Nineteen additional bodies and points with sign, degree and house">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[560px]">
            <thead><tr><th className={TH}>Point</th><th className={TH}>Sign</th><th className={TH}>Longitude</th><th className={TH}>House</th><th className={TH}>Meaning</th></tr></thead>
            <tbody>
              {minorPoints(chart, latitude, longitude).map((p) => {
                const s = Math.floor(p.longitude / 30);
                return (
                  <tr key={p.name} className="border-t border-white/5">
                    <td className={TD}>{p.name}</td>
                    <td className={TD}>{SIGN_GLYPHS[s]} {SIGN_NAMES[s]}</td>
                    <td className={`${TD} font-mono`}>{dms(p.longitude - s * 30).text}</td>
                    <td className={TD}>{p.house}</td>
                    <td className={`${TD} text-muted-foreground`}>{p.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Declinations, parallels and contra-parallels" subtitle="Out of zodiac contacts by declination">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[420px]">
            <thead><tr><th className={TH}>Bodies</th><th className={TH}>Contact</th><th className={TH}>Orb</th></tr></thead>
            <tbody>
              {parallels(rows).map((p, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className={TD}>{p.a} and {p.b}</td>
                  <td className={TD}>{p.kind === "parallel" ? "Parallel" : "Contra-parallel"}</td>
                  <td className={`${TD} font-mono`}>{p.orb.toFixed(2)}</td>
                </tr>
              ))}
              {parallels(rows).length === 0 && (
                <tr><td className={`${TD} text-muted-foreground`} colSpan={3}>No declination contacts within one degree.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          A parallel behaves like a conjunction and a contra-parallel like an opposition, measured north and south of the celestial equator rather than along the zodiac.
        </p>
      </Section>

      <Section title="Planetary midpoints" subtitle="Every planet pair midpoint, plus the midpoints activated in this chart">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-y-auto max-h-80">
            <table className="w-full text-xs">
              <thead><tr><th className={TH}>Pair</th><th className={TH}>Midpoint</th></tr></thead>
              <tbody>
                {midpointTable(rows).map((m, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className={TD}>{m.a} / {m.b}</td>
                    <td className={`${TD} font-mono`}>{m.dmsText} {m.sign}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Activated midpoints</div>
            <ActivatedMidpoints chart={chart} />
          </div>
        </div>
      </Section>

      <Section title="Planetary returns" subtitle="Next return dates and the full chart cast for the exact return moment">
        <ReturnsPanel chart={chart} latitude={latitude} longitude={longitude} />
      </Section>

      <Section title="Secondary progressions" subtitle="Progressed planets, progressed angles and progressed to natal aspects">
        <ProgressionsPanel chart={chart} latitude={latitude} longitude={longitude} />
      </Section>

      <Section title="Progressed lunar events" subtitle="Progressed Moon sign changes and the thirty year progressed lunation cycle">
        <LunarEventsPanel chart={chart} />
      </Section>

      <Section title="Planetary arc directions" subtitle="Solar arc positions for planets, houses and the aspects they trigger">
        <ArcPanel chart={chart} />
      </Section>

      <Section title="Prenatal chart" subtitle="Prenatal syzygy, prenatal eclipse and the prenatal epoch">
        <PrenatalPanel chart={chart} latitude={latitude} longitude={longitude} />
      </Section>

      <Section title="Moon phase calendar" subtitle="Daily phase, illumination, Moon age and exact phase change times">
        <MoonCalendarPanel />
      </Section>

      <Section title="Eclipses" subtitle="Upcoming solar and lunar eclipses with the natal house they fall in">
        <EclipsePanel chart={chart} />
      </Section>

      <Section title="Synastry and composite" subtitle="Partner positions, cusps, aspect grid and the midpoint composite chart">
        <SynastryPanel chart={chart} />
      </Section>
    </div>
  );
}

function ActivatedMidpoints({ chart }: { chart: WesternChart }) {
  const flat = useMemo(() => {
    const tree = midpointTree(chart);
    return Object.entries(tree)
      .flatMap(([planet, items]) => items.map((it) => ({ planet, ...it })))
      .sort((a, b) => a.orb - b.orb)
      .slice(0, 30);
  }, [chart]);
  if (flat.length === 0) return <div className="text-muted-foreground text-xs">No midpoint contacts within orb.</div>;
  return (
    <div className="space-y-1.5 text-xs">
      {flat.map((t, i) => (
        <div key={i} className="rounded-lg bg-white/5 px-3 py-2">
          {t.pair} contacted by {t.planet} at {t.type} degrees on the dial
          <span className="text-muted-foreground"> orb {t.orb.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

function ReturnsPanel({ chart, latitude, longitude }: { chart: WesternChart; latitude: number; longitude: number }) {
  const returns = useMemo(() => upcomingReturns(chart), [chart]);
  const [sel, setSel] = useState<string | null>(null);
  const rc = useMemo(() => {
    const r = returns.find((x) => x.planet === sel);
    return r ? returnChart(r.date, latitude, longitude) : null;
  }, [sel, returns, latitude, longitude]);
  return (
    <div className="space-y-3">
      <table className="w-full text-xs">
        <thead><tr><th className={TH}>Body</th><th className={TH}>Next return</th><th className={TH}>Cycle</th><th className={TH} /></tr></thead>
        <tbody>
          {returns.map((r) => (
            <tr key={r.planet} className="border-t border-white/5">
              <td className={TD}>{r.planet}</td>
              <td className={TD}>{fmtDateTime(r.date)}</td>
              <td className={`${TD} text-muted-foreground`}>{r.period}</td>
              <td className={TD}>
                <button onClick={() => setSel(r.planet === sel ? null : r.planet)} className="rounded-full border border-gold/40 px-3 py-1 text-gold">
                  {sel === r.planet ? "Hide chart" : "Return chart"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rc && (
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-xs text-muted-foreground mb-2">{sel} return chart — Ascendant {SIGN_NAMES[Math.floor(rc.tropicalAscendant / 30)]} {dms(rc.tropicalAscendant % 30).text}</div>
          <table className="w-full text-xs">
            <thead><tr><th className={TH}>Body</th><th className={TH}>Position</th><th className={TH}>House</th></tr></thead>
            <tbody>
              {planetRows(rc, false).map((p) => (
                <tr key={p.name} className="border-t border-white/5">
                  <td className={TD}>{p.name}</td>
                  <td className={`${TD} font-mono`}>{p.longitudeDms} {p.sign}</td>
                  <td className={TD}>{p.house}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-xs text-muted-foreground">
            Aspects at the return moment: {computeAspects(rc).slice(0, 8).map((a) => `${a.a} ${a.type} ${a.b}`).join("; ") || "none within orb"}.
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressionsPanel({ chart, latitude, longitude }: { chart: WesternChart; latitude: number; longitude: number }) {
  const [when, setWhen] = useState(fmtDate(new Date()));
  const prog = useMemo(() => {
    const [y, m, d] = when.split("-").map(Number);
    if (!y || !m || !d) return null;
    return secondaryProgressions(chart, latitude, longitude, new Date(y, m - 1, d, 12));
  }, [chart, latitude, longitude, when]);
  if (!prog) return <div className="text-muted-foreground">Enter a valid date.</div>;
  return (
    <div className="space-y-3">
      <label className="block max-w-xs">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Progress to date (YYYY-MM-DD)</span>
        <input value={when} onChange={(e) => setWhen(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50" />
      </label>
      <div className="text-xs text-muted-foreground">
        Age {prog.age} · progressed Ascendant {SIGN_NAMES[Math.floor(prog.ascendant / 30)]} {dms(prog.ascendant % 30).text} ·
        progressed Midheaven {SIGN_NAMES[Math.floor(prog.midheaven / 30)]} {dms(prog.midheaven % 30).text}
      </div>
      <table className="w-full text-xs">
        <thead><tr><th className={TH}>Progressed body</th><th className={TH}>Position</th><th className={TH}>House</th></tr></thead>
        <tbody>
          {prog.planets.map((p) => (
            <tr key={p.name} className="border-t border-white/5">
              <td className={TD}>{p.name}</td>
              <td className={`${TD} font-mono`}>{p.dmsText} {p.sign}</td>
              <td className={TD}>{p.house}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Progressed to natal aspects</div>
        {prog.aspects.length === 0 ? <div className="text-muted-foreground text-xs">Nothing within one degree at this date.</div> : (
          <div className="space-y-1 text-xs">
            {prog.aspects.slice(0, 20).map((a, i) => (
              <div key={i} className="rounded-lg bg-white/5 px-3 py-1.5">{a.a} {a.type} {a.b} <span className="text-muted-foreground">orb {a.orb.toFixed(2)}</span></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LunarEventsPanel({ chart }: { chart: WesternChart }) {
  const events = useMemo(() => progressedLunarEvents(chart, 0, 90), [chart]);
  return (
    <div className="space-y-1.5 max-h-96 overflow-y-auto text-xs">
      {events.map((e, i) => (
        <div key={i} className="rounded-lg bg-white/5 px-3 py-2">
          <span className="gold-text">{fmtDate(e.date)}</span> — {e.label}
          <div className="text-muted-foreground mt-0.5">{e.detail}</div>
        </div>
      ))}
    </div>
  );
}

function ArcPanel({ chart }: { chart: WesternChart }) {
  const birthMs = new Date(chart.epochUtc).getTime();
  const arc = useMemo(() => solarArcDirections(chart, birthMs), [chart, birthMs]);
  const hits = useMemo(() => solarArcHits(chart, arc), [chart, arc]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Directed positions</div>
        <table className="w-full text-xs">
          <thead><tr><th className={TH}>Point</th><th className={TH}>Directed to</th></tr></thead>
          <tbody>
            {arc.directed.map((p) => {
              const s = Math.floor(p.directed / 30);
              return (
                <tr key={p.name} className="border-t border-white/5">
                  <td className={TD}>{p.name}</td>
                  <td className={`${TD} font-mono`}>{dms(p.directed - s * 30).text} {SIGN_NAMES[s]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-2 text-xs text-muted-foreground">Arc applied: {arc.arc.toFixed(2)} degrees.</div>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Arc contacts to the natal chart</div>
        {hits.length === 0 ? <div className="text-xs text-muted-foreground">No contacts within one degree.</div> : (
          <div className="space-y-1 text-xs">
            {hits.map((h, i) => (
              <div key={i} className="rounded-lg bg-white/5 px-3 py-1.5">
                directed {h.a} {h.type} natal {h.b} <span className="text-muted-foreground">orb {h.orb.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PrenatalPanel({ chart, latitude, longitude }: { chart: WesternChart; latitude: number; longitude: number }) {
  const birth = new Date(chart.epochUtc);
  const syz = useMemo(() => prenatalSyzygy(birth), [birth]);
  const ecl = useMemo(() => prenatalEclipse(birth), [birth]);
  const epoch = useMemo(() => prenatalEpoch(chart, latitude, longitude), [chart, latitude, longitude]);
  const sSign = Math.floor(syz.longitude / 30);
  return (
    <div className="grid gap-3 sm:grid-cols-3 text-xs">
      <div className="rounded-xl bg-white/5 p-3">
        <div className="text-[11px] uppercase tracking-widest text-gold">Prenatal syzygy</div>
        <div className="text-pearl mt-1">{syz.kind} on {fmtDateTime(syz.date)}</div>
        <div className="font-mono">{dms(syz.longitude - sSign * 30).text} {SIGN_NAMES[sSign]}</div>
        <div className="text-muted-foreground mt-1">The lunation the chart is built on; often the most sensitive degree in the chart.</div>
      </div>
      <div className="rounded-xl bg-white/5 p-3">
        <div className="text-[11px] uppercase tracking-widest text-gold">Prenatal eclipse</div>
        {ecl ? (
          <>
            <div className="text-pearl mt-1">{ecl.kind} {ecl.variety} on {fmtDateTime(ecl.date)}</div>
            <div className="font-mono">{dms(ecl.longitude % 30).text} {ecl.sign}</div>
          </>
        ) : <div className="text-muted-foreground mt-1">Outside the searchable range.</div>}
        <div className="text-muted-foreground mt-1">Classical marker of the themes carried into the life from before birth.</div>
      </div>
      <div className="rounded-xl bg-white/5 p-3">
        <div className="text-[11px] uppercase tracking-widest text-gold">Prenatal epoch</div>
        <div className="text-pearl mt-1">{fmtDateTime(epoch.date)}</div>
        <div className="font-mono">Ascendant {dms(epoch.ascendant % 30).text} {SIGN_NAMES[Math.floor(epoch.ascendant / 30)]}</div>
        <div className="text-muted-foreground mt-1">{epoch.note}</div>
      </div>
    </div>
  );
}

function MoonCalendarPanel() {
  const [start] = useState(() => new Date());
  const cal = useMemo(() => moonPhaseCalendar(start, 30), [start]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="overflow-y-auto max-h-80">
        <table className="w-full text-xs">
          <thead><tr><th className={TH}>Date</th><th className={TH}>Phase</th><th className={TH}>Illumination</th><th className={TH}>Moon age</th></tr></thead>
          <tbody>
            {cal.days.map((d, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className={TD}>{fmtDate(d.date)}</td>
                <td className={TD}>{d.phaseName}</td>
                <td className={`${TD} font-mono`}>{Math.round(d.illumination * 100)}%</td>
                <td className={`${TD} font-mono`}>{d.age.toFixed(1)} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Exact phase changes</div>
        <div className="space-y-1 text-xs">
          {cal.changes.map((c, i) => (
            <div key={i} className="rounded-lg bg-white/5 px-3 py-1.5"><span className="gold-text">{c.name}</span> — {fmtDateTime(c.date)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EclipsePanel({ chart }: { chart: WesternChart }) {
  const rows = useMemo(() => eclipseTable(new Date(), 6, chart), [chart]);
  return (
    <table className="w-full text-xs">
      <thead><tr><th className={TH}>Date</th><th className={TH}>Kind</th><th className={TH}>Type</th><th className={TH}>Degree</th><th className={TH}>Natal house</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-white/5">
            <td className={TD}>{fmtDateTime(r.date)}</td>
            <td className={TD}>{r.kind}</td>
            <td className={TD}>{r.variety}</td>
            <td className={`${TD} font-mono`}>{dms(r.longitude % 30).text} {r.sign}</td>
            <td className={TD}>{r.house ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const PARTNER_DEFAULT = {
  name: "", date: "1993-03-21", time: "10:15",
  tz: "5.5", lat: "19.0760", lon: "72.8777", place: "Mumbai, Maharashtra, India",
};

function SynastryPanel({ chart }: { chart: WesternChart }) {
  const [form, setForm] = useState(PARTNER_DEFAULT);
  const [partner, setPartner] = useState<WesternChart | null>(null);
  const build = () => {
    const [y, m, d] = form.date.split("-").map(Number);
    const [hh, mm] = form.time.split(":").map(Number);
    setPartner(computeWesternChart({
      year: y, month: m, day: d, hour: hh, minute: mm,
      tzOffsetHours: Number(form.tz), latitude: Number(form.lat), longitude: Number(form.lon),
    }, chart.houseSystem));
  };
  const composite = useMemo(() => (partner ? compositeChart(chart, partner) : null), [chart, partner]);
  const cross = useMemo(() => {
    if (!partner) return [];
    const out: { a: string; b: string; type: string; orb: number }[] = [];
    const defs: [string, number, number][] = [["conjunction",0,8],["sextile",60,4],["square",90,6],["trine",120,6],["opposition",180,8]];
    for (const p of chart.tropicalPlanets) {
      for (const q of partner.tropicalPlanets) {
        let sep = Math.abs(p.tropicalLongitude - q.tropicalLongitude) % 360;
        if (sep > 180) sep = 360 - sep;
        for (const [type, angle, orb] of defs) {
          if (Math.abs(sep - angle) <= orb) out.push({ a: p.name, b: q.name, type, orb: Math.abs(sep - angle) });
        }
      }
    }
    return out.sort((x, y) => x.orb - y.orb);
  }, [chart, partner]);

  return (
    <div className="space-y-4">
      <BirthVoiceBox value={form} onChange={(p) => setForm((prev) => ({ ...prev, ...p }))} />
      <button onClick={build} className="rounded-full bg-gradient-to-r from-gold to-gold-soft px-6 py-2.5 text-sm font-medium text-primary-foreground">
        Compare charts
      </button>
      {partner && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Partner positions and houses</div>
            <table className="w-full text-xs">
              <thead><tr><th className={TH}>Body</th><th className={TH}>Position</th><th className={TH}>House</th></tr></thead>
              <tbody>
                {planetRows(partner, false).map((p) => (
                  <tr key={p.name} className="border-t border-white/5">
                    <td className={TD}>{p.name}</td>
                    <td className={`${TD} font-mono`}>{p.longitudeDms} {p.sign}</td>
                    <td className={TD}>{p.house}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-muted-foreground">
              Partner Ascendant {SIGN_NAMES[Math.floor(partner.tropicalAscendant / 30)]} · Midheaven {SIGN_NAMES[Math.floor(partner.midheaven / 30)]}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Cross aspects</div>
            <div className="space-y-1 text-xs max-h-64 overflow-y-auto">
              {cross.map((c, i) => (
                <div key={i} className="rounded-lg bg-white/5 px-3 py-1.5">
                  your {c.a} {c.type} their {c.b} <span className="text-muted-foreground">orb {c.orb.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          {composite && (
            <div className="lg:col-span-2">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Composite chart (midpoint method)</div>
              <div className="text-xs text-muted-foreground mb-2">
                Composite Ascendant {SIGN_NAMES[Math.floor(composite.ascendant / 30)]} {dms(composite.ascendant % 30).text} ·
                Composite Midheaven {SIGN_NAMES[Math.floor(composite.midheaven / 30)]} {dms(composite.midheaven % 30).text}
              </div>
              <table className="w-full text-xs">
                <thead><tr><th className={TH}>Body</th><th className={TH}>Position</th><th className={TH}>House</th></tr></thead>
                <tbody>
                  {composite.planets.map((p) => (
                    <tr key={p.name} className="border-t border-white/5">
                      <td className={TD}>{p.name}</td>
                      <td className={`${TD} font-mono`}>{p.dmsText} {p.sign}</td>
                      <td className={TD}>{p.house}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 text-xs text-muted-foreground">
                Composite aspects: {composite.aspects.slice(0, 10).map((a) => `${a.a} ${a.type} ${a.b}`).join("; ") || "none within orb"}.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function WesternDeepCard(props: { chart: WesternChart; latitude: number; longitude: number }) {
  return (
    <GlassCard title="Professional chart tables and predictive work">
      <WesternDeepPanels {...props} />
    </GlassCard>
  );
}
