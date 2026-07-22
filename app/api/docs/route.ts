import { NextResponse } from "next/server";
import { generateOpenApiDocument } from "@/lib/openapi/generate";

export function GET() {
  const document = generateOpenApiDocument();
  return NextResponse.json(document);
}
