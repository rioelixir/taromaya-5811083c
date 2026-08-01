import { PlacePicker } from "@/components/place-picker";
import { PremiumGate } from "@/components/premium-gate";
import { DateSelect } from "@/components/date-select";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { computePanchang, fmtTime, fmtRange, todaysFestivals, WEEKDAY } from "@/lib/panchang";
import { classifyPanchaka, bhadraInfo, tithiQuality, nakshatraCharacter, yogaQuality } from "@/lib/panchang-deep";
import { dayVerdict, tithiPlain, nakshatraPlain, yogaPlain, karanaPlain, weekdayPlain } from "@/lib/panchang-plain";
import { computeMonthAlmanac, chaughadiyaSummary, type AlmanacDay } from "@/lib/panchang-month";
import { computeHoras, currentHora, HORA_NATURE, type HoraSlot } from "@/lib/hora";
import { scanFestivals } from "@/lib/festivals";
import { Sun, Moon, Clock, MapPin, Sparkles, CalendarDays, ShieldAlert, Flame } from "lucide-react";


export const Route = createFileRoute("/panchang")({
  component: () => (<PremiumGate featureName="Panchang"><PanchangPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Panchang — TAROMAYA" },
      { name: "description", content: "Daily Panchang with Tithi, Nakshatra, Yoga, Karana, Muhurats, Rahu Kaal, and Chaughadiya." },
    ],
  }),
});

function todayIso() { return new Date().toISOString().slice(0, 10); }

