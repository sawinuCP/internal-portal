"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { fieldErrorsFromZod, registerSchema } from "@/lib/validation/schemas";

export function SignupForm() {
  const router = useRouter();
  const hydrated = useHydrated();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = registerSchema.safeParse({ email, password, confirmPassword });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }
    setFieldErrors({});
    setPending(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: { message?: string; fields?: Record<string, string> };
        } | null;
        if (data?.error?.fields) setFieldErrors(data.error.fields);
        setFormError(data?.error?.message ?? "Could not create the account. Please try again.");
        return;
      }

      // account created — sign in happens through the normal login flow
      router.replace("/login?registered=1");
    } catch {
      setFormError("Could not create the account. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {formError && <Alert tone="error">{formError}</Alert>}

      <FormField label="Email" htmlFor="signup-email" error={fieldErrors.email}>
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          invalid={Boolean(fieldErrors.email)}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@team.dev"
          autoFocus
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="signup-password"
        error={fieldErrors.password}
        hint="At least 8 characters."
      >
        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          invalid={Boolean(fieldErrors.password)}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />
      </FormField>

      <FormField
        label="Verify password"
        htmlFor="signup-confirm"
        error={fieldErrors.confirmPassword}
      >
        <Input
          id="signup-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          invalid={Boolean(fieldErrors.confirmPassword)}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="••••••••"
        />
      </FormField>

      <Button type="submit" loading={pending} disabled={!hydrated} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
