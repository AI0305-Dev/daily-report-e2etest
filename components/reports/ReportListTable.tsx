"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/reports/StatusBadge";
import { formatDate } from "@/lib/utils/date";

type ReportRow = {
  id: string;
  date: string;
  status: "DRAFT" | "SUBMITTED" | "REJECTED" | "COMPLETED";
  user: {
    id: string;
    name: string;
  };
};

type ReportListTableProps = {
  reports: ReportRow[];
  showUser?: boolean;
  basePath: string;
};

export function ReportListTable({ reports, showUser = false, basePath }: ReportListTableProps) {
  const router = useRouter();

  if (reports.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">日報がありません</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">日付</th>
            {showUser && (
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">営業氏名</th>
            )}
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">ステータス</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {reports.map((report) => (
            <tr
              key={report.id}
              className="hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => router.push(`${basePath}/${report.id}`)}
            >
              <td className="px-4 py-3">{formatDate(report.date)}</td>
              {showUser && <td className="px-4 py-3">{report.user.name}</td>}
              <td className="px-4 py-3">
                <StatusBadge status={report.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">›</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
