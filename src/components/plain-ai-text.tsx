import { parsePlainLines } from "@/lib/ai-format";

/**
 * Renders AI output as clean, symbol-free ELI10 text with picture-emoji
 * section headings. No markdown is ever shown to the user.
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
  const lines = parsePlainLines(text);
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
    </div>
  );
}
