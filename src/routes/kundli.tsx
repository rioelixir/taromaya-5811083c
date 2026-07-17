import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";

export const Route = createFileRoute("/kundli")({
  component: KundliPage,
  head: () => ({ meta: [{ title: "Kundli — TAROMAYA" }] }),
});

function KundliPage() {
  return (
    <PageShell
      eyebrow="Kundli"
      title="Your birth chart"
      subtitle="Generate an accurate Vedic birth chart with planetary positions, houses, and life predictions."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard title="Create new kundli" desc="Enter birth details to generate your chart.">
          <form className="mt-2 space-y-3">
            <Input label="Full name" placeholder="Your name" />
            <Input label="Date of birth" type="date" />
            <Input label="Time of birth" type="time" />
            <Input label="Place of birth" placeholder="City, Country" />
            <button
              type="button"
              className="mt-3 w-full rounded-full bg-gradient-to-r from-gold to-gold-soft py-2.5 text-sm font-medium text-primary-foreground"
            >
              Generate Kundli
            </button>
          </form>
        </GlassCard>
        <GlassCard title="Saved kundlis" desc="Your recent charts appear here.">
          <div className="mt-4 grid place-items-center py-10 text-sm text-muted-foreground">
            No saved kundlis yet.
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-pearl outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
      />
    </label>
  );
}
