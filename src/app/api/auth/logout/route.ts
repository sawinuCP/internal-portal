import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { jsonError } from "@/lib/http/responses";
import { isSameOrigin } from "@/lib/http/origin";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonError("Cross-origin requests are not allowed.", 403);
  }

  await destroySession();

  return new NextResponse(null, { status: 204 });
}
