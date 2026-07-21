
-- 1) Comp the existing test user and admins so they skip the paywall
UPDATE public.profiles
SET is_comped = true
WHERE lower(email) IN (
  'test@taromaya.app',
  'testuser@taromaya.app',
  'tarotbyriaa@gmail.com',
  'taromayaexperts@gmail.com'
);

-- 2) Ensure admins have terms auto-accepted (they bypass the paywall via role too)
UPDATE public.profiles
SET terms_accepted_at = COALESCE(terms_accepted_at, now())
WHERE lower(email) IN ('tarotbyriaa@gmail.com','taromayaexperts@gmail.com');

-- 3) Auto-comp all admin-created @taromaya.app staff/test accounts on signup
CREATE OR REPLACE FUNCTION public.auto_comp_taromaya_staff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND lower(NEW.email) LIKE '%@taromaya.app' THEN
    NEW.is_comped := true;
    NEW.terms_accepted_at := COALESCE(NEW.terms_accepted_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_comp_taromaya_staff_trg ON public.profiles;
CREATE TRIGGER auto_comp_taromaya_staff_trg
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_comp_taromaya_staff();
