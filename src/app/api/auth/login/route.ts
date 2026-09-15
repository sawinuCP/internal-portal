import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rateLimit";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/http/responses";
import { isSameOrigin } from "@/lib/http/origin";
import { fieldErrorsFromZod, loginSchema } from "@/lib/validation/schemas";

// unknown emails compare against this too, so timing can't reveal who exists
const DUMMY_PASSWORD_HASH = "$2b$12$NtJojgtq..T6gTUPi/59OOOqxlFbE/yJSqvvgx4VdF6h3iqEXwmAW";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonError("Cross-origin requests are not allowed.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(fieldErrorsFromZod(parsed.error));
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isRateLimited(`${ip}:${parsed.data.email}`)) {
    return jsonError("Too many attempts. Please try again in a minute.", 429);
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // same message for wrong email and wrong password — no enumeration
  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user ? user.passwordHash : DUMMY_PASSWORD_HASH,
  );
  if (!user || !passwordMatches) {
    return jsonError("Invalid email or password.", 401);
  }

  // sweep expired sessions while we're here
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  await createSession(user.id, request.headers.get("user-agent"));

  return jsonOk({ user: { id: user.id, name: user.name, email: user.email } });
}
