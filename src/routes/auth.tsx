import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { StarField } from "@/components/star-field";
import { Sparkles, Loader2, Mail } from "lucide-react";
import { useAppLogo } from "@/hooks/use-app-logo";
import { queueAuthorsNote } from "@/components/authors-note-modal";

function AuthLogo() {
  const logo = useAppLogo();
  return (
    <div className="relative mx-auto mb-6 h-32 w-32 sm:h-40 sm:w-40">
      {/* Outer aurora ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/30 via-galaxy/20 to-transparent blur-xl animate-pulse" />
      {/* Rotating star ring */}
      <div className="absolute inset-0 rounded-full gold-border animate-[spin_40s_linear_infinite]">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/80 shadow-[0_0_6px_var(--gold,#d4af37)]"
            style={{
              transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-${
                62
              }px)`,
            }}
          />
        ))}
      </div>
      {/* Inner circle with logo */}
      <div className="absolute inset-3 rounded-full overflow-hidden gold-border bg-cosmic/60 backdrop-blur-xl grid place-items-center">
        {logo ? (
          <img src={logo} alt="Logo" className="h-full w-full object-cover" />
        ) : (
          <Sparkles className="h-10 w-10 text-gold" />
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — TAROMAYA" }] }),
});

async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !!data;
}

async function markTermsAccepted(userId: string) {
  await supabase
    .from("profiles")
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq("id", userId);
}

async function routeAfterAuth(navigate: ReturnType<typeof useNavigate>) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  if (await checkIsAdmin(user.id)) {
    navigate({ to: "/" });
    return;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("terms_accepted_at")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.terms_accepted_at) navigate({ to: "/" });
  else navigate({ to: "/accept-terms" });
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) routeAfterAuth(navigate);
    });
  }, [navigate]);

  const onEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (mode === "signup" && !agree) {
      setErr("Please read and agree to the Terms & Conditions to continue.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name, terms_accepted: true },
          },
        });
        if (error) throw error;
        // If session immediately available (auto-confirm on), mark terms accepted.
        if (data.session?.user) {
          await markTermsAccepted(data.session.user.id);
          setMsg("Welcome! You're successfully registered.");
          navigate({ to: "/" });
          return;
        }
        setMsg("Account created. Check your email to confirm, then sign in.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await routeAfterAuth(navigate);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const needsAgreement = mode === "signup";

  const onGoogle = async () => {
    setErr(null);
    if (needsAgreement && !agree) {
      setErr("Please agree to the Terms & Conditions before continuing with Google.");
      return;
    }
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });
    if (res.error) setErr(res.error.message);
    else if (!res.redirected) await routeAfterAuth(navigate);
  };

  return (
    <div className="relative min-h-dvh grid place-items-center px-4 py-16 overflow-hidden">
      <StarField />
      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <AuthLogo />
          <div className="font-display text-2xl sm:text-3xl tracking-[0.35em] gold-text">TAROMAYA</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Cosmic Intelligence</div>
        </div>

        <div className="glass rounded-3xl p-8">
          <h1 className="font-display text-3xl gold-text text-center">
            {mode === "signin" ? "Welcome back" : "Begin your journey"}
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {mode === "signin"
              ? "Enter the sanctuary."
              : "The stars are waiting to know you."}
          </p>

          <form onSubmit={onEmail} className="mt-6 space-y-3">
            {mode === "signup" && (
              <input
                required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={inputCls}
              />
            )}
            <input
              required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputCls}
            />
            <input
              required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              minLength={6}
              className={inputCls}
            />

            {needsAgreement && (
              <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[color:var(--gold,#d4af37)]"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I have read and agree to the{" "}
                  <Link to="/terms" className="text-gold hover:underline" target="_blank">
                    Terms & Conditions
                  </Link>
                  .
                </span>
              </label>
            )}

            {err && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</div>}
            {msg && <div className="text-xs text-aurora bg-aurora/10 border border-aurora/20 rounded-lg px-3 py-2">{msg}</div>}

            <button
              disabled={loading || (needsAgreement && !agree)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            onClick={onGoogle}
            disabled={needsAgreement && !agree}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-pearl hover:bg-white/10 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already a member?"}{" "}
            <button
              type="button"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); setMsg(null); }}
              className="text-gold hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.46-1.75 4.3-5.5 4.3-3.31 0-6-2.74-6-6.13S8.69 6.14 12 6.14c1.88 0 3.15.8 3.88 1.5l2.64-2.55C16.9 3.6 14.66 2.6 12 2.6 6.98 2.6 2.9 6.68 2.9 12s4.08 9.4 9.1 9.4c5.26 0 8.75-3.69 8.75-8.9 0-.6-.07-1.06-.15-1.5H12z"/>
    </svg>
  );
}
