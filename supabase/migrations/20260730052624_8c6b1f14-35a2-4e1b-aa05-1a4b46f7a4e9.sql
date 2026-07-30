CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
  END
$function$;

CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE
      public.has_role(_user_id, 'admin')
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND is_comped = true)
      OR EXISTS (
        SELECT 1 FROM public.user_subscriptions
        WHERE user_id = _user_id
          AND status = 'active'
          AND (expires_at IS NULL OR expires_at > now())
      )
  END
$function$;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_premium(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.redeem_coupon(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_premium(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, uuid) TO authenticated, service_role;