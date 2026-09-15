import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession, unauthorized } from "@/lib/auth/guard";
import { isSameOrigin } from "@/lib/http/origin";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/http/responses";
import {
  announcementSchema,
  fieldErrorsFromZod,
} from "@/lib/validation/schemas";

// GET /api/announcements — the feed, newest first, with author attribution.
export async function GET() {
  const user = await requireSession();
  if (!user) return unauthorized();

  const announcements = await db.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
    take: 50,
  });

  return jsonOk({
    items: announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      author: announcement.author.name,
      createdAt: announcement.createdAt,
    })),
  });
}

// POST /api/announcements — create one. Auth required; body validated with the
// same shared schema the client form uses.
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonError("Cross-origin requests are not allowed.", 403);
  }

  const user = await requireSession();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return jsonValidationError(fieldErrorsFromZod(parsed.error));
  }

  const announcement = await db.announcement.create({
    data: { ...parsed.data, authorId: user.id },
    include: { author: { select: { name: true } } },
  });

  return jsonOk(
    {
      item: {
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        author: announcement.author.name,
        createdAt: announcement.createdAt,
      },
    },
    201,
  );
}
