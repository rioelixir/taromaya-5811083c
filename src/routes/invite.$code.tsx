import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { StarField } from "@/components/star-field";
import { Sparkles, Loader2, Mail, Gift } from "lucide-react";
import { useAppLogo } from "@/hooks/use-app-logo";
import { previewStaffInvite, redeemStaffInvite } from "@/lib/invites.functions";

export const Route = createFileRoute("/invite/$code")({
  component: InvitePage,
  head: () => ({ meta: [{ title: "You're invited — TAROMAYA" }] }),
});

function InvitePage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const logo = useAppLogo();

  const [preview, setPreview] = useState<
    | { valid: true; note: string | null; remaining: number; expires_at: string | null }
    | { valid: false; reason: string }
    | null
  >(null);

  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    previewStaffInvite({ data: { code } })
      .then(setPreview)
      .catch(() => setPreview({ valid: false, reason: "Could not verify invite." }));
  }, [code]);

  const redeemAndGo = async () => {
    try {
      await redeemStaffInvite({ data: { code } });
      navigate({ to: "/" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to redeem invite.");
    }
  };

  // If already signed in, redeem immediately
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && preview && "valid" in preview && preview.valid) {
        redeemAndGo();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  const onEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (mode === "signup" && !agree) {
      setErr("Please agree to the Terms & Conditions to continue.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/invite/${code}`,
            data: { full_name: name, terms_accepted: true, invite_code: code },
          },
        });
        if (error) throw error;
        if (data.session?.user) {
          await redeemAndGo();
          return;
        }
        setMsg("Account created. Please check your email to confirm, then return to this invite link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await redeemAndGo();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setErr(null);
    if (mode === "signup" && !agree) {
      setErr("Please agree to the Terms & Conditions before continuing with Google.");
      return;
    }
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/invite/${code}`,
      extraParams: { prompt: "select_account" },
    });
    if (res.error) setErr(res.error.message);
    else if (!res.redirected) await redeemAndGo();
  };

  return (
    <div className="relative min-h-dvh grid place-items-center px-4 py-16 overflow-hidden">
      <StarField />
      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="relative h-24 w-24 rounded-full gold-border bg-cosmic/60 backdrop-blur-xl grid place-items-center overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <Sparkles className="h-9 w-9 text-gold" />
            )}
          </div>
          <div className="mt-4 font-display text-2xl tracking-[0.35em] gold-text">TAROMAYA</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Employee Invite</div>
        </div>

        {preview === null && (
          <div className="glass rounded-3xl p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying invite…
          </div>
        )}

        {preview && !preview.valid && (
          <div className="glass rounded-3xl p-8 text-center">
            <h1 className="font-display text-2xl gold-text">Invite unavailable</h1>
            <p className="mt-3 text-sm text-muted-foreground">{preview.reason}</p>
            <Link
              to="/auth"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-soft px-5 py-2 text-sm text-cosmic"
            >
              Go to sign in
            </Link>
          </div>
        )}

        {preview && preview.valid && (
          <div className="glass rounded-3xl p-8">
            <div className="flex items-center justify-center gap-2 rounded-full gold-border bg-gold/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-gold w-fit mx-auto">
              <Gift className="h-3.5 w-3.5" /> Free lifetime-tier access
            </div>
            <h1 className="mt-4 font-display text-3xl gold-text text-center">
              Welcome to the team
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {preview.note
                ? preview.note
                : "You've been invited to use TAROMAYA as a Taromaya team member — every module unlocked, on the house."}
            </p>

            <div className="mt-5 flex gap-2 rounded-full border border-white/10 bg-black/20 p-1">
              <button
                onClick={() => { setMode("signup"); setErr(null); setMsg(null); }}
                className={`flex-1 rounded-full px-4 py-1.5 text-xs ${mode === "signup" ? "bg-gradient-to-r from-gold to-gold-soft text-cosmic" : "text-muted-foreground"}`}
              >Create account</button>
              <button
                onClick={() => { setMode("signin"); setErr(null); setMsg(null); }}
                className={`flex-1 rounded-full px-4 py-1.5 text-xs ${mode === "signin" ? "bg-gradient-to-r from-gold to-gold-soft text-cosmic" : "text-muted-foreground"}`}
              >I already have an account</button>
            </div>

            <form onSubmit={onEmail} className="mt-5 space-y-3">
              {mode === "signup" && (
                <input
                  required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={inputCls}
                />
              )}
              <input
                required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Work email"
                className={inputCls}
              />
              <input
                required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                minLength={6}
                className={inputCls}
              />

              {mode === "signup" && (
                <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[color:var(--gold,#d4af37)]"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    I agree to the{" "}
                    <Link to="/terms" className="text-gold hover:underline" target="_blank">
                      Terms & Conditions
                    </Link>.
                  </span>
                </label>
              )}

              {err && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</div>}
              {msg && <div className="text-xs text-aurora bg-aurora/10 border border-aurora/20 rounded-lg px-3 py-2">{msg}</div>}

              <button
                disabled={loading || (mode === "signup" && !agree)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium py-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {mode === "signup" ? "Create account & unlock" : "Sign in & unlock"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              onClick={onGoogle}
              disabled={mode === "signup" && !agree}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-pearl hover:bg-white/10 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50";
