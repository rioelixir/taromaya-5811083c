import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PageShell, GlassCard } from "@/components/page-shell";
import { User, LogOut, MapPin, Calendar, ShieldCheck, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkSession, closeWorkSession } from "@/hooks/use-work-session";

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
  const { status } = useWorkSession();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }
      const [{ data: profile }, { data: role }, { data: birth }] = await Promise.all([
        supabase.from("profiles").select("email, display_name, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
        supabase.from("user_birth_profile").select("full_name, birth_date, birth_time, place, latitude, longitude").eq("user_id", user.id).maybeSingle(),
      ]);
      if (!mounted) return;
      setData({
        email: profile?.email ?? user.email ?? null,
        displayName: profile?.display_name ?? user.user_metadata?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
        isAdmin: !!role,
        subscription: null,
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
    await closeWorkSession();
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

  return (
    <PageShell hideAI eyebrow="Profile" title="Your cosmic identity" subtitle="Manage your birth details and preferences.">
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

        {/* Access */}
        <GlassCard title="Access" desc="What you can open right now.">
          <div className="font-display text-lg gold-text">
            {data.isAdmin
              ? "Admin — unlimited access"
              : status?.employeeAccessActive
                ? "Employee Access Active"
                : status?.isPremium
                  ? "Full access unlocked"
                  : "Standard access"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {status?.employeeAccessActive
              ? "You are signed in for work, so everything is open and free. It ends by itself when you sign out."
              : status?.isEmployee
                ? "You are an employee. Everything unlocks while you are signed in and working."
                : "Every module you have is ready to use."}
          </div>
          {status?.employeeAccessActive && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Working session live
            </div>
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
