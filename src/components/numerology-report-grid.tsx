const CELLS: number[] = [4, 9, 2, 3, 5, 7, 8, 1, 6];

export default function NumerologyReportGrid({
  counts, missing, summary,
}: { counts: Record<number, number>; missing: number[]; summary: string }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 max-w-xs">
        {CELLS.map((n) => {
          const c = counts[n] ?? 0;
          return (
            <div
              key={n}
              className={`aspect-square rounded-xl grid place-items-center border ${
                c === 0 ? "border-red-400/30 bg-red-500/5" : "gold-border bg-gold/10"
              }`}
            >
              <div className="text-center">
                <div className="font-display text-lg text-pearl">{c === 0 ? "—" : String(n).repeat(Math.min(c, 4))}</div>
                <div className="text-[10px] text-muted-foreground">{n}</div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{summary}</p>
      <p className="text-xs text-muted-foreground">
        Missing: {missing.length ? missing.join(", ") : "nothing — a full grid"}
      </p>
    </div>
  );
}
