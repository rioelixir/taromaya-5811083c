import { Check, Loader2 } from "lucide-react";
import {
  useUniversalFields,
  type UniversalField,
  type UniversalValue,
} from "@/components/universal-input";

export type BirthOneBoxValue = UniversalValue;
export type OneBoxField = UniversalField;

/**
 * The details a module needs — with no mic and no text box of its own.
 * Everything is spoken or typed once into the single box at the top of the
 * page; this just shows what the app understood and what is still missing.
 */
export function BirthOneBox({
  value,
  onChange,
  need = ["name", "date", "time", "place"],
  onGenerate,
}: {
  value: BirthOneBoxValue;
  onChange: (patch: BirthOneBoxValue) => void;
  /** Kept for older callers; the one box at the top shows the heading now. */
  title?: string;
  subtitle?: string;
  example?: string;
  /** Which details this page actually needs. */
  need?: OneBoxField[];
  /** Run the module as soon as every detail is in. */
  onGenerate?: () => void;
}) {
  const { note, busy } = useUniversalFields({ need, value, onChange, onGenerate });

  const chips = [
    need.includes("name") && value.name ? { label: "Name", value: value.name } : null,
    need.includes("date") && value.date ? { label: "Date", value: prettyDate(value.date) } : null,
    need.includes("time") && value.time ? { label: "Time", value: value.time } : null,
    need.includes("place") && value.place ? { label: "Place", value: value.place } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  if (chips.length === 0 && !note && !busy) return null;

  return (
    <div className="space-y-2" data-no-voice>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200"
            >
              <Check className="h-3.5 w-3.5" /> {c.label}: {c.value}
            </span>
          ))}
        </div>
      )}
      {busy && (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Finding the place…
        </span>
      )}
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return `${d} ${months[m - 1]} ${y}`;
}
