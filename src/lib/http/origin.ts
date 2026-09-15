// csrf backup for the SameSite=Lax cookie: html forms can't send json, and
// browsers attach an Origin header to cross-site requests — check both.
// no Origin header (curl, server-to-server calls) is allowed through.
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
