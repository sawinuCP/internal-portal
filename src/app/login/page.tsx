import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Log in",
};

// only internal paths — no open redirects
function safeNextPath(raw: string | undefined): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/announcements";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/announcements");

  const { next } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white"
          >
            P
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Team Portal
          </h1>
          <p className="text-sm text-slate-600">
            Sign in to see team announcements.
          </p>
        </div>

        <LoginForm nextPath={safeNextPath(next)} />

        <p className="mt-4 text-center text-xs text-slate-500">
          Accounts are provisioned by the team — contact an admin if you need
          access.
        </p>
      </div>
    </div>
  );
}
