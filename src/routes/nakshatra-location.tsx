import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import {
  computeNakshatraForLocation,
  findNextNakshatraWindow,
  fmtLocalDateTime,
  fmtLocalTime,
  fmtDuration,
  type LocationSnapshot,
} from "@/lib/nakshatra-location";
import { NAKSHATRAS } from "@/lib/vedic";
import { nakshatraProfile } from "@/lib/nakshatra-deep";
import {
  MapPin, Compass, Moon, Sun, Sparkles, AlertTriangle,
  Clock, Search, Locate,
} from "lucide-react";

export const Route = createFileRoute("/nakshatra-location")({
  component: () => (
    <PremiumGate featureName="Nakshatra for Location">
      <NakshatraLocationPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Nakshatra for Location — TAROMAYA" },
      {
        name: "description",
        content:
          "Live Moon, Sun and Ascendant nakshatra at any place on Earth. Precise entry/exit times, upcoming timeline, Ganda Moola, Panchak and Chandrashtama flags for that location.",
      },
    ],
  }),
});

type City = { name: string; region: string; lat: number; lon: number };
const CITY_PRESETS: City[] = [
  { name: "New Delhi", region: "India", lat: 28.6139, lon: 77.209 },
  { name: "Mumbai", region: "India", lat: 19.076, lon: 72.8777 },
  { name: "Bengaluru", region: "India", lat: 12.9716, lon: 77.5946 },
  { name: "Kolkata", region: "India", lat: 22.5726, lon: 88.3639 },
  { name: "Chennai", region: "India", lat: 13.0827, lon: 80.2707 },
  { name: "Hyderabad", region: "India", lat: 17.385, lon: 78.4867 },
  { name: "Pune", region: "India", lat: 18.5204, lon: 73.8567 },
  { name: "Ahmedabad", region: "India", lat: 23.0225, lon: 72.5714 },
  { name: "Varanasi", region: "India", lat: 25.3176, lon: 82.9739 },
  { name: "Ujjain", region: "India", lat: 23.1793, lon: 75.7849 },
  { name: "Tirupati", region: "India", lat: 13.6288, lon: 79.4192 },
  { name: "London", region: "UK", lat: 51.5074, lon: -0.1278 },
  { name: "New York", region: "USA", lat: 40.7128, lon: -74.006 },
  { name: "San Francisco", region: "USA", lat: 37.7749, lon: -122.4194 },
  { name: "Toronto", region: "Canada", lat: 43.6532, lon: -79.3832 },
  { name: "Dubai", region: "UAE", lat: 25.2048, lon: 55.2708 },
  { name: "Singapore", region: "SG", lat: 1.3521, lon: 103.8198 },
  { name: "Sydney", region: "Australia", lat: -33.8688, lon: 151.2093 },
  { name: "Kathmandu", region: "Nepal", lat: 27.7172, lon: 85.324 },
  { name: "Colombo", region: "Sri Lanka", lat: 6.9271, lon: 79.8612 },
];

function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50";

