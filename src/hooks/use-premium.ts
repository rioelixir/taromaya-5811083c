// Back-compat wrapper. Real access check lives in use-paywall.
import { useHasAccess } from "./use-paywall";
export function usePremium() {
  const { hasAccess, loading } = useHasAccess();
  return { isPremium: hasAccess, loading };
}
