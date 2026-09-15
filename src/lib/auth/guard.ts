import { getSessionUser, type SessionUser } from "./session";
import { jsonError } from "@/lib/http/responses";

export type { SessionUser };

export async function requireSession(): Promise<SessionUser | null> {
  return getSessionUser();
}

export function unauthorized() {
  return jsonError("Authentication required.", 401);
}
