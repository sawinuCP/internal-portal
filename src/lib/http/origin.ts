/**
 * CSRF posture for mutating endpoints (defense in depth on top of the
 * SameSite=Lax session cookie):
 *  1. API routes only ever parse JSON bodies — plain HTML forms cannot send
 *     `application/json`, which defeats form-based CSRF outright.
 *  2. This helper rejects requests whose `Origin` header points at another
 *     site. Browsers attach `Origin` to cross-site requests, so a malicious
 *     page driving fetch() against a logged-in user gets rejected here.
 *
 * No `Origin` header (curl, same-origin server calls) is allowed through —
 * the browser is where the cookie-theft threat lives.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const host = request.headers.get("host");
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}
