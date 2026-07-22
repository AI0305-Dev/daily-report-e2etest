import Link from "next/link";
import { Suspense } from "react";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportListContent } from "@/components/reports/ReportListContent";

type SearchParams = {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">日報一覧</h1>
        <Link
          href="/reports/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + 日報を作成
        </Link>
      </div>

      <Suspense fallback={null}>
        <ReportFilters />
      </Suspense>

      <Suspense
        fallback={<div className="text-center py-12 text-muted-foreground">読み込み中...</div>}
      >
        <ReportListContent searchParams={params} basePath="/reports" showUser={false} />
      </Suspense>
    </div>
  );
}
