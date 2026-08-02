import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/vedic-numerology")({
  component: () => <Outlet />,
});
