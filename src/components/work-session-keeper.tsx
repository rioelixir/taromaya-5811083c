import { useWorkSession } from "@/hooks/use-work-session";

/**
 * Invisible. Starts a work session for whoever is signed in and keeps it alive,
 * so employee access can turn itself on and off without anyone doing anything.
 */
export function WorkSessionKeeper() {
  useWorkSession();
  return null;
}
