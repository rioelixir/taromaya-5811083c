
CREATE TABLE public.shared_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  birth_date date NOT NULL,
  birth_time time NOT NULL,
  tz_offset numeric NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  place text,
  kind text NOT NULL DEFAULT 'kundli',
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX shared_reports_user_idx ON public.shared_reports (user_id, created_at DESC);
CREATE INDEX shared_reports_token_idx ON public.shared_reports (token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_reports TO authenticated;
GRANT SELECT ON public.shared_reports TO anon;
GRANT ALL ON public.shared_reports TO service_role;

ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their shares"
  ON public.shared_reports FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read unexpired shares by token"
  ON public.shared_reports FOR SELECT
  TO anon, authenticated
  USING (expires_at IS NULL OR expires_at > now());
