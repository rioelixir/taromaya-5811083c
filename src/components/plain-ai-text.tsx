import { parsePlainLines } from "@/lib/ai-format";
import { qualityGate } from "@/lib/report-quality";

/**
 * Renders AI output as clean, symbol-free professional text with picture-emoji
 * section headings. Every reading passes the final quality gate first, so no
 * markdown, assistant boilerplate or absolute-certainty claim reaches the user.
 */
export function PlainAIText({
  text,
  label,
  busy,
}: {
  text: string;
  label?: string;
  busy?: boolean;
}) {
  const gate = qualityGate(text);
  const lines = parsePlainLines(gate.text);
  return (
    <div
      data-no-translate
      aria-live="polite"
      aria-busy={busy}
      aria-label={label}
      className="space-y-2 text-foreground leading-relaxed"
    >
      {lines.map((l, i) =>
        l.kind === "heading" ? (
          <h3 key={i} className="mt-4 font-display text-lg text-primary first:mt-0">
            {l.text}
          </h3>
        ) : l.kind === "bullet" ? (
          <p key={i} className="flex gap-2 pl-1 text-sm sm:text-base">
            <span aria-hidden="true" className="text-primary">
              •
            </span>
            <span>{l.text}</span>
          </p>
        ) : (
          <p key={i} className="text-sm sm:text-base">
            {l.text}
          </p>
        ),
      )}

      {gate.confidence === "sensitive" && (
        <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          This reading looks incomplete. Please add the missing birth details and generate it again.
        </p>
      )}
    </div>
  );
}
