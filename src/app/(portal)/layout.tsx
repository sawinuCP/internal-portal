import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/LogoutButton";

/**
 * Server-side gate for every portal page. Middleware only checks cookie
 * presence on the edge; THIS is the real verification — the session is
 * resolved against the database on every request, and invalid or expired
 * sessions are redirected to login.
 */
export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white"
            >
              P
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Team Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:block">{user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
