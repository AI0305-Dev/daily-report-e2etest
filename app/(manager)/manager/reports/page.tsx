import { Suspense } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportListContent } from "@/components/reports/ReportListContent";

type SearchParams = {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  page?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function ManagerReportsPage({ searchParams }: Props) {
  const [params, session] = await Promise.all([searchParams, auth()]);

  const subordinates = session?.user?.id
    ? await prisma.user.findMany({
        where: { managerId: session.user.id, isDeleted: false },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">部下の日報一覧</h1>
      </div>

      <Suspense fallback={null}>
        <ReportFilters defaultStatus="SUBMITTED" excludeStatuses={["DRAFT"]} users={subordinates} />
      </Suspense>

      <Suspense
        fallback={<div className="text-center py-12 text-muted-foreground">読み込み中...</div>}
      >
        <ReportListContent
          searchParams={params}
          basePath="/manager/reports"
          showUser={true}
          defaultStatus="SUBMITTED"
        />
      </Suspense>
    </div>
  );
}
