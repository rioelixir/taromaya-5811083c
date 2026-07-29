import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchPlaces, type PlaceHit } from "@/lib/geo.functions";
import { COUNTRIES } from "@/lib/countries";
import { friendlyZoneName, offsetForLocalTime } from "@/lib/timezone";
import { MapPin, Loader2, Check } from "lucide-react";

export type PlaceValue = {
  place: string;
  lat: string;
  lon: string;
  tz: string;
};

/**
 * Pick a birth place the easy way: choose a country, type the town, tap it.
 * The app quietly works out the map position and the correct clock time
 * (including summer time) — the user never sees numbers.
 */
export function PlacePicker({
  value,
  onChange,
  forDate,
  forTime,
  label = "Where were you born?",
  compact = false,
}: {
  value: PlaceValue;
  onChange: (v: PlaceValue) => void;
  /** yyyy-mm-dd — used so old dates get the clock rules of that year. */
  forDate?: string;
  /** hh:mm */
  forTime?: string;
  label?: string;
  compact?: boolean;
}) {
  const search = useServerFn(searchPlaces);
  const [country, setCountry] = useState("IN");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [zoneLabel, setZoneLabel] = useState<string>("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setBusy(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await search({ data: { query: q, country } });
        if (!cancelled) {
          setHits(res.places);
          setOpen(true);
        }
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 320);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, country, search]);

  const states = useMemo(() => {
    const seen = new Set<string>();
    return hits.map((h) => h.state).filter((s) => s && !seen.has(s) && seen.add(s));
  }, [hits]);
  const [stateFilter, setStateFilter] = useState("");
  const shown = stateFilter ? hits.filter((h) => h.state === stateFilter) : hits;

  const pick = (h: PlaceHit) => {
    const [y, mo, d] = (forDate ?? "2000-01-01").split("-").map(Number);
    const [hh, mi] = (forTime ?? "12:00").split(":").map(Number);
    const off = offsetForLocalTime(h.timezone, y || 2000, mo || 1, d || 1, hh || 12, mi || 0);
    setZoneLabel(friendlyZoneName(h.timezone, h.country));
    onChange({
      place: [h.city, h.state, h.country].filter(Boolean).join(", "),
      lat: h.latitude.toFixed(4),
      lon: h.longitude.toFixed(4),
      tz: String(off),
    });
    setQuery("");
    setHits([]);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className={compact ? "relative" : "relative space-y-2"}>
      {!compact && (
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      )}
      <div className="grid gap-2 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
        <select
          value={country}
          onChange={(e) => { setCountry(e.target.value); setStateFilter(""); }}
          className="w-full min-w-0 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-pearl outline-none focus:border-gold/50"
          aria-label="Country"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </select>
        <div className="relative min-w-0">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/70" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => hits.length && setOpen(true)}
            placeholder="Type your town or city"
            className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-9 text-sm text-pearl placeholder:text-muted-foreground/60 outline-none focus:border-gold/50"
          />
          {busy && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold/70" />}
        </div>
      </div>

      {states.length > 1 && open && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setStateFilter("")}
            className={`rounded-lg border px-2 py-1 text-[11px] ${stateFilter === "" ? "border-gold/60 text-gold" : "border-white/10 text-muted-foreground"}`}
          >
            All areas
          </button>
          {states.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStateFilter(s)}
              className={`rounded-lg border px-2 py-1 text-[11px] ${stateFilter === s ? "border-gold/60 text-gold" : "border-white/10 text-muted-foreground"}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {open && shown.length > 0 && (
        <div className="absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gold/25 bg-cosmic/95 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur">
          {shown.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => pick(h)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-pearl hover:bg-white/5"
            >
              <span className="min-w-0 truncate">
                {h.city}
                {h.state ? <span className="text-muted-foreground"> · {h.state}</span> : null}
              </span>
              <span className="shrink-0 text-[11px] text-gold/80">{friendlyZoneName(h.timezone, h.country)}</span>
            </button>
          ))}
        </div>
      )}

      {value.place && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-pearl/85">
          <Check className="h-3.5 w-3.5 text-gold" />
          <span className="font-medium">{value.place}</span>
          {zoneLabel && <span className="text-muted-foreground">· {zoneLabel}</span>}
        </div>
      )}
    </div>
  );
}
