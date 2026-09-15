import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE } from "./constants";

export { SESSION_COOKIE };


const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// HttpOnly keeps the token invisible to JavaScript (XSS cannot steal it),
// SameSite=Lax blocks cross-site POSTs from riding on the session (CSRF),
// Secure restricts the cookie to HTTPS in production.
const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Only the SHA-256 hash of the token is persisted. The raw token lives in the
 * cookie alone, so a leaked database cannot be used to forge valid sessions.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates a DB-backed session and sets the session cookie on the response. */
export async function createSession(userId: string, userAgent?: string | null): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      userAgent: userAgent ?? null,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
}

/**
 * Resolves the current user from the session cookie, or null for missing,
 * unknown, or expired sessions. The DB record is the single source of truth —
 * nothing on the client is trusted, including the cookie's own expiry.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    // Lazy cleanup: an expired session is removed the moment it is encountered.
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  // Never expose the passwordHash to callers.
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}

/** Revokes the current session (if any) and clears the cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
}
