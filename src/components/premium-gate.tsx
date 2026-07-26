import type { ReactNode } from "react";

// Subscription removed — app is free for everyone.
export function PremiumGate({ children }: { featureName?: string; children: ReactNode }) {
  return <>{children}</>;
}
