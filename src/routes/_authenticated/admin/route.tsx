import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "super_admin" || r.role === "admin");
    if (!isAdmin) throw redirect({ to: "/dashboard" });
    return { isAdmin };
  },
  component: Layout,
});

function Layout() {
  const { user } = Route.useRouteContext();
  return (
    <AdminShell email={user.email ?? ""}>
      <Outlet />
    </AdminShell>
  );
}