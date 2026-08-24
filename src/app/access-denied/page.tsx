import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

function dashboardForRole(role: string) {
  if (role === "ADMIN") return "/admin/orders";
  if (role === "AGENT") return "/agent";
  return "/orders";
}

export default async function AccessDeniedPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const dashboardHref = dashboardForRole(session.user.role);

  return (
    <section className="mx-auto grid max-w-xl gap-4">
      <div className="panel">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-red-700">Access Denied</p>
        <h1 className="mt-3 text-2xl font-semibold">You do not have access to this area.</h1>
        <p className="mt-2 text-sm text-muted">
          You are signed in as {session.user.role}. Use the dashboard for your role or sign in with an account that has access.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="button" href={dashboardHref}>
            Go to my dashboard
          </Link>
          <Link className="button secondary" href="/login">
            Switch account
          </Link>
        </div>
      </div>
    </section>
  );
}
