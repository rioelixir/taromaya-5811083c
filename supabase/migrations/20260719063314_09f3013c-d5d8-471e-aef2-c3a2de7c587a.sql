
-- ============ TAROT DECKS ============
CREATE TABLE public.tarot_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT,
  tagline TEXT,
  description TEXT,
  author TEXT,
  publisher TEXT,
  category TEXT,
  language TEXT DEFAULT 'en',
  difficulty TEXT,
  accent TEXT DEFAULT '#c9a94a',
  glyph TEXT,
  card_back_url TEXT,
  cover_url TEXT,
  thumbnail_url TEXT,
  guidebook_pdf_url TEXT,
  keywords TEXT[] DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarot_decks TO authenticated;
GRANT ALL ON public.tarot_decks TO service_role;

ALTER TABLE public.tarot_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read active decks"
  ON public.tarot_decks FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage decks"
  ON public.tarot_decks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tarot_decks_updated_at
  BEFORE UPDATE ON public.tarot_decks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ TAROT CARDS ============
CREATE TABLE public.tarot_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.tarot_decks(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  arcana TEXT,
  suit TEXT,
  number TEXT,
  element TEXT,
  planet TEXT,
  zodiac TEXT,
  chakra TEXT,
  crystal TEXT,
  color TEXT,
  keywords TEXT[] DEFAULT '{}',
  meaning_upright TEXT,
  meaning_reversed TEXT,
  advice TEXT,
  love TEXT,
  career TEXT,
  finance TEXT,
  health TEXT,
  spiritual TEXT,
  timing TEXT,
  affirmation TEXT,
  journal_prompt TEXT,
  meditation TEXT,
  front_image_url TEXT,
  back_image_url TEXT,
  audio_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX tarot_cards_deck_idx ON public.tarot_cards(deck_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarot_cards TO authenticated;
GRANT ALL ON public.tarot_cards TO service_role;

ALTER TABLE public.tarot_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read active cards"
  ON public.tarot_cards FOR SELECT TO authenticated
  USING (
    is_active OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins manage cards"
  ON public.tarot_cards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tarot_cards_updated_at
  BEFORE UPDATE ON public.tarot_cards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ AI PROMPTS ============
CREATE TABLE public.ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL DEFAULT '',
  user_template TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT 'google/gemini-3.1-flash-lite',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7,
  max_output_tokens INT,
  language TEXT DEFAULT 'en',
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_prompts TO authenticated;
GRANT ALL ON public.ai_prompts TO service_role;

ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read active prompts"
  ON public.ai_prompts FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage prompts"
  ON public.ai_prompts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ai_prompts_updated_at
  BEFORE UPDATE ON public.ai_prompts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ AI PROMPT VERSIONS ============
CREATE TABLE public.ai_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.ai_prompts(id) ON DELETE CASCADE,
  version INT NOT NULL,
  system_prompt TEXT NOT NULL,
  user_template TEXT NOT NULL,
  model TEXT NOT NULL,
  temperature NUMERIC(3,2) NOT NULL,
  saved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_prompt_versions_prompt_idx ON public.ai_prompt_versions(prompt_id, version DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_prompt_versions TO authenticated;
GRANT ALL ON public.ai_prompt_versions TO service_role;

ALTER TABLE public.ai_prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read prompt versions"
  ON public.ai_prompt_versions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins write prompt versions"
  ON public.ai_prompt_versions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed the default tarot AI prompt so the app has something to read
INSERT INTO public.ai_prompts (key, label, description, system_prompt, user_template, model, temperature)
VALUES (
  'tarot.reading',
  'Tarot reading interpreter',
  'Used by the Tarot module to interpret a drawn spread. Available placeholders: {{spread}}, {{question}}, {{cards}}.',
  'You are TAROMAYA, a warm, poetic, deeply insightful tarot reader. Blend classical Rider-Waite-Smith symbolism with modern, grounded advice. Voice: intimate, elegant, never generic. Never moralise. Never predict harm. Speak directly to the querent as "you". Use clean markdown.',
  'Spread: {{spread}}
Question: {{question}}
Cards drawn:
{{cards}}',
  'openai/gpt-5.5',
  0.7
)
ON CONFLICT (key) DO NOTHING;
