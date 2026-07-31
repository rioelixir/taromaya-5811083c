// Day / Month / Year dropdowns — no typing, no invalid dates.
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
  maxYear = new Date().getFullYear(),
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

  return (
    <div className="block">
      <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label} (DD / MM / YYYY)
      </div>
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
        <select
          aria-label="Year"
          className={selectCls}
          value={year || ""}
          onChange={(e) => emit(Number(e.target.value), month, day)}
        >
          <option value="">YYYY</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
