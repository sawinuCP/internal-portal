import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rateLimit";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/http/responses";
import { isSameOrigin } from "@/lib/http/origin";
import { fieldErrorsFromZod, loginSchema } from "@/lib/validation/schemas";

// bcrypt hash of a long random string that no real credential will match.
// Used below so that "unknown email" and "wrong password" take the same
// amount of work to reject.
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

  // One generic message for unknown email and wrong password alike, so this
  // endpoint cannot be used to enumerate which accounts exist — and because
  // both failure paths run exactly one bcrypt compare, response timing cannot
  // reveal whether an email is registered.
  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user ? user.passwordHash : DUMMY_PASSWORD_HASH,
  );
  if (!user || !passwordMatches) {
    return jsonError("Invalid email or password.", 401);
  }

  // Housekeeping: clear expired sessions while we're here, so the table
  // doesn't grow forever (each session is also rejected lazily on lookup).
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  await createSession(user.id, request.headers.get("user-agent"));

  return jsonOk({ user: { id: user.id, name: user.name, email: user.email } });
}
