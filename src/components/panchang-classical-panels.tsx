import { useMemo } from "react";
import { GlassCard } from "@/components/page-shell";
import { fmtTime, fmtRange, type Panchang } from "@/lib/panchang";
import {
  chandramasa, samvatAndEpochs, rituAndAyana, dayMeasures, varjyamAndAmrit,
  raviYoga, extraMuhurtas, baanaInfo, vasaAndShool, gowriPanchangam,
  ghattaChakra, nextSunriseAfter, taraBalam, chandraBalam,
} from "@/lib/panchang-calendars";
import { RASHIS } from "@/lib/vedic";

const CELL = "rounded-xl bg-white/5 px-3 py-2";
const KEY = "text-[11px] uppercase tracking-widest text-muted-foreground";
const VAL = "text-sm text-pearl";

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div className={CELL}>
      <div className={KEY}>{k}</div>
      <div className={VAL}>{v}</div>
    </div>
  );
}

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

  return (
    <div className="mt-6 space-y-6">
      <GlassCard title="Lunar month and era counts" desc="The traditional calendar frame for this date.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Pair k="Chandramasa (Amanta)" v={data.masa.amanta} />
          <Pair k="Chandramasa (Purnimanta)" v={data.masa.purnimanta} />
          <Pair k="Shaka Samvat" v={String(data.samvat.shaka)} />
          <Pair k="Vikram Samvat" v={String(data.samvat.vikram)} />
          <Pair k="Gujarati Samvat" v={String(data.samvat.gujarati)} />
          <Pair k="Kali Yuga year" v={String(data.samvat.kaliyuga)} />
          <Pair k="National Civil date" v={data.samvat.nationalCivil} />
          <Pair k="National Nirayana date" v={data.samvat.nationalNirayana} />
        </div>
        {data.masa.adhika && (
          <p className="mt-3 text-sm text-pearl/90">
            This lunation contains no solar ingress, so it counts as an Adhika Masa, the intercalary month inserted to keep the lunar and solar years aligned.
          </p>
        )}
      </GlassCard>

      <GlassCard title="Season, half-year and day measures" desc="Ritu and Ayana in both the observed and the traditional reckoning, with the length of day and night.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Pair k="Drik Ritu" v={data.seasons.drikRitu} />
          <Pair k="Vedic Ritu" v={data.seasons.vedicRitu} />
          <Pair k="Drik Ayana" v={data.seasons.drikAyana} />
          <Pair k="Vedic Ayana" v={data.seasons.vedicAyana} />
          <Pair k="Dinamana (day length)" v={data.measures.dinamana?.text ?? "Unavailable"} />
          <Pair k="Ratrimana (night length)" v={data.measures.ratrimana?.text ?? "Unavailable"} />
          <Pair k="Madhyahna (true noon)" v={fmtTime(data.measures.madhyahna)} />
          <Pair k="Surya Nakshatra" v={data.ravi.suryaNakshatra} />
          <Pair k="Surya Pada" v={String(data.ravi.suryaPada)} />
          <Pair k="Moon sign" v={RASHIS[data.moonSign]} />
          <Pair k="Nakshatra Pada" v={String(panchang.nakshatra.pada)} />
          <Pair k="Ayanamsa" v={`${data.samvat.ayanamsaDegrees.toFixed(4)} degrees`} />
        </div>
      </GlassCard>

      <GlassCard title="Varjyam, Amrit Kalam and Ravi Yoga" desc="Windows read from the exact start and end of the current star.">
        {data.vj ? (
          <div className="space-y-2">
            <Pair k="Current star runs" v={`${fmtTime(data.vj.nakshatraStart)} to ${fmtTime(data.vj.nakshatraEnd)}`} />
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
        <div className="space-y-2">
          {data.muhurtas.map((m) => (
            <div
              key={m.name}
              className={`rounded-xl px-3 py-2 ${m.nature === "good" ? "border border-emerald-400/20 bg-emerald-500/5" : "border border-red-400/20 bg-red-500/5"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-pearl">{m.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{fmtRange(m.range)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.note}</p>
            </div>
          ))}
          <div className="rounded-xl bg-white/5 px-3 py-2">
            <div className={KEY}>Baana</div>
            <div className={VAL}>{data.baana.name}</div>
            <p className="mt-1 text-sm text-pearl/90">{data.baana.note}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard title="Vasa and Shool" desc="Where fire, the Moon, Rahu and Shiva are said to reside today, and which direction is obstructed.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Pair k="Agnivasa" v={data.vasa.agnivasa} />
          <Pair k="Homahuti" v={data.vasa.homahuti} />
          <Pair k="Shivavasa" v={data.vasa.shivaVasa} />
          <Pair k="Chandra Vasa" v={data.vasa.chandraVasa} />
          <Pair k="Rahu Vasa" v={data.vasa.rahuVasa} />
          <Pair k="Bhadravasa" v={data.vasa.bhadraVasa} />
          <Pair k="Disha Shool" v={data.vasa.dishaShool} />
          <Pair k="Kumbha Chakra" v={data.vasa.kumbhaChakra} />
        </div>
        <ul className="mt-3 space-y-1 text-sm text-pearl/90">
          <li>{data.vasa.agniNote}</li>
          <li>{data.vasa.shivaNote}</li>
          <li>{data.vasa.kumbhaNote}</li>
        </ul>
      </GlassCard>

      <GlassCard title="Gowri Panchangam and Nalla Neram" desc="The eight-fold Tamil division of day and night, with the two clearly favourable stretches listed at the end.">
        <div className="grid gap-4 lg:grid-cols-2">
          {[["Day", data.gowri.day], ["Night", data.gowri.night]].map(([label, list]) => (
            <div key={label as string}>
              <div className={`${KEY} mb-2`}>{label as string}</div>
              <div className="space-y-1.5">
                {(list as typeof data.gowri.day).map((s, i) => (
                  <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${s.good ? "bg-emerald-500/5 text-pearl" : "bg-white/5 text-muted-foreground"}`}>
                    <span>{s.name}</span>
                    <span className="font-mono text-xs">{fmtTime(s.from)} to {fmtTime(s.to)}</span>
                  </div>
                ))}
                {(list as typeof data.gowri.day).length === 0 && <div className="text-xs text-muted-foreground">Unavailable for this place.</div>}
              </div>
            </div>
          ))}
        </div>
        {data.gowri.nallaNeram.length > 0 && (
          <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 px-3 py-2">
            <div className={KEY}>Nalla Neram</div>
            <div className="mt-1 space-y-1 text-sm text-pearl">
              {data.gowri.nallaNeram.map((s, i) => (
                <div key={i}>{s.name} — {fmtTime(s.from)} to {fmtTime(s.to)}</div>
              ))}
            </div>
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
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Pair k="Moon sign" v={data.ghatta.moonSign} />
          <Pair k="Month" v={data.ghatta.month} />
          <Pair k="Tithi" v={data.ghatta.tithi} />
          <Pair k="Vaar" v={data.ghatta.vaar} />
          <Pair k="Nakshatra" v={data.ghatta.nakshatra} />
          <Pair k="Yoga" v={data.ghatta.yoga} />
          <Pair k="Karana" v={data.ghatta.karana} />
        </div>
        <p className="mt-3 text-sm text-pearl/90">{data.ghatta.note}</p>
      </GlassCard>

      <GlassCard title="Epoch day counts" desc="The same instant expressed in the day-count systems used for cross checking any almanac.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Pair k="Julian Day" v={data.samvat.julianDay.toFixed(5)} />
          <Pair k="Modified Julian Day" v={data.samvat.modifiedJulianDay.toFixed(5)} />
          <Pair k="Rata Die" v={String(data.samvat.rataDie)} />
          <Pair k="Kali Ahargana" v={String(data.samvat.kaliAhargana)} />
        </div>
      </GlassCard>
    </div>
  );
}
