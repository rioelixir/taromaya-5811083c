import { useMemo } from "react";
import { GlassCard } from "@/components/page-shell";
import { RASHIS, type KundliChart } from "@/lib/vedic";
import {
  praharOfBirth, compositeFriendship, ascendantReport, sudarshanaChakra,
  RASHI_AKSHARA, FRIENDSHIP_PLANETS,
} from "@/lib/kundli-classical";

const KEY = "text-[11px] uppercase tracking-widest text-muted-foreground";
const VAL = "text-sm text-pearl";
const TH = "px-2 py-1.5 text-left text-[11px] uppercase tracking-widest text-muted-foreground";
const TD = "px-2 py-1.5 text-sm text-pearl border-t border-white/5";

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2">
      <div className={KEY}>{k}</div>
      <div className={VAL}>{v}</div>
    </div>
  );
}

const TONE: Record<string, string> = {
  "Adhi Mitra": "text-emerald-300",
  Mitra: "text-emerald-200/80",
  Sama: "text-muted-foreground",
  Shatru: "text-amber-300/90",
  "Adhi Shatru": "text-red-300",
};

/**
 * Classical Kundali layers: Prahar and sign syllable, the Ascendant report,
 * the composite five-fold friendship table and the Sudarshana Chakra.
 */
export function KundliClassicalPanels({
  chart, birth, sunrise, sunset, nextSunrise,
}: {
  chart: KundliChart;
  birth: Date;
  sunrise: Date | null;
  sunset: Date | null;
  nextSunrise?: Date | null;
}) {
  const prahar = useMemo(() => praharOfBirth(birth, sunrise, sunset, nextSunrise ?? null), [birth, sunrise, sunset, nextSunrise]);
  const friendship = useMemo(() => compositeFriendship(chart), [chart]);
  const asc = useMemo(() => ascendantReport(chart), [chart]);
  const sudarshana = useMemo(() => sudarshanaChakra(chart), [chart]);

  return (
    <div className="mt-6 space-y-6">
      <GlassCard title="Ascendant report" desc="The rising sign read as a standing brief: ruler, symbol, temperament and the classical remedial pointers.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Pair k="Ascendant" v={`${asc.ascendant} at ${asc.degree.toFixed(2)} degrees`} />
          <Pair k="Planetary lord" v={asc.planetaryLord} />
          <Pair k="Symbol" v={asc.symbol} />
          <Pair k="Element" v={asc.element} />
          <Pair k="Lucky stone" v={asc.luckyStone} />
          <Pair k="Alternate stone" v={asc.alternateStone} />
          <Pair k="Day of fast" v={asc.fastDay} />
          <Pair k="Presiding deity" v={asc.deity} />
          <Pair k="Lucky numbers" v={asc.luckyNumbers} />
          <Pair k="Lucky colours" v={asc.luckyColours} />
          <Pair k="Rashi Aksha (name letters)" v={asc.akshara} />
          {asc.lordPlacement && (
            <Pair
              k="Lagna lord placement"
              v={`${asc.lordPlacement.sign}, house ${asc.lordPlacement.house}${asc.lordPlacement.retrograde ? ", retrograde" : ""}`}
            />
          )}
        </div>
        <p className="mt-3 text-sm text-pearl/90">{asc.characteristics}</p>
        {asc.lordPlacement && (
          <p className="mt-2 text-sm text-pearl/90">
            Because the chart ruler {asc.planetaryLord} sits in house {asc.lordPlacement.house}, the affairs of that house
            carry the weight of the whole chart. Progress in life tends to arrive through that department first, and
            setbacks there are felt everywhere else.
          </p>
        )}
      </GlassCard>

      <GlassCard title="Prahar of birth" desc="The watch of the day or night the birth falls in, counted from the local sunrise.">
        <div className="grid gap-2 sm:grid-cols-3">
          <Pair k="Prahar" v={prahar.name} />
          <Pair k="Watch number" v={String(prahar.index)} />
          <Pair k="Part of day" v={prahar.partOfDay === "day" ? "Daytime birth" : "Night birth"} />
        </div>
        <p className="mt-3 text-sm text-pearl/90">
          The Prahar is used alongside the Nakshatra when selecting name syllables and when judging which planet was
          governing the atmosphere at the moment of birth. A first-watch birth is read as a beginning-of-cycle
          temperament, while a fourth-watch birth carries completion and inheritance themes.
        </p>
      </GlassCard>

      <GlassCard title="Composite friendship table" desc="Natural friendship, the temporary friendship formed by this chart's placements, and the five-fold result they combine into.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className={TH}>Planet</th>
                {friendship.planets.map((p) => <th key={p} className={TH}>{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {friendship.planets.map((a) => (
                <tr key={a}>
                  <td className={`${TD} font-medium`}>{a}</td>
                  {friendship.planets.map((b) => {
                    const cell = a === b ? null : friendship.table[a]?.[b];
                    return (
                      <td key={b} className={TD}>
                        {cell ? (
                          <span>
                            <span className={TONE[cell.fiveFold]}>{cell.fiveFold}</span>
                            <span className="block text-[11px] text-muted-foreground">{cell.natural} · {cell.temporary} by transit position</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-pearl/90">
          Read the rows as the acting planet and the columns as the planet being acted upon. Natural friendship is fixed
          by the classical table. Temporary friendship comes from this chart alone: planets in the second, third, fourth,
          tenth, eleventh and twelfth signs from each other behave as friends. The five-fold column is what actually
          matters in judgement, because it decides whether a planet helps or resists when it aspects or joins another.
        </p>
      </GlassCard>

      <GlassCard title="Sudarshana Chakra" desc="The same planets read from three reference points: the rising sign, the Sun's sign and the Moon's sign.">
        <div className="grid gap-4 lg:grid-cols-3">
          {[["From the Lagna", sudarshana.lagna], ["From the Sun", sudarshana.surya], ["From the Moon", sudarshana.chandra]].map(([label, wheel]) => (
            <div key={label as string}>
              <div className={`${KEY} mb-2`}>{label as string} ({(wheel as typeof sudarshana.lagna).base})</div>
              <div className="space-y-1">
                {(wheel as typeof sudarshana.lagna).houses.map((h) => (
                  <div key={h.house} className="flex items-start justify-between gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs">
                    <span className="text-muted-foreground">{h.house}. {h.sign}</span>
                    <span className="text-right text-pearl">{h.planets.length ? h.planets.join(", ") : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1">
          <div className={KEY}>Agreement across the three wheels</div>
          {sudarshana.agreement.filter((a) => a.wheelsOccupied >= 2).map((a) => (
            <div key={a.house} className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-pearl">
              House {a.house}: {a.verdict}
            </div>
          ))}
          <p className="mt-2 text-sm text-pearl/90">
            A theme carried by all three wheels is treated as settled in the chart. A theme present in two is probable
            and shows up under the matching Dasha. A theme in one wheel only tends to appear as an episode rather than a
            lasting condition.
          </p>
        </div>
      </GlassCard>

      <GlassCard title="Sign syllable reference" desc="The classical name letters for each sign, used when choosing or checking a given name.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {RASHIS.map((r, i) => (
            <div key={r} className={`rounded-xl px-3 py-2 ${i === chart.ascendant.rashi ? "border border-gold/30 bg-gold/5" : "bg-white/5"}`}>
              <div className={KEY}>{i + 1}. {r}</div>
              <div className={VAL}>{RASHI_AKSHARA[i]}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {FRIENDSHIP_PLANETS.length} classical planets are used in the friendship judgement above. Rahu and Ketu are
          excluded there by convention, since they own no sign in the Parashari friendship scheme.
        </p>
      </GlassCard>
    </div>
  );
}
