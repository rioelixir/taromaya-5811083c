
CREATE TABLE public.pdf_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('kundli','report')),
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pdf_downloads TO authenticated;
GRANT ALL ON public.pdf_downloads TO service_role;
ALTER TABLE public.pdf_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own downloads" ON public.pdf_downloads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own downloads" ON public.pdf_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX pdf_downloads_user_kind_created_idx
  ON public.pdf_downloads (user_id, kind, created_at DESC);
