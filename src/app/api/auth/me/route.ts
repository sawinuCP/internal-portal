import { requireSession, unauthorized } from "@/lib/auth/guard";
import { jsonOk } from "@/lib/http/responses";

export async function GET() {
  const user = await requireSession();
  if (!user) return unauthorized();

  return jsonOk({ user });
}
