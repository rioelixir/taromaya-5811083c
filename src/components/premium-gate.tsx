import type { ReactNode } from "react";
import { useState } from "react";
import { Loader2, Lock, Check, Copy } from "lucide-react";
import { usePaywallConfig, useHasAccess } from "@/hooks/use-paywall";
import { requestSubscription } from "@/lib/subscription.functions";

export function PremiumGate({ featureName, children }: { featureName?: string; children: ReactNode }) {
  const { config, loading: cfgLoading } = usePaywallConfig();
  const { hasAccess, loading: accessLoading, userId } = useHasAccess();

  if (cfgLoading || accessLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
      </div>
    );
  }

  // Gateway off → free for everyone
  if (!config.enabled) return <>{children}</>;
  // Admin / comped / active subscription → allow
  if (hasAccess) return <>{children}</>;
  // Must be signed in to pay
  if (!userId) {
    return (
      <PaywallCard config={config} featureName={featureName}>
        <p className="text-sm text-muted-foreground">Please sign in first to unlock access after payment.</p>
      </PaywallCard>
    );
  }

  return <PaywallCard config={config} featureName={featureName}><PaidNotice /></PaywallCard>;
}

function PaywallCard({
  config,
  featureName,
  children,
}: {
  config: ReturnType<typeof usePaywallConfig>["config"];
  featureName?: string;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const upiLink = config.upi_id
    ? `upi://pay?pa=${encodeURIComponent(config.upi_id)}&pn=${encodeURIComponent(config.payee_name || "TAROMAYA")}&am=${config.amount_inr}&cu=INR&tn=${encodeURIComponent(`Taromaya access${featureName ? " — " + featureName : ""}`)}`
    : null;

  const copy = async () => {
    if (!config.upi_id) return;
    await navigator.clipboard.writeText(config.upi_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-gold/30 bg-black/40 backdrop-blur-xl p-6 sm:p-8 text-pearl shadow-2xl">
      <div className="flex items-center gap-2 text-gold mb-4">
        <Lock className="h-5 w-5" />
        <span className="text-xs uppercase tracking-widest">Unlock {featureName ?? "Taromaya"}</span>
      </div>
      <h2 className="text-2xl font-serif mb-1">₹{config.amount_inr.toLocaleString("en-IN")} one-time access</h2>
      <p className="text-sm text-muted-foreground mb-6">{config.note}</p>

      {config.qr_url ? (
        <div className="flex justify-center mb-5">
          <img
            src={config.qr_url}
            alt="UPI QR code"
            className="w-56 h-56 object-contain rounded-2xl bg-white p-3 shadow-lg"
          />
        </div>
      ) : (
        <div className="mb-5 rounded-2xl border border-dashed border-white/15 p-6 text-center text-xs text-muted-foreground">
          QR code not configured yet. Please use the UPI ID below.
        </div>
      )}

      {config.upi_id && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex-1 text-sm font-mono truncate">{config.upi_id}</div>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/10"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      {upiLink && (
        <a
          href={upiLink}
          className="mb-4 block w-full text-center rounded-full bg-gold/20 border border-gold/40 text-gold px-5 py-2 text-sm hover:bg-gold/30"
        >
          Open UPI app to pay ₹{config.amount_inr.toLocaleString("en-IN")}
        </a>
      )}

      {children}
    </div>
  );
}

function PaidNotice() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "err">("idle");
  const [msg, setMsg] = useState("");

  const notify = async () => {
    setState("sending");
    try {
      await requestSubscription({ data: { notes: msg || "Paid via UPI/QR" } });
      setState("sent");
    } catch (e) {
      setState("err");
    }
  };

  if (state === "sent") {
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">
        Thank you! We've notified the admins. Access will unlock once payment is verified.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
      <div className="text-xs text-muted-foreground">Already paid? Let the admins know:</div>
      <input
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="UPI reference / transaction ID (optional)"
        className="w-full rounded-md bg-black/30 border border-white/10 px-3 py-2 text-sm"
      />
      <button
        disabled={state === "sending"}
        onClick={notify}
        className="w-full rounded-md bg-gold/20 border border-gold/40 text-gold px-3 py-2 text-sm hover:bg-gold/30 disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "I've paid — notify admin"}
      </button>
      {state === "err" && <div className="text-xs text-red-300">Could not submit. Please try again.</div>}
    </div>
  );
}
