import { createFileRoute } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { User } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — TAROMAYA" }] }),
});

function ProfilePage() {
  return (
    <PageShell eyebrow="Profile" title="Your cosmic identity" subtitle="Manage your birth details, preferences, and subscription.">
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full grid place-items-center bg-gradient-to-br from-gold/30 to-galaxy/25 gold-border">
              <User className="h-7 w-7 text-gold" />
            </div>
            <div>
              <div className="font-display text-xl text-pearl">Guest Seeker</div>
              <div className="text-xs text-muted-foreground">Sign in to save your journey</div>
            </div>
          </div>
          <button className="mt-5 w-full rounded-full bg-gradient-to-r from-gold to-gold-soft py-2.5 text-sm font-medium text-primary-foreground">
            Sign in
          </button>
        </GlassCard>
        <GlassCard title="Birth details" desc="Used for accurate charts and readings.">
          <div className="text-sm text-muted-foreground">Not set</div>
        </GlassCard>
        <GlassCard title="Subscription" desc="Unlock unlimited AI readings and reports.">
          <div className="font-display text-lg gold-text">Free plan</div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
