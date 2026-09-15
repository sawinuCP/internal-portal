import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { isSameOrigin } from "@/lib/http/origin";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/http/responses";
import { fieldErrorsFromZod, registerSchema } from "@/lib/validation/schemas";

// signup collects no name — derive a display name from the email instead
function displayNameFromEmail(email: string): string {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(fieldErrorsFromZod(parsed.error));
  }

  const { email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError("An account with this email already exists.", 409, {
      email: "Already registered — try signing in instead.",
    });
  }

  try {
    const user = await db.user.create({
      data: {
        name: displayNameFromEmail(email),
        email,
        passwordHash: await hashPassword(password),
      },
    });

    return jsonOk({ user: { id: user.id, name: user.name, email: user.email } }, 201);
  } catch (error) {
    // two simultaneous signups can slip past the check above — the unique
    // index is the real guarantee
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("An account with this email already exists.", 409, {
        email: "Already registered — try signing in instead.",
      });
    }
    throw error;
  }
}
