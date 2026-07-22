import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { successResponse, errorResponse } from "@/lib/api/response";
import { Session } from "next-auth";

export const POST = withAuth(
  async (_req: NextRequest, session: Session, params?: Record<string, string>) => {
    const id = params?.id;
    if (!id) return errorResponse("E003", 404);

    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: { user: { select: { managerId: true } } },
    });

    if (!report) return errorResponse("E003", 404);

    if (report.user.managerId !== session.user.id) {
      return errorResponse("E302", 403);
    }

    if (report.status !== "SUBMITTED") {
      return errorResponse("E301", 400);
    }

    const updated = await prisma.dailyReport.update({
      where: { id },
      data: { status: "COMPLETED", lastUpdateId: session.user.id },
      select: { id: true, status: true },
    });

    return successResponse(updated);
  },
  { role: "MANAGER" }
);
