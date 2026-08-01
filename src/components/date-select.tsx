import { useEffect, useRef, useState } from "react";
import { VOICE_FILL_EVENT, isFirstOfKind, type SpokenDetails } from "@/lib/voice-parse";

// Day / Month dropdowns + a typed 4-digit year — no invalid dates.
// Value and onChange use the ISO `yyyy-mm-dd` string the whole app already uses.

const MONTHS = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12",
];

function daysInMonth(year: number, month: number): number {
  if (!year || !month) return 31;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

const selectCls =
  "w-full rounded-xl bg-black/30 border border-white/10 px-2 py-2 text-sm text-pearl focus:outline-none focus:border-gold/50";


export function DateSelect({
  value,
  onChange,
  label = "Date",
  minYear = 1900,
  maxYear = new Date().getFullYear() + 5,
}: {
  value: string;
  onChange: (iso: string) => void;
  label?: string;
  minYear?: number;
  maxYear?: number;
}) {
  const [ys, ms, ds] = (value || "").split("-");
  const year = Number(ys) || 0;
  const month = Number(ms) || 0;
  const day = Number(ds) || 0;

  const maxDay = daysInMonth(year, month);
  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  const emit = (y: number, m: number, d: number) => {
    if (!y || !m || !d) {
      onChange("");
      return;
    }
    const clamped = Math.min(d, daysInMonth(y, m));
    onChange(
      `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(clamped).padStart(2, "0")}`,
    );
  };

  const boxRef = useRef<HTMLDivElement>(null);

  // The year is typed, so it keeps its own draft text until 4 digits are in.
  const [yearText, setYearText] = useState(ys && year ? String(year) : "");
  useEffect(() => {
    setYearText(year ? String(year) : "");
  }, [year]);

  const commitYear = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    setYearText(digits);
    if (digits.length < 4) return;
    let y = Number(digits);
    if (y < minYear) y = minYear;
    if (y > maxYear) y = maxYear;
    setYearText(String(y));
    emit(y, month, day);
  };

  // Voice: when someone speaks a date, the first date box on the page takes it.
  useEffect(() => {
    const onFill = (e: Event) => {
      const d = (e as CustomEvent<SpokenDetails>).detail;
      if (!d?.date) return;
      if (!isFirstOfKind(boxRef.current, "[data-voice-date]")) return;
      onChange(d.date);
    };
    window.addEventListener(VOICE_FILL_EVENT, onFill);
    return () => window.removeEventListener(VOICE_FILL_EVENT, onFill);
  }, [onChange]);

  return (
    <div ref={boxRef} data-voice-date className="block">
      {label !== "" && (
        <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          {label} (DD / MM / YYYY)
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <select
          aria-label="Day"
          className={selectCls}
          value={day || ""}
          onChange={(e) => emit(year, month, Number(e.target.value))}
        >
          <option value="">DD</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {String(d).padStart(2, "0")}
            </option>
          ))}
        </select>
        <select
          aria-label="Month"
          className={selectCls}
          value={month || ""}
          onChange={(e) => emit(year, Number(e.target.value), day)}
        >
          <option value="">MM</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          aria-label="Year"
          className={selectCls}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="YYYY"
          list="taromaya-year-list"
          value={yearText}
          onChange={(e) => commitYear(e.target.value)}
          onBlur={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (digits.length === 4) commitYear(digits);
            else setYearText(year ? String(year) : "");
          }}

        />
        <datalist id="taromaya-year-list">
          {years.map((y) => (
            <option key={y} value={y} />
          ))}
        </datalist>
      </div>
    </div>
  );
}

