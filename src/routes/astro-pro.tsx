import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/astro-pro")({
  component: () => <Outlet />,
});
