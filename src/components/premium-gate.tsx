import type { ReactNode } from "react";

// Payments removed — every signed-in user has full access.
// This component is kept as a passthrough so existing route imports keep working.
export function PremiumGate({ children }: { featureName?: string; children: ReactNode }) {
  return <>{children}</>;
}
