import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { Check } from "lucide-react";
import { LANGUAGE_LIST, setLang, useLang, type Lang } from "@/lib/i18n";

const groups = [
  { title: "Notifications", items: ["Daily horoscope", "Muhurat alerts", "Transit alerts"] },
  { title: "Privacy", items: ["Data export", "Delete account"] },
  { title: "About", items: ["Help center", "About TAROMAYA", "Terms & Privacy"] },
];

function LanguageCard() {
  const lang = useLang();
  return (
    <GlassCard title="Language">
      <p className="mb-3 text-xs text-muted-foreground">
        The whole app and every reading appear in the language you pick here.
      </p>
      <div className="space-y-2" data-no-translate>
        {LANGUAGE_LIST.map((l) => {
          const active = l.code === lang;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code as Lang)}
              className={[
                "flex w-full min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors",
                active
                  ? "border-gold/50 bg-gold/10 text-pearl"
                  : "border-white/10 text-muted-foreground hover:bg-white/5",
              ].join(" ")}
            >
              <span>{l.label}</span>
              {active && <Check className="h-4 w-4 text-gold" />}
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

export const Route = createFileRoute("/settings")({
  component: () => (
    <PageShell hideAI hideVoice eyebrow="Settings" title="Preferences" subtitle="Tune TAROMAYA to feel like yours.">
      <div className="grid gap-4 md:grid-cols-2">
        <LanguageCard />
        {groups.map((g) => (
          <GlassCard key={g.title} title={g.title}>
            <ul className="divide-y divide-white/5">
              {g.items.map((i) => (
                <li key={i} className="py-3 flex items-center justify-between">
                  <span className="text-sm text-pearl">{i}</span>
                  <span className="text-xs text-muted-foreground">›</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </PageShell>
  ),
  head: () => ({
    meta: [
      { title: "Settings — TAROMAYA" },
      { name: "description", content: "Choose your language and tune your TAROMAYA preferences." },
      { property: "og:title", content: "Settings — TAROMAYA" },
      { property: "og:description", content: "Choose English, Hindi or Hinglish for the whole app." },
    ],
  }),
});
