import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { successResponse, errorResponse } from "@/lib/api/response";
import { toErrorCode } from "@/lib/api/errors";
import { updateCustomerSchema } from "@/lib/schemas/customer";
import { Session } from "next-auth";

export const GET = withAuth(
  async (_req: NextRequest, _session: Session, params?: Record<string, string>) => {
    const id = params?.id;
    if (!id) return errorResponse("E003", 404);

    const customer = await prisma.customer.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, name: true, address: true, note: true },
    });

    if (!customer) return errorResponse("E003", 404);

    return successResponse(customer);
  },
  { role: "ADMIN" }
);

export const PUT = withAuth(
  async (req: NextRequest, session: Session, params?: Record<string, string>) => {
    const id = params?.id;
    if (!id) return errorResponse("E003", 404);

    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { isDeleted: true },
    });

    if (!customer) return errorResponse("E003", 404);
    if (customer.isDeleted) return errorResponse("E003", 404);

    const body: unknown = await req.json();
    const parsed = updateCustomerSchema.safeParse(body);

    if (!parsed.success) {
      const code = toErrorCode(parsed.error.issues[0]?.message);
      return errorResponse(code ?? "E000", 400);
    }

    const { name, address, note } = parsed.data;

    const updated = await prisma.customer.update({
      where: { id },
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

    return successResponse(updated);
  },
  { role: "ADMIN" }
);

export const DELETE = withAuth(
  async (_req: NextRequest, session: Session, params?: Record<string, string>) => {
    const id = params?.id;
    if (!id) return errorResponse("E003", 404);

    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { isDeleted: true },
    });

    if (!customer) return errorResponse("E003", 404);
    if (customer.isDeleted) return errorResponse("E405", 400);

    await prisma.customer.update({
      where: { id },
      data: {
        isDeleted: true,
        lastUpdateId: session.user.id,
      },
    });

    return successResponse({ id });
  },
  { role: "ADMIN" }
);
