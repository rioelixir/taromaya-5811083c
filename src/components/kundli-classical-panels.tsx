import { useMemo } from "react";
import { GlassCard } from "@/components/page-shell";
import { DataTable, type Column } from "@/components/data-table";
import { RASHIS, type KundliChart } from "@/lib/vedic";
import {
  praharOfBirth, compositeFriendship, ascendantReport, sudarshanaChakra,
  RASHI_AKSHARA, FRIENDSHIP_PLANETS,
} from "@/lib/kundli-classical";

const KEY = "text-[11px] uppercase tracking-widest text-muted-foreground";
const TH = "px-2 py-1.5 text-left text-[11px] uppercase tracking-widest text-muted-foreground";
const TD = "px-2 py-1.5 text-sm text-pearl border-t border-white/5";

type FieldValue = { field: string; value: string };

const FV_COLUMNS: Column<FieldValue>[] = [
  { header: "Field", cell: (r: FieldValue) => r.field, className: "text-muted-foreground" },
  { header: "Value", cell: (r: FieldValue) => r.value, className: "text-pearl" },
];

function FieldValueTable({ rows }: { rows: FieldValue[] }) {
  return <DataTable columns={FV_COLUMNS} rows={rows} rowKey={(r) => r.field} />;
}

type HouseRow = { house: number; sign: string; planets: string[] };

const HOUSE_COLUMNS: Column<HouseRow>[] = [
  { header: "House", cell: (h: HouseRow) => `${h.house}. ${h.sign}`, className: "text-muted-foreground" },
  { header: "Planets", cell: (h: HouseRow) => (h.planets.length ? h.planets.join(", ") : "—"), align: "right", className: "text-pearl" },
];

type AgreementRow = { house: number; verdict: string };

const AGREEMENT_COLUMNS: Column<AgreementRow>[] = [
  { header: "House", cell: (a: AgreementRow) => String(a.house), className: "text-muted-foreground" },
  { header: "Verdict", cell: (a: AgreementRow) => a.verdict, className: "text-pearl" },
];

type SignRow = { index: number; sign: string; letters: string };

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

  const ascRows: FieldValue[] = [
    { field: "Ascendant", value: `${asc.ascendant} at ${asc.degree.toFixed(2)} degrees` },
    { field: "Planetary lord", value: asc.planetaryLord },
    { field: "Symbol", value: asc.symbol },
    { field: "Element", value: asc.element },
    { field: "Lucky stone", value: asc.luckyStone },
    { field: "Alternate stone", value: asc.alternateStone },
    { field: "Day of fast", value: asc.fastDay },
    { field: "Presiding deity", value: asc.deity },
    { field: "Lucky numbers", value: asc.luckyNumbers },
    { field: "Lucky colours", value: asc.luckyColours },
    { field: "Rashi Aksha (name letters)", value: asc.akshara },
  ];
  if (asc.lordPlacement) {
    ascRows.push({
      field: "Lagna lord placement",
      value: `${asc.lordPlacement.sign}, house ${asc.lordPlacement.house}${asc.lordPlacement.retrograde ? ", retrograde" : ""}`,
    });
  }

  const praharRows: FieldValue[] = [
    { field: "Prahar", value: prahar.name },
    { field: "Watch number", value: String(prahar.index) },
    { field: "Part of day", value: prahar.partOfDay === "day" ? "Daytime birth" : "Night birth" },
  ];

  const signRows: SignRow[] = RASHIS.map((r, i) => ({ index: i, sign: r, letters: RASHI_AKSHARA[i] }));
  const signColumns: Column<SignRow>[] = [
    { header: "Sign", cell: (r: SignRow) => `${r.index + 1}. ${r.sign}` },
    { header: "Name letters", cell: (r: SignRow) => r.letters, align: "right", className: "text-pearl" },
  ];

  return (
    <div className="mt-6 space-y-6">
      <GlassCard title="Ascendant report" desc="The rising sign read as a standing brief: ruler, symbol, temperament and the classical remedial pointers.">
        <FieldValueTable rows={ascRows} />
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
        <FieldValueTable rows={praharRows} />
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
          {([["From the Lagna", sudarshana.lagna], ["From the Sun", sudarshana.surya], ["From the Moon", sudarshana.chandra]] as [string, typeof sudarshana.lagna][]).map(([label, wheel]) => (
            <div key={label}>
              <div className={`${KEY} mb-2`}>{label} ({wheel.base})</div>
              <DataTable columns={HOUSE_COLUMNS} rows={wheel.houses} rowKey={(h: HouseRow) => h.house} />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className={`${KEY} mb-2`}>Agreement across the three wheels</div>
          <DataTable
            columns={AGREEMENT_COLUMNS}
            rows={sudarshana.agreement.filter((a) => a.wheelsOccupied >= 2)}
            rowKey={(a: AgreementRow) => a.house}
          />
          <p className="mt-2 text-sm text-pearl/90">
            A theme carried by all three wheels is treated as settled in the chart. A theme present in two is probable
            and shows up under the matching Dasha. A theme in one wheel only tends to appear as an episode rather than a
            lasting condition.
          </p>
        </div>
      </GlassCard>

      <GlassCard title="Sign syllable reference" desc="The classical name letters for each sign, used when choosing or checking a given name.">
        <DataTable
          columns={signColumns}
          rows={signRows}
          rowKey={(r: SignRow) => r.index}
          rowClassName={(r: SignRow) => (r.index === chart.ascendant.rashi ? "bg-gold/5" : "")}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          {FRIENDSHIP_PLANETS.length} classical planets are used in the friendship judgement above. Rahu and Ketu are
          excluded there by convention, since they own no sign in the Parashari friendship scheme.
        </p>
      </GlassCard>
    </div>
  );
}