function PanchangPage() {
  const [date, setDate] = useState(todayIso());
  const [lat, setLat] = useState("28.6139");
  const [lon, setLon] = useState("77.2090");
  const [place, setPlace] = useState("New Delhi, India");

  const p = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    return computePanchang({
      date: new Date(y, m - 1, d, 12, 0, 0),
      latitude: Number(lat),
      longitude: Number(lon),
    });
  }, [date, lat, lon]);

  const festivals = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    return todaysFestivals(p, new Date(y, m - 1, d));
  }, [p, date]);

  const horas = useMemo<HoraSlot[]>(() => {
    const [y, m, d] = date.split("-").map(Number);
    if (!p.sunrise || !p.sunset) return [];
    // Next sunrise: recompute panchang for the following day.
    const next = computePanchang({
      date: new Date(y, m - 1, d + 1, 12, 0, 0),
      latitude: Number(lat),
      longitude: Number(lon),
    });
    if (!next.sunrise) return [];
    return computeHoras(p.sunrise, p.sunset, next.sunrise, WEEKDAY.indexOf(p.weekday));
  }, [p, date, lat, lon]);

  const nowHora = useMemo(() => currentHora(horas), [horas]);

  const verdict = useMemo(() => dayVerdict(p), [p]);

  const festivalCalendar = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    const end = new Date(y, m - 1, d + 60);
    return scanFestivals(start, end, Number(lat), Number(lon));
  }, [date, lat, lon]);

  return (
    <PageShell
      eyebrow="Panchang"
      title="The five limbs of time"
      subtitle="Today's cosmic almanac — auspicious timings, planetary hours, and Vedic calendar."
    >
      <GlassCard>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Date</span>
            <DateSelect label="" value={date} onChange={(v) => setDate(v)} />
          </label>
          <PlacePicker
            label="Which place?"
            value={{ place, lat, lon, tz: "0" }}
            onChange={(p2) => { setPlace(p2.place); setLat(p2.lat); setLon(p2.lon); }}
            forDate={date}
          />
        </div>
      </GlassCard>

      <GlassCard className="mt-6">
        <div className="text-[10px] uppercase tracking-widest text-gold">In plain words</div>
        <div className="mt-2 font-display text-2xl gold-text">{verdict.label} day</div>
        <p className="mt-2 text-sm text-muted-foreground">{verdict.summary}</p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {[weekdayPlain(p), tithiPlain(p), nakshatraPlain(p), yogaPlain(p), karanaPlain(p)].map((line) => (
            <li key={line} className="flex gap-2.5">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </GlassCard>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <MapPin className="w-3 h-3" /> {place} · {p.weekday}
          </div>
          <div className="mt-2 font-display text-2xl gold-text">{p.tithi.paksha} Paksha · {p.tithi.name}</div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">

            <Row k="Tithi" v={`${p.tithi.name} (${p.tithi.number})`} />
            <Row k="Paksha" v={p.tithi.paksha} />
            <Row k="Nakshatra" v={`${p.nakshatra.name} — Pada ${p.nakshatra.pada}`} />
            <Row k="Nak. lord" v={p.nakshatra.lord} />
            <Row k="Yoga" v={p.yoga.name} />
            <Row k="Karana" v={p.karana.name} />
            <Row k="Moon age" v={`${p.moonAge.toFixed(1)}d`} />
          </div>
        </GlassCard>

        <GlassCard title="Sun & Moon">
          <div className="space-y-3 text-sm">
            <TimeRow icon={<Sun className="w-4 h-4 text-gold" />} label="Sunrise" value={fmtTime(p.sunrise)} />
            <TimeRow icon={<Sun className="w-4 h-4 text-gold/60" />} label="Solar noon" value={fmtTime(p.solarNoon)} />
            <TimeRow icon={<Sun className="w-4 h-4 text-orange-300" />} label="Sunset" value={fmtTime(p.sunset)} />
            <TimeRow icon={<Moon className="w-4 h-4 text-pearl" />} label="Moonrise" value={fmtTime(p.moonrise)} />
            <TimeRow icon={<Moon className="w-4 h-4 text-pearl/60" />} label="Moonset" value={fmtTime(p.moonset)} />
            <div className="pt-2 border-t border-white/5 text-xs text-muted-foreground">
              Moon illumination: {(p.moonIllumination * 100).toFixed(0)}%
            </div>
          </div>
        </GlassCard>

        <GlassCard title="Auspicious Muhurats">
          <div className="space-y-2 text-sm">
            <MuhurtaRow label="Abhijit" range={p.abhijitMuhurat} good />
            <MuhurtaRow label="Brahma" range={p.brahmaMuhurat} good />
            <MuhurtaRow label="Godhuli" range={p.godhuliMuhurat} good />
            <div className="pt-2 border-t border-white/5" />
            <MuhurtaRow label="Rahu Kaal" range={p.rahuKaal} />
            <MuhurtaRow label="Yamaganda" range={p.yamaganda} />
            <MuhurtaRow label="Gulika" range={p.gulika} />
          </div>
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GlassCard title="Chaughadiya — Day">
          <ChaughadiyaTable rows={p.chaughadiyaDay} />
        </GlassCard>
        <GlassCard title="Chaughadiya — Night">
          <ChaughadiyaTable rows={p.chaughadiyaNight} />
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GlassCard title="Special notes">
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Disha Shool (avoid direction)</div>
              <div className="text-pearl">{p.dishaShool}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Chandrashtama nakshatras</div>
              <div className="text-pearl text-xs">{p.chandrashtama.join(" · ")}</div>
            </div>
            {festivals.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground">Today</div>
                <div className="gold-text">{festivals.join(" · ")}</div>
              </div>
            )}
          </div>
        </GlassCard>
        <GlassCard title="Astronomical">
          <div className="text-xs text-muted-foreground">Julian Day: <span className="text-pearl">{p.julianDay.toFixed(4)}</span></div>
          <div className="text-xs text-muted-foreground mt-1">Sun–Moon elongation: <span className="text-pearl">{(p.tithi.number - 1) * 12 + "°"}</span></div>
        </GlassCard>
      </div>

      {/* Hora — Planetary Hours */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GlassCard title="Hora — Day (Sunrise → Sunset)">
          <HoraTable rows={horas.filter(h => h.isDay)} nowIdx={nowHora?.index ?? -1} />
        </GlassCard>
        <GlassCard title="Hora — Night (Sunset → Sunrise)">
          <HoraTable rows={horas.filter(h => !h.isDay)} nowIdx={nowHora?.index ?? -1} />
        </GlassCard>
      </div>

      {nowHora && (
        <div className="mt-4 glass rounded-3xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-gold" />
          <div className="text-sm">
            <span className="text-muted-foreground">Now </span>
            <span className="text-pearl font-medium">{nowHora.lord} Hora</span>
            <span className="text-muted-foreground"> · {HORA_NATURE[nowHora.lord].best}</span>
          </div>
        </div>
      )}

      {/* Deep attributes: Panchaka, Bhadra, Tithi quality, Yoga quality, Nakshatra character */}
      <DeepAttributes p={p} weekdayNum={new Date(date).getDay()} />

      {/* Month Almanac — 30-day quality ledger */}
      <MonthAlmanac date={date} lat={Number(lat)} lon={Number(lon)} />

      {/* Today's chaughadiya heatmap summary */}
      <div className="mt-6">
        <ChaughadiyaSummaryCard p={p} />
      </div>

      {/* Festival Calendar */}
      <div className="mt-6">
        <GlassCard title="Festival Calendar — next 60 days">
          {festivalCalendar.length === 0 ? (
            <div className="text-sm text-muted-foreground">No major festivals found in this window.</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {festivalCalendar.slice(0, 30).map((f, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/5 px-3 py-2">
                  <div className="mt-0.5">
                    {f.category === "major" ? <Sparkles className="w-4 h-4 text-gold" /> : <CalendarDays className="w-4 h-4 text-pearl/60" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground font-mono">
                      {f.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                    <div className="text-sm text-pearl">{f.name}</div>
                    <div className="text-[11px] text-muted-foreground">{f.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </PageShell>
  );
}

function HoraTable({ rows, nowIdx }: { rows: HoraSlot[]; nowIdx: number }) {
  if (rows.length === 0) return <div className="text-sm text-muted-foreground">—</div>;
  return (
    <div className="space-y-1 text-xs">
      {rows.map((r) => {
        const nature = HORA_NATURE[r.lord].nature;
        const cls = nature === "benefic" ? "text-emerald-200 bg-emerald-500/10"
          : nature === "malefic" ? "text-red-200 bg-red-500/10"
          : "text-muted-foreground bg-white/5";
        const isNow = r.index === nowIdx;
        return (
          <div key={r.index} className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${cls} ${isNow ? "ring-1 ring-gold" : ""}`}>
            <span className="flex items-center gap-2">
              <span className="w-4 text-right text-[10px] opacity-60">{r.index}</span>
              <span className="text-pearl">{r.lord}</span>
              {isNow && <span className="text-[9px] uppercase tracking-widest text-gold">now</span>}
            </span>
            <span className="font-mono">{fmtTime(r.from)} – {fmtTime(r.to)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
      <div className="mt-0.5 text-pearl">{v}</div>
    </div>
  );
}
function TimeRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}{label}</div>
      <div className="text-pearl font-mono">{value}</div>
    </div>
  );
}
function MuhurtaRow({ label, range, good }: { label: string; range: [Date, Date] | null; good?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-pearl">{label}</span>
      <span className={`font-mono text-xs ${good ? "text-emerald-300" : "text-red-300"}`}>{fmtRange(range)}</span>
    </div>
  );
}
function ChaughadiyaTable({ rows }: { rows: { name: string; nature: string; from: Date; to: Date }[] }) {
  if (rows.length === 0) return <div className="text-sm text-muted-foreground">—</div>;
  return (
    <div className="space-y-1.5 text-xs">
      {rows.map((r, i) => (
        <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${
          r.nature === "good" ? "bg-emerald-500/10 text-emerald-200"
          : r.nature === "bad" ? "bg-red-500/10 text-red-200"
          : "bg-white/5 text-muted-foreground"
        }`}>
          <span>{r.name}</span>
          <span className="font-mono">{fmtTime(r.from)} – {fmtTime(r.to)}</span>
        </div>
      ))}
    </div>
  );
}
void Clock;

function DeepAttributes({ p, weekdayNum }: { p: ReturnType<typeof computePanchang>; weekdayNum: number }) {
  const panchaka = classifyPanchaka(p.nakshatra.name, weekdayNum);
  const bhadra = bhadraInfo(p.karana.name);
  const tq = tithiQuality(p.tithi.number);
  const yq = yogaQuality(p.yoga.name);
  const nak = nakshatraCharacter(p.nakshatra.index);
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <GlassCard title="Panchaka & Bhadra">
        <div className={`rounded-xl p-3 mb-3 ${panchaka.active ? "bg-red-500/10 border border-red-400/30" : "bg-emerald-500/10 border border-emerald-400/20"}`}>
          <div className="flex items-center gap-2 text-xs">
            <ShieldAlert className={`w-4 h-4 ${panchaka.active ? "text-red-300" : "text-emerald-300"}`} />
            <span className="uppercase tracking-widest text-muted-foreground">Panchaka</span>
            {panchaka.type && <span className="gold-text">{panchaka.type}</span>}
          </div>
          <div className="mt-1 text-sm text-pearl">{panchaka.note}</div>
        </div>
        <div className={`rounded-xl p-3 ${bhadra.active ? "bg-red-500/10 border border-red-400/30" : "bg-white/5"}`}>
          <div className="flex items-center gap-2 text-xs">
            <Flame className={`w-4 h-4 ${bhadra.active ? "text-red-300" : "text-muted-foreground"}`} />
            <span className="uppercase tracking-widest text-muted-foreground">Bhadra (Vishti)</span>
          </div>
          <div className="mt-1 text-sm text-pearl">{bhadra.note}</div>
        </div>
      </GlassCard>

      <GlassCard title="Tithi & Yoga quality">
        <div className={`rounded-xl p-3 mb-3 ${tq.auspicious ? "bg-emerald-500/10 border border-emerald-400/20" : "bg-red-500/10 border border-red-400/30"}`}>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tithi group</div>
          <div className="font-display text-lg gold-text">{tq.name}</div>
          <div className="text-xs text-pearl mt-1">{tq.note}</div>
        </div>
        <div className={`rounded-xl p-3 ${yq.auspicious ? "bg-emerald-500/10 border border-emerald-400/20" : "bg-red-500/10 border border-red-400/30"}`}>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Yoga</div>
          <div className="font-display text-lg gold-text">{p.yoga.name}</div>
          <div className="text-xs text-pearl mt-1">{yq.note}</div>
        </div>
      </GlassCard>

      <GlassCard title={`${nak.name} — nakshatra character`}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <KV k="Deity" v={nak.deity} />
          <KV k="Symbol" v={nak.symbol} />
          <KV k="Gana" v={nak.gana} />
          <KV k="Yoni" v={nak.yoni} />
          <KV k="Guna" v={nak.guna} />
          <KV k="Tatva" v={nak.tatva} />
          <KV k="Nature" v={nak.nature} />
          <KV k="Caste" v={nak.caste} />
        </div>
      </GlassCard>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
      <div className="text-pearl">{v}</div>
    </div>
  );
}

function MonthAlmanac({ date, lat, lon }: { date: string; lat: number; lon: number }) {
  const [days, setDays] = useState(30);
  const almanac = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    start.setHours(0, 0, 0, 0);
    return computeMonthAlmanac({ startDate: start, days, latitude: lat, longitude: lon });
  }, [date, lat, lon, days]);

  const bandColor = (q: AlmanacDay["quality"]) =>
    q === "Excellent" ? "from-emerald-400/70 to-gold/70" :
    q === "Good"      ? "from-gold/70 to-gold-soft/60" :
    q === "Fair"      ? "from-white/25 to-white/10" :
                        "from-red-500/70 to-red-500/30";

  return (
    <div className="mt-6">
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-gold" />
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Almanac · next {days} days
          </div>
          <div className="ml-auto flex gap-1">
            {[15, 30, 60].map((n) => (
              <button
                key={n}
                onClick={() => setDays(n)}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  days === n ? "border-gold/60 bg-gold/10 text-gold" : "border-white/10 text-muted-foreground"
                }`}
              >
                {n}d
              </button>
            ))}
          </div>
        </div>

        {/* Heatstrip */}
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${Math.min(days, 30)}, minmax(0,1fr))` }}>
          {almanac.slice(0, 30).map((a, i) => (
            <div
              key={i}
              title={`${a.date.toDateString()} · ${a.quality} · ${a.score}`}
              className={`h-8 rounded-md bg-gradient-to-b ${bandColor(a.quality)} border border-white/5 flex items-end justify-center text-[9px] text-cosmic/90 font-medium pb-0.5`}
            >
              {a.date.getDate()}
            </div>
          ))}
        </div>

        {/* Second row for days > 30 */}
        {days > 30 && (
          <div className="mt-1 grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${days - 30}, minmax(0,1fr))` }}>
            {almanac.slice(30).map((a, i) => (
              <div
                key={i}
                title={`${a.date.toDateString()} · ${a.quality} · ${a.score}`}
                className={`h-8 rounded-md bg-gradient-to-b ${bandColor(a.quality)} border border-white/5 flex items-end justify-center text-[9px] text-cosmic/90 font-medium pb-0.5`}
              >
                {a.date.getDate()}
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <Legend color="from-emerald-400/70 to-gold/70" label="Excellent" />
          <Legend color="from-gold/70 to-gold-soft/60" label="Good" />
          <Legend color="from-white/25 to-white/10" label="Fair" />
          <Legend color="from-red-500/70 to-red-500/30" label="Avoid" />
        </div>

        {/* Detailed list */}
        <div className="mt-5 space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {almanac.map((a, i) => (
            <AlmanacRow key={i} a={a} />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function AlmanacRow({ a }: { a: AlmanacDay }) {
  const badge =
    a.quality === "Excellent" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" :
    a.quality === "Good"      ? "border-gold/40 bg-gold/10 text-gold" :
    a.quality === "Fair"      ? "border-white/15 bg-white/5 text-pearl/80" :
                                 "border-red-500/40 bg-red-500/10 text-red-200";
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 flex flex-wrap items-center gap-3">
      <div className="w-28 font-mono text-xs text-muted-foreground">
        {a.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
      </div>
      <div className="text-xs text-pearl">
        {a.paksha} · {a.tithi}
      </div>
      <div className="text-xs text-muted-foreground">
        <span className="text-pearl/80">{a.nakshatra}</span> · {a.yoga}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {a.tags.slice(0, 4).map((t, j) => (
            <span
              key={j}
              className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                t.kind === "good" ? "border-emerald-400/30 text-emerald-300 bg-emerald-500/5"
                  : t.kind === "bad" ? "border-red-400/30 text-red-300 bg-red-500/5"
                  : "border-white/10 text-muted-foreground"
              }`}
            >
              {t.label}
            </span>
          ))}
        </div>
        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${badge}`}>
          {a.quality} · {a.score}
        </span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-6 rounded bg-gradient-to-b ${color}`} />
      {label}
    </span>
  );
}

function ChaughadiyaSummaryCard({ p }: { p: ReturnType<typeof computePanchang> }) {
  const s = chaughadiyaSummary(p);
  const all = [...p.chaughadiyaDay, ...p.chaughadiyaNight];
  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-gold" />
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Chaughadiya today · {s.good} good · {s.bad} avoid · {s.neutral} neutral
        </div>
      </div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${Math.max(all.length, 1)}, minmax(0,1fr))` }}>
        {all.map((c, i) => {
          const col = c.nature === "good" ? "bg-emerald-500/40"
            : c.nature === "bad" ? "bg-red-500/40"
            : "bg-white/10";
          const isNight = i >= p.chaughadiyaDay.length;
          return (
            <div key={i} title={`${c.name} · ${c.nature}`}
              className={`h-10 rounded-md ${col} border ${isNight ? "border-pearl/10" : "border-gold/10"} flex flex-col items-center justify-center`}>
              <div className="text-[9px] text-pearl/90">{c.name.slice(0, 4)}</div>
              <div className="text-[8px] text-muted-foreground">{fmtTime(c.from)}</div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

