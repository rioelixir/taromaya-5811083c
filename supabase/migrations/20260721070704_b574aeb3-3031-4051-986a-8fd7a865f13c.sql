-- Add is_comped flag for admin-created free-access users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_comped boolean NOT NULL DEFAULT false;

-- Update is_premium to honor comped users
CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND is_comped = true)
    OR EXISTS (
      SELECT 1 FROM public.user_subscriptions
      WHERE user_id = _user_id
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > now())
    )
$function$;