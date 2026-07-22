import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { successResponse, errorResponse } from "@/lib/api/response";
import { toErrorCode } from "@/lib/api/errors";
import { reportQuerySchema } from "@/lib/schemas/query";
import { createReportSchema } from "@/lib/schemas/report";
import { Prisma, ReportStatus } from "@prisma/client";
import { Session } from "next-auth";

export const GET = withAuth(async (req: NextRequest, session: Session) => {
  const { searchParams } = new URL(req.url);
  const parsed = reportQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return errorResponse("E000", 400);
  }

  const { status, dateFrom, dateTo, userId, page, limit } = parsed.data;

  const where: Prisma.DailyReportWhereInput = {};

  if (session.user.role === "SALES") {
    where.userId = session.user.id;
    if (status) {
      where.status = status as ReportStatus;
    }
  } else {
    where.user = { managerId: session.user.id };
    where.status =
      status && status !== ReportStatus.DRAFT
        ? (status as ReportStatus)
        : { not: ReportStatus.DRAFT };
    if (userId) {
      where.userId = userId;
    }
  }

  const dateFilter: Prisma.DateTimeFilter<"DailyReport"> = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) dateFilter.lte = new Date(dateTo);
  if (dateFrom || dateTo) where.date = dateFilter;

  const [total, reports] = await prisma.$transaction([
    prisma.dailyReport.count({ where }),
    prisma.dailyReport.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        date: true,
        status: true,
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    data: reports,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body: unknown = await req.json();
    const parsed = createReportSchema.safeParse(body);

    if (!parsed.success) {
      const code = toErrorCode(parsed.error.issues[0]?.message);
      return errorResponse(code ?? "E000", 400);
    }

    const { date, visitRecords, problem, plan, status } = parsed.data;
    const reportDate = new Date(date);

    const existing = await prisma.dailyReport.findUnique({
      where: { userId_date: { userId: session.user.id, date: reportDate } },
    });

    if (existing) {
      return errorResponse("E202", 400);
    }

    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.dailyReport.create({
        data: {
          userId: session.user.id,
          date: reportDate,
          problem: problem ?? null,
          plan: plan ?? null,
          status,
          lastUpdateId: session.user.id,
        },
      });

      if (visitRecords.length > 0) {
        await tx.visitRecord.createMany({
          data: visitRecords.map((vr) => ({
            reportId: created.id,
            customerId: vr.customerId,
            content: vr.content,
            sortOrder: vr.sortOrder,
            lastUpdateId: session.user.id,
          })),
        });
      }

      return tx.dailyReport.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          visitRecords: {
            orderBy: { sortOrder: "asc" },
            include: { customer: { select: { id: true, name: true } } },
          },
        },
      });
    });

    return successResponse(report, 201);
  },
  { role: "SALES" }
);
