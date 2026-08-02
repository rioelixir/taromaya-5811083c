import { useMemo } from "react";
import { GlassCard } from "@/components/page-shell";
import { DataTable, type Column } from "@/components/data-table";
import { fmtTime, fmtRange, type Panchang } from "@/lib/panchang";
import {
  chandramasa, samvatAndEpochs, rituAndAyana, dayMeasures, varjyamAndAmrit,
  raviYoga, extraMuhurtas, baanaInfo, vasaAndShool, gowriPanchangam,
  ghattaChakra, nextSunriseAfter, taraBalam, chandraBalam,
} from "@/lib/panchang-calendars";
import { RASHIS } from "@/lib/vedic";

const KEY = "text-[11px] uppercase tracking-widest text-muted-foreground";
const VAL = "text-sm text-pearl";

type FieldValue = { field: string; value: string };

const FV_COLUMNS: Column<FieldValue>[] = [
  { header: "Field", cell: (r: FieldValue) => r.field, className: "text-muted-foreground" },
  { header: "Value", cell: (r: FieldValue) => r.value, className: "text-pearl" },
];

function FieldValueTable({ rows }: { rows: FieldValue[] }) {
  return <DataTable columns={FV_COLUMNS} rows={rows} rowKey={(r) => r.field} />;
}

type MuhurtaRow = ReturnType<typeof extraMuhurtas>[number];

type GowriRow = { name: string; from: Date; to: Date; good: boolean };

/**
 * The classical almanac layers that sit on top of the five limbs: era counts,
 * lunar month, season, day measures, the extra muhurta windows, the Vasa and
 * Shool set, Gowri Panchangam and the Ghatta Chakra.
 */
