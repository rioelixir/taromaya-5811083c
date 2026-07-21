import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { User, Crown, LogOut, MapPin, Calendar, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — TAROMAYA" }] }),
});

type ProfileData = {
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  subscription: {
    status: string | null;
    plan: string | null;
    expiresAt: string | null;
  } | null;
  birth: {
    fullName: string | null;
    date: string | null;
    time: string | null;
    place: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
};

function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }
      const [{ data: profile }, { data: role }, { data: sub }, { data: birth }] = await Promise.all([
        supabase.from("profiles").select("email, display_name, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
        supabase.from("user_subscriptions").select("status, plan_id, expires_at").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_birth_profile").select("full_name, birth_date, birth_time, place, latitude, longitude").eq("user_id", user.id).maybeSingle(),
      ]);
      if (!mounted) return;
      setData({
        email: profile?.email ?? user.email ?? null,
        displayName: profile?.display_name ?? user.user_metadata?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
        isAdmin: !!role,
        subscription: sub ? { status: sub.status, plan: sub.plan_id, expiresAt: sub.expires_at } : null,
        birth: birth ? {
          fullName: birth.full_name,
          date: birth.birth_date,
          time: birth.birth_time,
          place: birth.place,
          latitude: birth.latitude,
          longitude: birth.longitude,
        } : null,
      });
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  };

  if (loading) {
    return (
      <PageShell hideAI eyebrow="Profile" title="Your cosmic identity">
        <div className="text-sm text-muted-foreground">Loading your details…</div>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell hideAI eyebrow="Profile" title="Your cosmic identity">
        <GlassCard>
          <p className="text-sm text-muted-foreground">You are not signed in.</p>
          <Link to="/auth" className="mt-4 inline-flex rounded-full bg-gradient-to-r from-gold to-gold-soft px-5 py-2 text-sm font-medium text-cosmic">
            Sign in
          </Link>
        </GlassCard>
      </PageShell>
    );
  }

  const subActive = data.subscription?.status === "active" &&
    (!data.subscription.expiresAt || new Date(data.subscription.expiresAt) > new Date());
  const isPremium = data.isAdmin || subActive;

  return (
    <PageShell hideAI eyebrow="Profile" title="Your cosmic identity" subtitle="Manage your birth details, subscription and preferences.">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Identity */}
        <GlassCard>
          <div className="flex items-center gap-4">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover gold-border" />
            ) : (
              <div className="h-16 w-16 rounded-full grid place-items-center bg-gradient-to-br from-gold/30 to-galaxy/25 gold-border">
                <User className="h-7 w-7 text-gold" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-display text-xl text-pearl truncate">
                {data.displayName || data.email?.split("@")[0] || "Seeker"}
              </div>
              <div className="text-xs text-muted-foreground truncate">{data.email}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {data.isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </span>
                )}
                {isPremium && !data.isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                    <Crown className="h-3 w-3" /> Premium
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/15 py-2.5 text-sm text-pearl hover:bg-white/[0.05]"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </GlassCard>

        {/* Birth */}
        <div data-tour="birth-details">
        <GlassCard title="Birth details" desc="Used for accurate charts and readings.">
          {data.birth?.date ? (
            <div className="space-y-2 text-sm">
              {data.birth.fullName && (
                <div className="flex items-center gap-2 text-pearl">
                  <User className="h-3.5 w-3.5 text-gold/70" /> {data.birth.fullName}
                </div>
              )}
              <div className="flex items-center gap-2 text-pearl">
                <Calendar className="h-3.5 w-3.5 text-gold/70" /> {data.birth.date}
                {data.birth.time ? ` · ${data.birth.time}` : ""}
              </div>
              {data.birth.place && (
                <div className="flex items-center gap-2 text-pearl">
                  <MapPin className="h-3.5 w-3.5 text-gold/70" /> {data.birth.place}
                </div>
              )}
              <Link to="/birth-details" className="mt-3 inline-flex items-center gap-1 text-xs text-gold hover:underline">
                Update details <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div>
              <div className="text-sm text-muted-foreground">Not set yet.</div>
              <Link to="/birth-details" className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold/10 gold-border px-4 py-2 text-xs text-gold hover:bg-gold/20">
                Add birth details <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </GlassCard>
        </div>

        {/* Subscription */}
        <GlassCard title="Subscription" desc="This app is fully subscription-based.">
          {data.isAdmin ? (
            <>
              <div className="font-display text-lg gold-text">Admin — unlimited access</div>
              <div className="mt-1 text-xs text-muted-foreground">All features unlocked.</div>
            </>
          ) : isPremium ? (
            <>
              <div className="font-display text-lg gold-text capitalize">
                {data.subscription?.plan || "Premium"} · Active
              </div>
              {data.subscription?.expiresAt && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Renews / expires on {new Date(data.subscription.expiresAt).toLocaleDateString()}
                </div>
              )}
              <Link to="/pricing" className="mt-3 inline-flex items-center gap-1 text-xs text-gold hover:underline">
                Manage plan <ArrowRight className="h-3 w-3" />
              </Link>
            </>
          ) : (
            <>
              <div className="font-display text-lg text-pearl">No active plan</div>
              <div className="mt-1 text-xs text-muted-foreground">
                A subscription is required to use TAROMAYA.
              </div>
              <Link
                to="/pricing"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft px-5 py-2 text-sm font-medium text-cosmic"
              >
                <Sparkles className="h-4 w-4" /> Choose a plan
              </Link>
            </>
          )}
        </GlassCard>
      </div>

      {data.isAdmin && (
        <div className="mt-6">
          <GlassCard title="Admin controls" desc="You have full access to the Cosmic Control Room.">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full gold-border bg-gold/10 px-5 py-2 text-sm text-gold hover:bg-gold/20"
            >
              <ShieldCheck className="h-4 w-4" /> Open admin panel
            </Link>
          </GlassCard>
        </div>
      )}
    </PageShell>
  );
}
