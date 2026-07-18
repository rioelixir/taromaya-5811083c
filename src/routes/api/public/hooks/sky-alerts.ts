import { createFileRoute } from "@tanstack/react-router";
import { computeDueAlerts, type AlertPrefs } from "@/lib/sky-alerts-engine";

// Cron-triggered scanner: iterates enabled preferences, sends email alerts,
// and records dispatches to prevent duplicates.
export const Route = createFileRoute("/api/public/hooks/sky-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth: require Supabase anon apikey header OR local dev bypass
        const auth = request.headers.get("apikey") || request.headers.get("authorization") || "";
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY || "";
        if (!auth || (expected && !auth.includes(expected))) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: prefsRows, error } = await supabaseAdmin
          .from("sky_alert_preferences")
          .select("*")
          .eq("enabled", true);
        if (error) return json({ ok: false, error: error.message }, 500);

        let scanned = 0, dispatched = 0, skipped = 0, failed = 0;
        const now = new Date();

        for (const row of prefsRows ?? []) {
          scanned++;
          if (row.channel !== "email" || !row.email) { skipped++; continue; }
          const prefs: AlertPrefs = {
            timezone: row.timezone || "UTC",
            alert_new_moon: !!row.alert_new_moon,
            alert_full_moon: !!row.alert_full_moon,
            alert_retrograde: !!row.alert_retrograde,
            alert_ingress: !!row.alert_ingress,
            ingress_planets: row.ingress_planets ?? [],
            lead_hours: row.lead_hours ?? 24,
          };
          let events;
          try { events = computeDueAlerts(prefs, now); }
          catch (e) { console.error("compute failed", e); failed++; continue; }
          if (events.length === 0) continue;

          // filter already-dispatched
          const keys = events.map((e) => e.key);
          const { data: sent } = await supabaseAdmin
            .from("sky_alert_dispatch")
            .select("event_key")
            .eq("user_id", row.user_id)
            .in("event_key", keys);
          const already = new Set((sent ?? []).map((s) => s.event_key));
          const fresh = events.filter((e) => !already.has(e.key));
          if (fresh.length === 0) continue;

          try {
            await sendAlertEmail(row.email, fresh);
            const inserts = fresh.map((e) => ({
              user_id: row.user_id,
              event_key: e.key,
              event_time: e.when.toISOString(),
              channel: "email",
              status: "sent",
            }));
            await supabaseAdmin.from("sky_alert_dispatch").insert(inserts);
            dispatched += fresh.length;
          } catch (e) {
            console.error("send failed", e);
            failed++;
          }
        }

        return json({ ok: true, scanned, dispatched, skipped, failed });
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "content-type": "application/json" },
  });
}

async function sendAlertEmail(
  to: string,
  events: Array<{ title: string; body: string; kind: string }>,
) {
  const { sendLovableEmail, EmailAPIError } = await import("@lovable.dev/email-js");

  const items = events.map(
    (e) => `
      <div style="padding:16px;border:1px solid #2a1f3f;border-radius:14px;margin:12px 0;background:#0d0a1e;">
        <div style="font-size:12px;letter-spacing:2px;color:#c9a35a;text-transform:uppercase;">${escape(e.kind.replace("_", " "))}</div>
        <div style="font-size:18px;color:#f5f0e0;margin-top:4px;font-family:Georgia,serif;">${escape(e.title)}</div>
        <div style="font-size:13px;color:#b7b3c9;margin-top:6px;line-height:1.5;">${escape(e.body)}</div>
      </div>`,
  ).join("");

  const html = `
    <div style="background:#050510;padding:32px;font-family:Helvetica,Arial,sans-serif;color:#e8ecff;">
      <div style="max-width:560px;margin:0 auto;">
        <div style="text-align:center;font-size:22px;letter-spacing:6px;color:#c9a35a;font-family:Georgia,serif;">TAROMAYA</div>
        <div style="text-align:center;font-size:11px;letter-spacing:3px;color:#8a8399;margin-top:4px;">LIVE SKY ALERT</div>
        <h1 style="font-size:24px;color:#f5f0e0;margin-top:24px;font-family:Georgia,serif;font-weight:400;">The heavens are shifting.</h1>
        ${items}
        <div style="margin-top:24px;font-size:11px;color:#6f6a82;text-align:center;">
          You are receiving this because Live Sky alerts are enabled in your Taromaya preferences.
        </div>
      </div>
    </div>`;

  try {
    await sendLovableEmail({
      to,
      subject: events.length === 1 ? events[0].title : `${events.length} sky events approaching`,
      html,
    });
  } catch (e) {
    if (e instanceof EmailAPIError) {
      console.error(`[sky-alerts] email error ${e.code}: ${e.message}`);
    }
    throw e;
  }
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
