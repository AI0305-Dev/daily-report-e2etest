import { NextResponse } from "next/server";
import { API_ERRORS, ErrorCode } from "./errors";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(code: ErrorCode, status: number) {
  return NextResponse.json({ error: { code, message: API_ERRORS[code] } }, { status });
}
