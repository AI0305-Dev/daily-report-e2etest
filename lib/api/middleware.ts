import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Session } from "next-auth";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "./response";

type Permission = Role | "ADMIN";

type Handler = (
  req: NextRequest,
  session: Session,
  params?: Record<string, string>
) => Promise<NextResponse>;

export function withAuth(handler: Handler, options?: { role?: Permission }) {
  return async (req: NextRequest, context?: { params?: Promise<Record<string, string>> }) => {
    const session = await auth();

    if (!session?.user) {
      return errorResponse("E001", 401);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isDeleted: true },
    });

    if (!dbUser || dbUser.isDeleted) {
      return errorResponse("E001", 401);
    }

    if (options?.role) {
      const { role } = options;
      const user = session.user;

      if (role === "ADMIN" && !user.isAdmin) {
        return errorResponse("E002", 403);
      }
      if (role === "SALES" && user.role !== "SALES") {
        return errorResponse("E002", 403);
      }
      if (role === "MANAGER" && user.role !== "MANAGER") {
        return errorResponse("E002", 403);
      }
    }

    const params = context?.params ? await context.params : undefined;
    return handler(req, session, params);
  };
}
