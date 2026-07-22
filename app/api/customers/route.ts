import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { successResponse, errorResponse } from "@/lib/api/response";
import { toErrorCode } from "@/lib/api/errors";
import { customerQuerySchema } from "@/lib/schemas/query";
import { createCustomerSchema } from "@/lib/schemas/customer";
import { Session } from "next-auth";

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const parsed = customerQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return errorResponse("E000", 400);
  }

  const { name, page, limit } = parsed.data;

  const where = {
    isDeleted: false,
    ...(name ? { name: { contains: name } } : {}),
  };

  const [total, customers] = await prisma.$transaction([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, name: true, address: true, note: true },
    }),
  ]);

  return NextResponse.json({
    data: customers,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body: unknown = await req.json();
    const parsed = createCustomerSchema.safeParse(body);

    if (!parsed.success) {
      const code = toErrorCode(parsed.error.issues[0]?.message);
      return errorResponse(code ?? "E000", 400);
    }

    const { name, address, note } = parsed.data;

    const customer = await prisma.customer.create({
      data: {
        name,
        address: address ?? null,
        note: note ?? null,
        lastUpdateId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        address: true,
        note: true,
        lastUpdateId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(customer, 201);
  },
  { role: "ADMIN" }
);
