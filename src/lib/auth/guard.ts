import { getSessionUser, type SessionUser } from "./session";
import { jsonError } from "@/lib/http/responses";

export type { SessionUser };

/**
 * Explicit guard for API route handlers:
 *
 *   const user = await requireSession();
 *   if (!user) return unauthorized();
 *
 * Every protected API endpoint calls this itself — pages being protected is
 * not enough, since APIs are reachable without the UI.
 */
export async function requireSession(): Promise<SessionUser | null> {
  return getSessionUser();
}

export function unauthorized() {
  return jsonError("Authentication required.", 401);
}
