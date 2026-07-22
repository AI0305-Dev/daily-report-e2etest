import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { successResponse, errorResponse } from "@/lib/api/response";
import { toErrorCode } from "@/lib/api/errors";
import { updateUserSchema } from "@/lib/schemas/user";
import { Session } from "next-auth";

export const GET = withAuth(
  async (_req: NextRequest, _session: Session, params?: Record<string, string>) => {
    const id = params?.id;
    if (!id) return errorResponse("E003", 404);

    const user = await prisma.user.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAdmin: true,
        manager: { select: { id: true, name: true } },
      },
    });

    if (!user) return errorResponse("E003", 404);

    return successResponse(user);
  },
  { role: "ADMIN" }
);

export const PUT = withAuth(
  async (req: NextRequest, session: Session, params?: Record<string, string>) => {
    const id = params?.id;
    if (!id) return errorResponse("E003", 404);

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { isDeleted: true },
    });

    if (!existing || existing.isDeleted) return errorResponse("E003", 404);

    const body: unknown = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      const code = toErrorCode(parsed.error.issues[0]?.message);
      return errorResponse(code ?? "E000", 400);
    }

    const { name, role, isAdmin, managerId } = parsed.data;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        role,
        isAdmin,
        managerId: role === "MANAGER" ? null : (managerId ?? null),
        lastUpdateId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAdmin: true,
        manager: { select: { id: true, name: true } },
      },
    });

    return successResponse(user);
  },
  { role: "ADMIN" }
);

export const DELETE = withAuth(
  async (_req: NextRequest, session: Session, params?: Record<string, string>) => {
    const id = params?.id;
    if (!id) return errorResponse("E003", 404);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { isDeleted: true, role: true },
    });

    if (!user) return errorResponse("E003", 404);
    if (user.isDeleted) return errorResponse("E508", 400);
    if (id === session.user.id) return errorResponse("E510", 400);

    if (user.role === "MANAGER") {
      const managerCount = await prisma.user.count({
        where: { role: "MANAGER", isDeleted: false },
      });
      if (managerCount <= 1) return errorResponse("E511", 400);
    }

    await prisma.user.update({
      where: { id },
      data: { isDeleted: true, lastUpdateId: session.user.id },
    });

    return successResponse({ id });
  },
  { role: "ADMIN" }
);
