import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReportListTable } from "@/components/reports/ReportListTable";
import { PaginationWrapper } from "@/components/reports/PaginationWrapper";
import { ReportStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { daysAgoISOString, todayISOString } from "@/lib/utils/date";

type SearchParams = {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  page?: string;
};

type Props = {
  searchParams: SearchParams;
  basePath: string;
  showUser?: boolean;
  defaultStatus?: string;
};

const VALID_STATUSES = new Set(["DRAFT", "SUBMITTED", "REJECTED", "COMPLETED"]);

export async function ReportListContent({
  searchParams,
  basePath,
  showUser = false,
  defaultStatus,
}: Props) {
  const session = await auth();
  if (!session?.user) return null;

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const limit = 20;

  const rawStatus = searchParams.status ?? defaultStatus ?? "ALL";
  const status =
    rawStatus && rawStatus !== "ALL" && VALID_STATUSES.has(rawStatus)
      ? (rawStatus as ReportStatus)
      : undefined;

  const dateFrom = searchParams.dateFrom || daysAgoISOString(30);
  const dateTo = searchParams.dateTo || todayISOString();

  const where: Prisma.DailyReportWhereInput = {};

  if (session.user.role === "SALES") {
    where.userId = session.user.id;
    if (status) {
      where.status = status;
    }
  } else {
    where.user = { managerId: session.user.id };
    const userId =
      searchParams.userId && searchParams.userId !== "ALL" ? searchParams.userId : undefined;
    if (userId) where.userId = userId;
    where.status = status ?? { not: ReportStatus.DRAFT };
  }

  const dateFilter: Prisma.DateTimeFilter<"DailyReport"> = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }
  where.date = dateFilter;

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

  const totalPages = Math.ceil(total / limit);

  const rows = reports.map((r) => ({
    ...r,
    date: r.date.toISOString(),
    status: r.status as "DRAFT" | "SUBMITTED" | "REJECTED" | "COMPLETED",
  }));

  return (
    <div className="space-y-4">
      <ReportListTable reports={rows} showUser={showUser} basePath={basePath} />
      <PaginationWrapper page={page} totalPages={totalPages} />
    </div>
  );
}