export function PanchangClassicalPanels({
  panchang, latitude, longitude, birthNakshatra, birthMoonSign,
}: {
  panchang: Panchang;
  latitude: number;
  longitude: number;
  /** Optional birth star index (0 to 26) to add Tarabalam and Chandrabalam. */
  birthNakshatra?: number;
  birthMoonSign?: number;
}) {
  const data = useMemo(() => {
    const nextRise = nextSunriseAfter(panchang, latitude, longitude);
    const masa = chandramasa(panchang.refMoment, panchang.tithi.paksha);
    const samvat = samvatAndEpochs(panchang.refMoment, masa.amanta);
    const seasons = rituAndAyana(panchang.refMoment, masa.amanta);
    const measures = dayMeasures(panchang, nextRise);
    const vj = varjyamAndAmrit(panchang.refMoment);
    const ravi = raviYoga(panchang.refMoment);
    const muhurtas = extraMuhurtas(panchang, nextRise);
    const baana = baanaInfo(panchang);
    const vasa = vasaAndShool(panchang);
    const gowri = gowriPanchangam(panchang, nextRise);
    const moonSign = Math.floor(((panchang.nakshatra.index * (360 / 27)) % 360) / 30);
    const ghatta = ghattaChakra(moonSign);
    return { masa, samvat, seasons, measures, vj, ravi, muhurtas, baana, vasa, gowri, ghatta, moonSign };
  }, [panchang, latitude, longitude]);

  const tara = birthNakshatra !== undefined ? taraBalam(birthNakshatra, panchang.nakshatra.index) : null;
  const chandra = birthMoonSign !== undefined ? chandraBalam(birthMoonSign, data.moonSign) : null;

  const monthEraRows: FieldValue[] = [
    { field: "Chandramasa (Amanta)", value: data.masa.amanta },
    { field: "Chandramasa (Purnimanta)", value: data.masa.purnimanta },
    { field: "Shaka Samvat", value: String(data.samvat.shaka) },
    { field: "Vikram Samvat", value: String(data.samvat.vikram) },
    { field: "Gujarati Samvat", value: String(data.samvat.gujarati) },
    { field: "Kali Yuga year", value: String(data.samvat.kaliyuga) },
    { field: "National Civil date", value: data.samvat.nationalCivil },
    { field: "National Nirayana date", value: data.samvat.nationalNirayana },
  ];

  const seasonRows: FieldValue[] = [
    { field: "Drik Ritu", value: data.seasons.drikRitu },
    { field: "Vedic Ritu", value: data.seasons.vedicRitu },
    { field: "Drik Ayana", value: data.seasons.drikAyana },
    { field: "Vedic Ayana", value: data.seasons.vedicAyana },
    { field: "Dinamana (day length)", value: data.measures.dinamana?.text ?? "Unavailable" },
    { field: "Ratrimana (night length)", value: data.measures.ratrimana?.text ?? "Unavailable" },
    { field: "Madhyahna (true noon)", value: fmtTime(data.measures.madhyahna) },
    { field: "Surya Nakshatra", value: data.ravi.suryaNakshatra },
    { field: "Surya Pada", value: String(data.ravi.suryaPada) },
    { field: "Moon sign", value: RASHIS[data.moonSign] },
    { field: "Nakshatra Pada", value: String(panchang.nakshatra.pada) },
    { field: "Ayanamsa", value: `${data.samvat.ayanamsaDegrees.toFixed(4)} degrees` },
  ];

  const vasaRows: FieldValue[] = [
    { field: "Agnivasa", value: data.vasa.agnivasa },
    { field: "Homahuti", value: data.vasa.homahuti },
    { field: "Shivavasa", value: data.vasa.shivaVasa },
    { field: "Chandra Vasa", value: data.vasa.chandraVasa },
    { field: "Rahu Vasa", value: data.vasa.rahuVasa },
    { field: "Bhadravasa", value: data.vasa.bhadraVasa },
    { field: "Disha Shool", value: data.vasa.dishaShool },
    { field: "Kumbha Chakra", value: data.vasa.kumbhaChakra },
  ];

  const ghattaRows: FieldValue[] = [
    { field: "Moon sign", value: data.ghatta.moonSign },
    { field: "Month", value: data.ghatta.month },
    { field: "Tithi", value: data.ghatta.tithi },
    { field: "Vaar", value: data.ghatta.vaar },
    { field: "Nakshatra", value: data.ghatta.nakshatra },
    { field: "Yoga", value: data.ghatta.yoga },
    { field: "Karana", value: data.ghatta.karana },
  ];

  const epochRows: FieldValue[] = [
    { field: "Julian Day", value: data.samvat.julianDay.toFixed(5) },
    { field: "Modified Julian Day", value: data.samvat.modifiedJulianDay.toFixed(5) },
    { field: "Rata Die", value: String(data.samvat.rataDie) },
    { field: "Kali Ahargana", value: String(data.samvat.kaliAhargana) },
  ];

  const muhurtaColumns: Column<MuhurtaRow>[] = [
    { header: "Muhurta", cell: (m: MuhurtaRow) => m.name },
    { header: "Window", cell: (m: MuhurtaRow) => fmtRange(m.range), align: "right", className: "font-mono text-xs" },
    { header: "Note", cell: (m: MuhurtaRow) => m.note, className: "text-muted-foreground" },
  ];

  const gowriColumns: Column<GowriRow>[] = [
    { header: "Segment", cell: (r: GowriRow) => r.name },
    { header: "From", cell: (r: GowriRow) => fmtTime(r.from), align: "right", className: "font-mono text-xs" },
    { header: "To", cell: (r: GowriRow) => fmtTime(r.to), align: "right", className: "font-mono text-xs" },
  ];

  const nallaNeramRows: GowriRow[] = data.gowri.nallaNeram.map((s) => ({ name: s.name, from: s.from, to: s.to, good: true }));

  return (
    <div className="mt-6 space-y-6">
      <GlassCard title="Lunar month and era counts" desc="The traditional calendar frame for this date.">
        <FieldValueTable rows={monthEraRows} />
        {data.masa.adhika && (
          <p className="mt-3 text-sm text-pearl/90">
            This lunation contains no solar ingress, so it counts as an Adhika Masa, the intercalary month inserted to keep the lunar and solar years aligned.
          </p>
        )}
      </GlassCard>

      <GlassCard title="Season, half-year and day measures" desc="Ritu and Ayana in both the observed and the traditional reckoning, with the length of day and night.">
        <FieldValueTable rows={seasonRows} />
      </GlassCard>

      <GlassCard title="Varjyam, Amrit Kalam and Ravi Yoga" desc="Windows read from the exact start and end of the current star.">
        {data.vj ? (
          <div className="space-y-2">
            <div className="rounded-xl bg-white/5 px-3 py-2">
              <div className={KEY}>Current star runs</div>
              <div className={VAL}>{`${fmtTime(data.vj.nakshatraStart)} to ${fmtTime(data.vj.nakshatraEnd)}`}</div>
            </div>
            <div className="rounded-xl border border-red-400/20 bg-red-500/5 px-3 py-2">
              <div className={KEY}>Varjyam (avoid)</div>
              <div className={VAL}>{fmtRange(data.vj.varjyam)}</div>
              <p className="mt-1 text-xs text-muted-foreground">The discarded portion of the star. Do not begin journeys, signings or ceremonies inside it.</p>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-3 py-2">
              <div className={KEY}>Amrit Kalam (favourable)</div>
              <div className={VAL}>{fmtRange(data.vj.amritKalam)}</div>
              <p className="mt-1 text-xs text-muted-foreground">The nectar portion, counted twenty ghatis after Varjyam opens. It is the strongest short window of the day.</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">The star boundaries could not be resolved for this date and place.</p>
        )}
        <div className="mt-3 rounded-xl bg-white/5 px-3 py-2">
          <div className={KEY}>Ravi Yoga</div>
          <div className={VAL}>{data.ravi.active ? "Present" : "Not present"}</div>
          <p className="mt-1 text-sm text-pearl/90">{data.ravi.note}</p>
        </div>
      </GlassCard>

      <GlassCard title="Additional muhurta windows" desc="The junction hours, the eleventh muhurta and the weak muhurtas of this weekday.">
        <DataTable
          columns={muhurtaColumns}
          rows={data.muhurtas}
          rowKey={(m: MuhurtaRow) => m.name}
          rowClassName={(m: MuhurtaRow) => (m.nature === "good" ? "bg-emerald-500/5" : "bg-red-500/5")}
        />
        <div className="mt-3 rounded-xl bg-white/5 px-3 py-2">
          <div className={KEY}>Baana</div>
          <div className={VAL}>{data.baana.name}</div>
          <p className="mt-1 text-sm text-pearl/90">{data.baana.note}</p>
        </div>
      </GlassCard>

      <GlassCard title="Vasa and Shool" desc="Where fire, the Moon, Rahu and Shiva are said to reside today, and which direction is obstructed.">
        <FieldValueTable rows={vasaRows} />
        <ul className="mt-3 space-y-1 text-sm text-pearl/90">
          <li>{data.vasa.agniNote}</li>
          <li>{data.vasa.shivaNote}</li>
          <li>{data.vasa.kumbhaNote}</li>
        </ul>
      </GlassCard>

      <GlassCard title="Gowri Panchangam and Nalla Neram" desc="The eight-fold Tamil division of day and night, with the two clearly favourable stretches listed at the end.">
        <div className="grid gap-4 lg:grid-cols-2">
          {([["Day", data.gowri.day], ["Night", data.gowri.night]] as [string, typeof data.gowri.day][]).map(([label, list]) => (
            <div key={label}>
              <div className={`${KEY} mb-2`}>{label}</div>
              <DataTable
                columns={gowriColumns}
                rows={list}
                rowKey={(s: GowriRow, i: number) => `${label}-${i}`}
                rowClassName={(s: GowriRow) => (s.good ? "bg-emerald-500/5" : "")}
                empty="Unavailable for this place."
              />
            </div>
          ))}
        </div>
        {nallaNeramRows.length > 0 && (
          <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 px-3 py-2">
            <div className={`${KEY} mb-2`}>Nalla Neram</div>
            <DataTable columns={gowriColumns} rows={nallaNeramRows} rowKey={(s: GowriRow, i: number) => i} />
          </div>
        )}
      </GlassCard>

      {(tara || chandra) && (
        <GlassCard title="Tarabalam and Chandrabalam" desc="Today's star and Moon measured from your own birth star and birth Moon sign.">
          <div className="space-y-2">
            {tara && (
              <div className={`rounded-xl px-3 py-2 ${tara.good ? "bg-emerald-500/5" : "bg-red-500/5"}`}>
                <div className={KEY}>Tarabalam</div>
                <div className={VAL}>{tara.name} — star count {tara.count}</div>
                <p className="mt-1 text-sm text-pearl/90">{tara.note}</p>
              </div>
            )}
            {chandra && (
              <div className={`rounded-xl px-3 py-2 ${chandra.strong ? "bg-emerald-500/5" : "bg-white/5"}`}>
                <div className={KEY}>Chandrabalam</div>
                <div className={VAL}>House {chandra.house} from your birth Moon</div>
                <p className="mt-1 text-sm text-pearl/90">{chandra.note}</p>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      <GlassCard title="Ghatta Chakra" desc="The traditional avoidance set for the Moon sign of this date.">
        <FieldValueTable rows={ghattaRows} />
        <p className="mt-3 text-sm text-pearl/90">{data.ghatta.note}</p>
      </GlassCard>

      <GlassCard title="Epoch day counts" desc="The same instant expressed in the day-count systems used for cross checking any almanac.">
        <FieldValueTable rows={epochRows} />
      </GlassCard>
    </div>
  );
}
