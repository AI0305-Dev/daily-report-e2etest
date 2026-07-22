import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { successResponse, errorResponse } from "@/lib/api/response";
import { toErrorCode } from "@/lib/api/errors";
import { updateReportSchema } from "@/lib/schemas/report";
import { Session } from "next-auth";

function isAuthorized(
  reportUserId: string,
  reportUserManagerId: string | null,
  session: Session
): boolean {
  if (session.user.role === "SALES") {
    return reportUserId === session.user.id;
  }
  return reportUserManagerId === session.user.id;
}

export const GET = withAuth(
  async (_req: NextRequest, session: Session, params?: Record<string, string>) => {
    const id = params?.id;
    if (!id) return errorResponse("E003", 404);

    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, managerId: true } },
        visitRecords: {
          orderBy: { sortOrder: "asc" },
          include: { customer: { select: { id: true, name: true } } },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true } } },
        },
      },
    });

    if (!report) return errorResponse("E003", 404);

    if (!isAuthorized(report.userId, report.user.managerId, session)) {
      return errorResponse("E002", 403);
    }

    const { user, ...rest } = report;
    return successResponse({
      ...rest,
      user: { id: user.id, name: user.name },
    });
  }
);

export const PUT = withAuth(
  async (req: NextRequest, session: Session, params?: Record<string, string>) => {
    const id = params?.id;
    if (!id) return errorResponse("E003", 404);

    const report = await prisma.dailyReport.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, date: true },
    });

    if (!report) return errorResponse("E003", 404);
    if (report.userId !== session.user.id) return errorResponse("E002", 403);
    if (report.status !== "DRAFT" && report.status !== "REJECTED") {
      return errorResponse("E210", 400);
    }

    const body: unknown = await req.json();
    const parsed = updateReportSchema.safeParse(body);

    if (!parsed.success) {
      const code = toErrorCode(parsed.error.issues[0]?.message);
      return errorResponse(code ?? "E000", 400);
    }

    const { date, visitRecords, problem, plan, status } = parsed.data;
    const reportDate = new Date(date);

    const duplicate = await prisma.dailyReport.findUnique({
      where: { userId_date: { userId: session.user.id, date: reportDate } },
      select: { id: true },
    });

    if (duplicate && duplicate.id !== id) {
      return errorResponse("E202", 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.visitRecord.deleteMany({ where: { reportId: id } });

      if (visitRecords.length > 0) {
        await tx.visitRecord.createMany({
          data: visitRecords.map((vr) => ({
            reportId: id,
            customerId: vr.customerId,
            content: vr.content,
            sortOrder: vr.sortOrder,
            lastUpdateId: session.user.id,
          })),
        });
      }

      return tx.dailyReport.update({
        where: { id },
        data: {
          date: reportDate,
          problem: problem ?? null,
          plan: plan ?? null,
          status,
          lastUpdateId: session.user.id,
        },
        include: {
          visitRecords: {
            orderBy: { sortOrder: "asc" },
            include: { customer: { select: { id: true, name: true } } },
          },
        },
      });
    });

    return successResponse(updated);
  },
  { role: "SALES" }
);
