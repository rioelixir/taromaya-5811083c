import { createHmac, randomUUID } from "crypto";

/**
 * Server-only bridge to taromaya.com.
 *
 * The only question we ask that site is: "is this email logged in and working
 * right now?". We never trust anything the browser tells us, and if the site
 * cannot answer we say no. Security wins over convenience, always.
 */

export type WorkVerification = {
  /** True only when taromaya.com confirmed a live, unexpired work session. */
  active: boolean;
  /** Short machine-readable reason, used for audit logs only. */
  reason:
    | "verified"
    | "not_configured"
    | "no_email"
    | "not_working"
    | "unreachable"
    | "bad_response"
    | "rejected";
  /** When the remote session is expected to end, if the site tells us. */
  expiresAt: string | null;
};

const TIMEOUT_MS = 4000;

function fail(reason: WorkVerification["reason"]): WorkVerification {
  return { active: false, reason, expiresAt: null };
}

/**
 * Asks taromaya.com whether this work email has a live authenticated session.
 * The request is signed so the other side knows it really came from us, and it
 * carries a timestamp plus a one-time value so an old request cannot be replayed.
 */
export async function verifyWorkSession(
  email: string | null | undefined,
): Promise<WorkVerification> {
  const url = process.env["TAROMAYA_VERIFY_URL"];
  const secret = process.env["TAROMAYA_VERIFY_SECRET"];
  if (!url || !secret) return fail("not_configured");
  if (!url.startsWith("https://")) return fail("not_configured");

  const clean = (email ?? "").trim().toLowerCase();
  if (!clean || !clean.includes("@")) return fail("no_email");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomUUID();
  const body = JSON.stringify({ email: clean, timestamp, nonce });
  const signature = createHmac("sha256", secret).update(`${timestamp}.${nonce}.${body}`).digest("hex");

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-taromaya-timestamp": timestamp,
        "x-taromaya-nonce": nonce,
        "x-taromaya-signature": signature,
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return fail("unreachable");
  }

  if (res.status === 401 || res.status === 403) return fail("rejected");
  if (!res.ok) return fail("unreachable");

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return fail("bad_response");
  }

  const flat = (payload ?? {}) as Record<string, unknown>;
  const nested = (flat["session"] ?? {}) as Record<string, unknown>;
  const activeRaw = flat["active"] ?? flat["working"] ?? nested["active"];
  const active = activeRaw === true || activeRaw === "true" || activeRaw === 1;
  if (!active) return fail("not_working");

  // If the site tells us the email it verified, it must match what we asked about.
  const echoed = (flat["email"] ?? nested["email"]) as unknown;
  if (typeof echoed === "string" && echoed.trim().toLowerCase() !== clean) return fail("rejected");

  const expiresRaw = (flat["expires_at"] ?? flat["expiresAt"] ?? nested["expires_at"]) as unknown;
  let expiresAt: string | null = null;
  if (typeof expiresRaw === "string") {
    const when = new Date(expiresRaw);
    if (!Number.isNaN(when.getTime())) {
      if (when.getTime() <= Date.now()) return fail("not_working");
      expiresAt = when.toISOString();
    }
  }

  return { active: true, reason: "verified", expiresAt };
}
