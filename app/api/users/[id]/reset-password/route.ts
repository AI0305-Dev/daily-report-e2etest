import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { successResponse, errorResponse } from "@/lib/api/response";
import { generateInitialPassword } from "@/lib/utils/password";
import { Session } from "next-auth";

export const POST = withAuth(
  async (_req: NextRequest, session: Session, params?: Record<string, string>) => {
    const id = params?.id;
    if (!id) return errorResponse("E003", 404);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { isDeleted: true },
    });

    if (!user || user.isDeleted) return errorResponse("E003", 404);

    const initialPassword = generateInitialPassword();
    const passwordHash = await hash(initialPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { password: passwordHash, lastUpdateId: session.user.id },
    });

    return successResponse({ initialPassword });
  },
  { role: "ADMIN" }
);
