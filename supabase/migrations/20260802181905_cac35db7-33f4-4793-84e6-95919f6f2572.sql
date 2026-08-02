CREATE TABLE public.loshu_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT,
  notes TEXT,
  is_favourite BOOLEAN NOT NULL DEFAULT false,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.loshu_reports TO authenticated;
GRANT ALL ON public.loshu_reports TO service_role;

ALTER TABLE public.loshu_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own lo shu reports" ON public.loshu_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create their own lo shu reports" ON public.loshu_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own lo shu reports" ON public.loshu_reports
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own lo shu reports" ON public.loshu_reports
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX loshu_reports_user_created_idx ON public.loshu_reports (user_id, created_at DESC);

CREATE TRIGGER loshu_reports_touch_updated_at
  BEFORE UPDATE ON public.loshu_reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();