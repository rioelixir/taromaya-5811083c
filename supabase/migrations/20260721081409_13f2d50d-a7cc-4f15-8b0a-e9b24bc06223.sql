-- 1. Coupon redemptions: stop trusting client-supplied values.
DROP POLICY IF EXISTS "users insert own redemption" ON public.coupon_redemptions;
REVOKE INSERT ON public.coupon_redemptions FROM authenticated;

CREATE OR REPLACE FUNCTION public.redeem_coupon(_code text, _plan_id uuid)
RETURNS public.coupon_redemptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_coupon public.coupons%ROWTYPE;
  v_plan public.subscription_plans%ROWTYPE;
  v_amount_off integer := 0;
  v_row public.coupon_redemptions%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_coupon FROM public.coupons
   WHERE lower(code) = lower(_code) AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid coupon' USING ERRCODE = '22023';
  END IF;

  IF v_coupon.valid_from IS NOT NULL AND now() < v_coupon.valid_from THEN
    RAISE EXCEPTION 'Coupon not yet valid' USING ERRCODE = '22023';
  END IF;
  IF v_coupon.valid_until IS NOT NULL AND now() > v_coupon.valid_until THEN
    RAISE EXCEPTION 'Coupon expired' USING ERRCODE = '22023';
  END IF;
  IF v_coupon.max_redemptions IS NOT NULL
     AND v_coupon.times_redeemed >= v_coupon.max_redemptions THEN
    RAISE EXCEPTION 'Coupon fully redeemed' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.coupon_redemptions
     WHERE user_id = v_user AND coupon_id = v_coupon.id
  ) THEN
    RAISE EXCEPTION 'Coupon already redeemed by this user' USING ERRCODE = '22023';
  END IF;

  IF _plan_id IS NOT NULL THEN
    SELECT * INTO v_plan FROM public.subscription_plans WHERE id = _plan_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid plan' USING ERRCODE = '22023';
    END IF;
    IF v_coupon.discount_percent > 0 THEN
      v_amount_off := (COALESCE(v_plan.price_cents, 0) * v_coupon.discount_percent) / 100;
    ELSE
      v_amount_off := v_coupon.discount_amount_cents;
    END IF;
  ELSE
    v_amount_off := v_coupon.discount_amount_cents;
  END IF;

  INSERT INTO public.coupon_redemptions (user_id, coupon_id, plan_id, amount_off_cents)
  VALUES (v_user, v_coupon.id, _plan_id, GREATEST(0, v_amount_off))
  RETURNING * INTO v_row;

  UPDATE public.coupons
     SET times_redeemed = times_redeemed + 1, updated_at = now()
   WHERE id = v_coupon.id;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_coupon(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, uuid) TO authenticated;

-- 2. Deck visibility: enforce is_public for non-admins.
DROP POLICY IF EXISTS "Anyone signed in can read active decks" ON public.tarot_decks;
CREATE POLICY "Signed-in users read public active decks"
ON public.tarot_decks
FOR SELECT
TO authenticated
USING (
  (is_active = true AND is_public = true)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);