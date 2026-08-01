import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StarField } from "@/components/star-field";
import { Sparkles, Loader2, Check } from "lucide-react";

export const Route = createFileRoute("/accept-terms")({
  component: AcceptTerms,
  head: () => ({ meta: [{ title: "Accept Terms — TAROMAYA" }] }),
});

function AcceptTerms() {
  const navigate = useNavigate();
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/auth" });
        return;
      }
      try {
        const status = await termsStatus();
        if (status.satisfied) {
          navigate({ to: "/" });
          return;
        }
      } catch {
        // fall through and show the terms
      }

      setChecking(false);
    })();
  }, [navigate]);

  const onAccept = async () => {
    if (!agree) return;
    setLoading(true);
    setErr(null);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ terms_accepted_at: new Date().toISOString() })
        .eq("id", data.user.id);
      if (error) throw error;
      navigate({ to: "/" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onDecline = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (checking) {
    return (
      <div className="relative min-h-dvh grid place-items-center">
        <StarField />
        <Loader2 className="h-6 w-6 animate-spin text-gold relative z-10" />
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh grid place-items-center px-4 py-16 overflow-hidden">
      <StarField />
      <div className="relative z-10 w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-full gold-border grid place-items-center">
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          <div className="font-display text-2xl tracking-widest gold-text">TAROMAYA</div>
        </div>

        <div className="glass rounded-3xl p-8">
          <h1 className="font-display text-3xl gold-text text-center">One last step</h1>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            To complete your registration, please review and agree to our Terms & Conditions.
          </p>

          <Link
            to="/terms"
            target="_blank"
            className="mt-6 block rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-pearl hover:bg-white/5"
          >
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Read the full document</div>
            <div className="mt-1 font-display text-lg text-gold">Terms & Conditions →</div>
          </Link>

          <label className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[color:var(--gold,#d4af37)]"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I have read and agree to the TAROMAYA Terms & Conditions.
            </span>
          </label>

          {err && (
            <div className="mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {err}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onAccept}
              disabled={!agree || loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Agree & Continue
            </button>
            <button
              onClick={onDecline}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm text-muted-foreground hover:text-pearl"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
