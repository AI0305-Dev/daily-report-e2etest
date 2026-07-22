import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { successResponse, errorResponse } from "@/lib/api/response";
import { toErrorCode } from "@/lib/api/errors";
import { createUserSchema } from "@/lib/schemas/user";
import { userQuerySchema } from "@/lib/schemas/query";
import { generateInitialPassword } from "@/lib/utils/password";
import { Prisma } from "@prisma/client";
import { Session } from "next-auth";

export const GET = withAuth(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const parsed = userQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return errorResponse("E000", 400);
    }

    const { name, role, page, limit } = parsed.data;

    const where: Prisma.UserWhereInput = { isDeleted: false };
    if (name) where.name = { contains: name };
    if (role) where.role = role;

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isAdmin: true,
          manager: { select: { id: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  },
  { role: "ADMIN" }
);

export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body: unknown = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      const code = toErrorCode(parsed.error.issues[0]?.message);
      return errorResponse(code ?? "E000", 400);
    }

    const { name, email, role, isAdmin, managerId } = parsed.data;

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return errorResponse("E505", 400);
    }

    const initialPassword = generateInitialPassword();
    const passwordHash = await hash(initialPassword, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role,
        isAdmin,
        managerId: role === "MANAGER" ? null : (managerId ?? null),
        lastUpdateId: session.user.id,
      },
      select: { id: true, name: true, email: true, role: true, isAdmin: true },
    });

    return successResponse({ ...user, initialPassword }, 201);
  },
  { role: "ADMIN" }
);