function BigStat({
  eyebrow, title, sub, tone = "gold",
}: { eyebrow: string; title: string; sub?: string; tone?: "gold" | "aurora" | "galaxy" }) {
  const ring =
    tone === "aurora" ? "border-aurora/30 shadow-[0_0_40px_-15px_var(--aurora,#7de3c4)]"
    : tone === "galaxy" ? "border-galaxy/40 shadow-[0_0_40px_-15px_var(--galaxy,#8a5cff)]"
    : "gold-border shadow-[0_0_40px_-15px_var(--gold,#d4af37)]";
  return (
    <div className={`glass rounded-3xl p-5 ${ring}`}>
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</div>
      <div className="mt-1 font-display text-2xl sm:text-3xl gold-text">{title}</div>
      {sub && <div className="mt-1 text-xs text-pearl/80">{sub}</div>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-1.5 last:border-0">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{k}</span>
      <span className="text-sm text-pearl text-right">{v}</span>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-gold via-gold-soft to-aurora"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function NakshatraLocationPage() {
  const [city, setCity] = useState<City>(CITY_PRESETS[0]);
  const [lat, setLat] = useState<string>(String(CITY_PRESETS[0].lat));
  const [lon, setLon] = useState<string>(String(CITY_PRESETS[0].lon));
  const [live, setLive] = useState(true);
  const [now, setNow] = useState(new Date());
  const [customDate, setCustomDate] = useState<string>("");
  const [customTime, setCustomTime] = useState<string>("");
  const [findQuery, setFindQuery] = useState<string>("");
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    if (!live) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, [live]);

  const when = useMemo(() => {
    if (!customDate) return now;
    const d = new Date(`${customDate}T${customTime || "12:00"}:00`);
    return isNaN(d.getTime()) ? now : d;
  }, [customDate, customTime, now]);

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);
  const valid = isFinite(parsedLat) && isFinite(parsedLon)
    && parsedLat >= -90 && parsedLat <= 90
    && parsedLon >= -180 && parsedLon <= 180;

  const snap: LocationSnapshot | null = useMemo(() => {
    if (!valid) return null;
    try {
      return computeNakshatraForLocation({
        date: when,
        latitude: parsedLat,
        longitude: parsedLon,
        timelineCount: 12,
      });
    } catch {
      return null;
    }
  }, [when, parsedLat, parsedLon, valid]);

  const applyCity = (c: City) => {
    setCity(c);
    setLat(String(c.lat));
    setLon(String(c.lon));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not available in this browser.");
      return;
    }
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
        setCity({ name: "My location", region: "GPS", lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => setLocError(err.message || "Could not read your location."),
      { timeout: 8000 }
    );
  };

  const moonProfile = snap ? nakshatraProfile(snap.moon.index) : null;

  // Nakshatra window finder
  const findMatch = useMemo(() => {
    if (!snap || !findQuery.trim()) return null;
    const q = findQuery.trim().toLowerCase();
    const idx = NAKSHATRAS.findIndex((n) => n.toLowerCase().startsWith(q));
    if (idx < 0) return { error: "Not found" as const };
    const w = findNextNakshatraWindow(idx, when, parsedLat, parsedLon);
    return { idx, window: w };
  }, [findQuery, snap, when, parsedLat, parsedLon]);

  return (
    <PageShell
      eyebrow="Sky over your place"
      title="Nakshatra for Location"
      subtitle="Which lunar mansion is active over your city, right now — with exact entry & exit times, ascendant nakshatra, and dosha windows tied to this latitude & longitude."
      aiModule="Nakshatra for Location"
      aiSnapshot={{
        location: `${city.name}, ${city.region}`,
        latitude: parsedLat,
        longitude: parsedLon,
        moment: when.toISOString(),
        moonNakshatra: snap?.moon.name,
        moonPada: snap?.moon.pada,
        moonLord: snap?.moon.lord,
        sunNakshatra: snap?.sun.name,
        lagnaNakshatra: snap?.lagna.name,
        isGandaMoola: snap?.isGandaMoola,
        isPanchak: snap?.isPanchak,
        chandrashtama: snap?.chandrashtama,
      }}
      aiIntent="Explain in the simplest human words what this Moon nakshatra means for someone standing at this location right now. Say which activities suit the next few hours and which to postpone. Mention Chandrashtama, Ganda Moola or Panchak only if flagged."
    >
      {/* Location & moment controls */}
      <div className="glass rounded-3xl p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Field label="City preset">
              <select
                value={`${city.name}|${city.region}`}
                onChange={(e) => {
                  const [n, r] = e.target.value.split("|");
                  const found = CITY_PRESETS.find((c) => c.name === n && c.region === r);
                  if (found) applyCity(found);
                }}
                className={inputCls}
              >
                {!CITY_PRESETS.find((c) => c.name === city.name && c.region === city.region) && (
                  <option value={`${city.name}|${city.region}`}>{city.name} — {city.region}</option>
                )}
                {CITY_PRESETS.map((c) => (
                  <option key={c.name} value={`${c.name}|${c.region}`}>
                    {c.name} — {c.region}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Latitude (°N)">
            <input
              className={inputCls}
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="28.6139"
              inputMode="decimal"
            />
          </Field>
          <Field label="Longitude (°E)">
            <input
              className={inputCls}
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="77.2090"
              inputMode="decimal"
            />
          </Field>

          <Field label="Date (optional)">
            <input
              type="date"
              className={inputCls}
              value={customDate}
              onChange={(e) => { setCustomDate(e.target.value); setLive(false); }}
            />
          </Field>
          <Field label="Time">
            <input
              type="time"
              className={inputCls}
              value={customTime}
              onChange={(e) => { setCustomTime(e.target.value); setLive(false); }}
            />
          </Field>

          <div className="md:col-span-2 flex flex-wrap items-end gap-2">
            <button
              onClick={useMyLocation}
              className="inline-flex items-center gap-2 rounded-xl gold-border glass px-3 py-2 text-sm text-pearl hover:bg-white/10"
            >
              <Locate className="h-4 w-4 text-gold" /> Use my location
            </button>
            <button
              onClick={() => { setLive(true); setCustomDate(""); setCustomTime(""); setNow(new Date()); }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-pearl hover:bg-white/10"
            >
              <Clock className="h-4 w-4 text-aurora" /> Live now
            </button>
            <div className="text-xs text-muted-foreground ml-auto">
              {live ? "Updating every 30s" : "Showing custom moment"} · {fmtLocalDateTime(when)}
            </div>
          </div>
        </div>
        {locError && (
          <div className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {locError}
          </div>
        )}
        {!valid && (
          <div className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            Please enter a valid latitude (−90 to 90) and longitude (−180 to 180).
          </div>
        )}
      </div>

      {snap && moonProfile && (
        <>
          {/* Headline row */}
          <div className="grid gap-3 sm:grid-cols-3">
            <BigStat
              eyebrow="Moon nakshatra"
              title={`${snap.moon.name} · Pada ${snap.moon.pada}`}
              sub={`Ruler ${snap.moon.lord} · ${(snap.moon.degInNak).toFixed(2)}° in nakshatra`}
              tone="gold"
            />
            <BigStat
              eyebrow="Sun nakshatra"
              title={snap.sun.name}
              sub={`Ruler ${snap.sun.lord} · ${(snap.sun.degInNak).toFixed(2)}°`}
              tone="aurora"
            />
            <BigStat
              eyebrow="Ascendant nakshatra"
              title={`${snap.lagna.name} · Pada ${snap.lagna.pada}`}
              sub={`Rising at this place · Ruler ${snap.lagna.lord}`}
              tone="galaxy"
            />
          </div>

          {/* Progress + exit info */}
          <div className="glass rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-gold" />
              <div className="font-display text-xl gold-text">Current lunar mansion</div>
              <div className="ml-auto text-xs text-muted-foreground">
                Moon speed {snap.moonSpeed.toFixed(2)}°/day
              </div>
            </div>

            <ProgressBar value={snap.moon.progress} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="glass rounded-2xl p-4 space-y-1">
                <Row k="Entered" v={snap.moon.entry ? fmtLocalDateTime(snap.moon.entry) : "—"} />
                <Row k="Leaves" v={snap.moon.exit ? fmtLocalDateTime(snap.moon.exit) : "—"} />
                <Row k="Time left" v={fmtDuration(snap.moon.minutesToExit ?? 0)} />
                <Row k="Next pada in" v={snap.moon.minutesToNextPada != null ? fmtDuration(snap.moon.minutesToNextPada) : "—"} />
              </div>
              <div className="glass rounded-2xl p-4 space-y-1">
                <Row k="Deity" v={moonProfile.deity} />
                <Row k="Symbol" v={moonProfile.symbol} />
                <Row k="Gana" v={moonProfile.gana} />
                <Row k="Yoni" v={`${moonProfile.yoni} (${moonProfile.yoniGender})`} />
                <Row k="Nadi" v={moonProfile.nadi} />
                <Row k="Tattva" v={moonProfile.tattva} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="text-xs uppercase tracking-widest text-emerald-300/80 mb-1 inline-flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> Favourable now
                </div>
                <div className="text-sm text-pearl">{moonProfile.favourable.join(" · ")}</div>
              </div>
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="text-xs uppercase tracking-widest text-red-300/80 mb-1 inline-flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" /> Avoid
                </div>
                <div className="text-sm text-pearl">{moonProfile.unfavourable.join(" · ")}</div>
              </div>
            </div>
          </div>

          {/* Location-tied flags */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`glass rounded-2xl p-4 ${snap.isGandaMoola ? "border border-amber-400/40" : ""}`}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Ganda Moola</div>
              <div className={`mt-1 font-display text-lg ${snap.isGandaMoola ? "text-amber-300" : "text-pearl"}`}>
                {snap.isGandaMoola ? "Active — handle transitions gently" : "Clear"}
              </div>
            </div>
            <div className={`glass rounded-2xl p-4 ${snap.isPanchak ? "border border-rose-400/40" : ""}`}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Panchak</div>
              <div className={`mt-1 font-display text-lg ${snap.isPanchak ? "text-rose-300" : "text-pearl"}`}>
                {snap.isPanchak ? "In effect — postpone certain rituals" : "Not in effect"}
              </div>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Moon rise / set here</div>
              <div className="mt-1 text-sm text-pearl">
                ↑ {snap.moonRise ? fmtLocalTime(snap.moonRise) : "—"} · ↓ {snap.moonSet ? fmtLocalTime(snap.moonSet) : "—"}
              </div>
            </div>
          </div>

          {/* Chandrashtama */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Compass className="h-4 w-4 text-gold" />
              <div className="text-xs uppercase tracking-[0.3em] text-gold/80">Chandrashtama for people born in</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {snap.chandrashtama.map((n) => (
                <span key={n} className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs text-rose-100">
                  {n}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              If your Moon nakshatra is on this list, take extra rest today and postpone major moves.
            </p>
          </div>

          {/* Timeline */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-aurora" />
              <div className="font-display text-xl gold-text">Upcoming nakshatra windows</div>
              <div className="ml-auto text-xs text-muted-foreground">Local time · {city.name}</div>
            </div>
            <div className="space-y-1.5">
              <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-widest text-muted-foreground px-1">
                <div className="col-span-4">Nakshatra</div>
                <div className="col-span-3">Enters</div>
                <div className="col-span-3">Leaves</div>
                <div className="col-span-2 text-right">Length</div>
              </div>
              {snap.upcoming.map((u, i) => {
                const len = (u.to.getTime() - u.from.getTime()) / 60000;
                const prof = nakshatraProfile(u.index);
                return (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-2 items-center rounded-xl border border-white/5 bg-white/[0.02] px-2 py-2 text-sm"
                  >
                    <div className="col-span-4">
                      <div className="text-pearl">{u.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {prof.lord} · {prof.gana}
                      </div>
                    </div>
                    <div className="col-span-3 text-pearl/90 text-xs">{fmtLocalDateTime(u.from)}</div>
                    <div className="col-span-3 text-pearl/90 text-xs">{fmtLocalDateTime(u.to)}</div>
                    <div className="col-span-2 text-right text-xs text-muted-foreground">{fmtDuration(len)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nakshatra finder */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-4 w-4 text-gold" />
              <div className="font-display text-xl gold-text">Find a nakshatra window</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className={inputCls + " sm:flex-1"}
                placeholder="Type a nakshatra e.g. Rohini, Pushya, Anuradha…"
                list="nak-list"
                value={findQuery}
                onChange={(e) => setFindQuery(e.target.value)}
              />
              <datalist id="nak-list">
                {NAKSHATRAS.map((n) => <option key={n} value={n} />)}
              </datalist>
            </div>
            {findMatch && (
              <div className="mt-3">
                {"error" in findMatch ? (
                  <div className="text-xs text-rose-200">No nakshatra matches that name.</div>
                ) : findMatch.window ? (
                  <div className="glass rounded-2xl p-4 space-y-1">
                    <Row k="Nakshatra" v={NAKSHATRAS[findMatch.idx]} />
                    <Row k="Starts here" v={fmtLocalDateTime(findMatch.window.from)} />
                    <Row k="Ends here" v={fmtLocalDateTime(findMatch.window.to)} />
                    <Row k="Length" v={fmtDuration((findMatch.window.to.getTime() - findMatch.window.from.getTime()) / 60000)} />
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">No occurrence within the next 30 days.</div>
                )}
              </div>
            )}
          </div>

          {/* Coordinates footer */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gold" /> {city.name} · {city.region}</span>
            <span>{parsedLat.toFixed(4)}°, {parsedLon.toFixed(4)}°</span>
            <span>Ayanamsa (Lahiri) {snap.ayanamsa.toFixed(4)}°</span>
            <span className="inline-flex items-center gap-1"><Sun className="h-3.5 w-3.5 text-gold" /> Sun in {snap.sun.name}</span>
          </div>
        </>
      )}
    </PageShell>
  );
}
