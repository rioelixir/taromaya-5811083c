-- Extend saved_kundlis with full calculation config
ALTER TABLE public.saved_kundlis
  ADD COLUMN IF NOT EXISTS chart_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS engine_version text NOT NULL DEFAULT 'astronomy-engine@2.x',
  ADD COLUMN IF NOT EXISTS ayanamsa text NOT NULL DEFAULT 'lahiri',
  ADD COLUMN IF NOT EXISTS house_system text NOT NULL DEFAULT 'placidus',
  ADD COLUMN IF NOT EXISTS node_type text NOT NULL DEFAULT 'true',
  ADD COLUMN IF NOT EXISTS birth_seconds smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS elevation_m numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unknown_time boolean NOT NULL DEFAULT false;

-- Cache computed chart payloads keyed by (chart_id, engine_version, config_hash)
CREATE TABLE IF NOT EXISTS public.chart_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chart_id uuid REFERENCES public.saved_kundlis(id) ON DELETE CASCADE,
  config_hash text NOT NULL,
  engine_version text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, chart_id, engine_version, config_hash)
);

CREATE INDEX IF NOT EXISTS chart_calculations_user_idx ON public.chart_calculations (user_id);
CREATE INDEX IF NOT EXISTS chart_calculations_lookup_idx
  ON public.chart_calculations (chart_id, engine_version, config_hash);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chart_calculations TO authenticated;
GRANT ALL ON public.chart_calculations TO service_role;

ALTER TABLE public.chart_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own chart calculations"
  ON public.chart_calculations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin-only reference chart library for accuracy regression testing
CREATE TABLE IF NOT EXISTS public.accuracy_reference_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  birth_input jsonb NOT NULL,
  chart_config jsonb NOT NULL,
  expected jsonb NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.accuracy_reference_charts TO authenticated;
GRANT ALL ON public.accuracy_reference_charts TO service_role;

ALTER TABLE public.accuracy_reference_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read reference charts"
  ON public.accuracy_reference_charts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins manage reference charts"
  ON public.accuracy_reference_charts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER accuracy_reference_charts_touch_updated
  BEFORE UPDATE ON public.accuracy_reference_charts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();