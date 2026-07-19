
CREATE TABLE public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL DEFAULT '',
  seo_title TEXT,
  seo_description TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_pages TO anon, authenticated;
GRANT ALL ON public.cms_pages TO service_role;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_pages public read published" ON public.cms_pages FOR SELECT USING (published = true);
CREATE POLICY "cms_pages admin read all" ON public.cms_pages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "cms_pages admin write" ON public.cms_pages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER cms_pages_updated_at BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.cms_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer_md TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_faqs TO anon, authenticated;
GRANT ALL ON public.cms_faqs TO service_role;
ALTER TABLE public.cms_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_faqs public read published" ON public.cms_faqs FOR SELECT USING (published = true);
CREATE POLICY "cms_faqs admin read all" ON public.cms_faqs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "cms_faqs admin write" ON public.cms_faqs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER cms_faqs_updated_at BEFORE UPDATE ON public.cms_faqs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.cms_blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body_md TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  author TEXT NOT NULL DEFAULT 'Taromaya',
  tags TEXT[] NOT NULL DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_blogs TO anon, authenticated;
GRANT ALL ON public.cms_blogs TO service_role;
ALTER TABLE public.cms_blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_blogs public read published" ON public.cms_blogs FOR SELECT USING (published = true);
CREATE POLICY "cms_blogs admin read all" ON public.cms_blogs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "cms_blogs admin write" ON public.cms_blogs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER cms_blogs_updated_at BEFORE UPDATE ON public.cms_blogs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed default legal pages so links resolve
INSERT INTO public.cms_pages (slug, title, body_md, seo_description, sort_order) VALUES
  ('about', 'About Taromaya', E'# About Taromaya\n\nTaromaya is a premium AI-powered Tarot & Astrology platform crafted by Riaa.\n\nEdit this page in the Admin → Content CMS panel.', 'About Taromaya — a premium AI tarot & astrology platform.', 1),
  ('privacy', 'Privacy Policy', E'# Privacy Policy\n\nYour birth details are private and visible only to you. Edit this policy in Admin → Content CMS.', 'Taromaya privacy policy.', 2),
  ('terms', 'Terms & Conditions', E'# Terms & Conditions\n\nBy using Taromaya you agree to our terms. Edit in Admin → Content CMS.', 'Taromaya terms and conditions.', 3),
  ('refund', 'Refund Policy', E'# Refund Policy\n\nSubscription refund terms. Edit in Admin → Content CMS.', 'Taromaya refund policy.', 4),
  ('contact', 'Contact Us', E'# Contact Us\n\nReach us at taromayaexperts@gmail.com.', 'Contact Taromaya support.', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_faqs (question, answer_md, category, sort_order) VALUES
  ('What is Taromaya?', 'Taromaya is a premium AI-powered tarot and Vedic astrology platform.', 'General', 1),
  ('Are my birth details private?', 'Yes. Your birth details are stored securely and visible only to you.', 'Privacy', 2),
  ('How many PDF reports can I download?', 'Users can download up to 10 PDF reports per month. Admins have unlimited access.', 'Subscription', 3)
ON CONFLICT DO NOTHING;
