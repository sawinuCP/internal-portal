import { NextResponse } from "next/server";

type FieldErrors = Record<string, string>;

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

// every error leaves as { error: { message, fields? } }
export function jsonError(message: string, status: number, fields?: FieldErrors) {
  return NextResponse.json(
    { error: { message, ...(fields ? { fields } : {}) } },
    { status },
  );
}

export function jsonValidationError(fields: FieldErrors) {
  return jsonError("Some fields are invalid.", 422, fields);
}
