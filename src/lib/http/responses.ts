import { NextResponse } from "next/server";

type FieldErrors = Record<string, string>;

/** Success envelope: the payload as-is. */
export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Error envelope used by every endpoint: { error: { message, fields? } }. */
export function jsonError(message: string, status: number, fields?: FieldErrors) {
  return NextResponse.json(
    { error: { message, ...(fields ? { fields } : {}) } },
    { status },
  );
}

export function jsonValidationError(fields: FieldErrors) {
  return jsonError("Some fields are invalid.", 422, fields);
}
