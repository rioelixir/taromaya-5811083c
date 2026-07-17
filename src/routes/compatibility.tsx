import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";

export const Route = createFileRoute("/compatibility")({
  component: CompatibilityPage,
  head: () => ({ meta: [{ title: "Compatibility — TAROMAYA" }] }),
});

function CompatibilityPage() {
  return (
    <PageShell
      eyebrow="Compatibility"
      title="Two souls, one sky"
      subtitle="Guna Milan, synastry, and numerology match — with an AI-written relationship reading."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard title="Person A" desc="First person's birth details.">
          <PersonForm />
        </GlassCard>
        <GlassCard title="Person B" desc="Second person's birth details.">
          <PersonForm />
        </GlassCard>
      </div>
      <button className="mt-6 w-full sm:w-auto rounded-full bg-gradient-to-r from-gold to-gold-soft px-8 py-3 text-sm font-medium text-primary-foreground">
        Calculate compatibility
      </button>
    </PageShell>
  );
}

function PersonForm() {
  return (
    <div className="space-y-3">
      {["Name", "Date of birth", "Time of birth", "Place of birth"].map((l) => (
        <label key={l} className="block">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</span>
          <input className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50" />
        </label>
      ))}
    </div>
  );
}
