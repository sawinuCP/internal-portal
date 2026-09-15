import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = {
  title: "Sign up",
};

export default async function SignupPage() {
  // already have an account and a session? no need to sign up
  const user = await getSessionUser();
  if (user) redirect("/announcements");

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
            Create an account to join the portal.
          </p>
        </div>

        <SignupForm />
      </div>
    </div>
  );
}
