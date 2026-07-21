-- Tutorials for the "How to Use TAROMAYA" section (admin-managed)
CREATE TABLE public.tutorials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','hi','hi-roman')),
  video_url TEXT NOT NULL,
  captions_url TEXT,
  poster_url TEXT,
  duration_seconds INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (slug, language)
);
GRANT SELECT ON public.tutorials TO authenticated;
GRANT ALL ON public.tutorials TO service_role;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in can read published tutorials"
  ON public.tutorials FOR SELECT TO authenticated
  USING (published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage tutorials"
  ON public.tutorials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER tutorials_touch_updated_at
  BEFORE UPDATE ON public.tutorials FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Engine validation runs: deterministic reference-case results across engine versions.
CREATE TABLE public.engine_validation_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  engine_version TEXT NOT NULL,
  suite TEXT NOT NULL,
  passed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  drift JSONB NOT NULL DEFAULT '[]'::jsonb,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.engine_validation_runs TO authenticated;
GRANT ALL ON public.engine_validation_runs TO service_role;
ALTER TABLE public.engine_validation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read validation runs"
  ON public.engine_validation_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert validation runs"
  ON public.engine_validation_runs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND created_by = auth.uid());

-- Seed a first English tour so the page is not empty on first open.
INSERT INTO public.tutorials (slug, title, description, language, video_url, sort_order) VALUES
  ('welcome', 'Welcome to TAROMAYA', 'A 60-second overview of every module.', 'en', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 0),
  ('welcome', 'TAROMAYA में आपका स्वागत है', 'हर मॉड्यूल का 60 सेकंड परिचय।', 'hi', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 0);
