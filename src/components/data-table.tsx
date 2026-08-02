import type { ReactNode } from "react";

export type Column<T> = {
  /** Column heading. */
  header: string;
  /** Cell renderer. */
  cell: (row: T, index: number) => ReactNode;
  /** Optional extra classes for this column's cells. */
  className?: string;
  /** Right-align numbers and dates. */
  align?: "left" | "right";
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  /** Row key. Falls back to the index. */
  rowKey?: (row: T, index: number) => string | number;
  /** Extra classes applied to a whole row, e.g. to highlight the active one. */
  rowClassName?: (row: T, index: number) => string;
  caption?: ReactNode;
  empty?: ReactNode;
  className?: string;
  /** Adds a scroll container with a max height. */
  maxHeight?: string;
};

/**
 * Shared table used for every list of records in the app, so readings,
 * positions, periods and remedies are always presented as a proper table
 * with headings rather than as loose cards or bullet lines.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowClassName,
  caption,
  empty = "No records.",
  className = "",
  maxHeight,
}: Props<T>) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className="overflow-x-auto rounded-xl border border-border/40 bg-background/30"
        style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
      >
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-background/80 backdrop-blur">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.header}
                  scope="col"
                  className={`whitespace-nowrap border-b border-border/50 px-3 py-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground ${
                    c.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                className={`border-b border-border/20 last:border-0 align-top ${rowClassName?.(row, i) ?? ""}`}
              >
                {columns.map((c) => (
                  <td
                    key={c.header}
                    className={`px-3 py-2 ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}
                  >
                    {c.cell(row, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}

export default DataTable;
