
CREATE TABLE public.sky_alert_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'UTC',
  latitude double precision,
  longitude double precision,
  place text,
  alert_new_moon boolean NOT NULL DEFAULT true,
  alert_full_moon boolean NOT NULL DEFAULT true,
  alert_retrograde boolean NOT NULL DEFAULT true,
  alert_ingress boolean NOT NULL DEFAULT true,
  ingress_planets text[] NOT NULL DEFAULT ARRAY['Sun','Mercury','Venus','Mars','Jupiter','Saturn'],
  lead_hours integer NOT NULL DEFAULT 24,
  channel text NOT NULL DEFAULT 'email',
  email text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sky_alert_preferences TO authenticated;
GRANT ALL ON public.sky_alert_preferences TO service_role;

ALTER TABLE public.sky_alert_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sky prefs read" ON public.sky_alert_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own sky prefs write" ON public.sky_alert_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sky prefs update" ON public.sky_alert_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sky prefs delete" ON public.sky_alert_preferences
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER sky_alert_prefs_touch
  BEFORE UPDATE ON public.sky_alert_preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.sky_alert_dispatch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  event_time timestamptz NOT NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_key)
);

GRANT SELECT ON public.sky_alert_dispatch TO authenticated;
GRANT ALL ON public.sky_alert_dispatch TO service_role;

ALTER TABLE public.sky_alert_dispatch ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own dispatch read" ON public.sky_alert_dispatch
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX sky_dispatch_user_time_idx ON public.sky_alert_dispatch (user_id, event_time DESC);
