import Link from "next/link";
import { StatusBadge } from "@/components/reports/StatusBadge";
import { CommentBlock } from "@/components/reports/CommentBlock";
import { formatDate } from "@/lib/utils/date";

type Comment = {
  id: string;
  targetField: "PROBLEM" | "PLAN" | "GENERAL";
  body: string;
  author: { id: string; name: string };
  createdAt: string;
};

type VisitRecord = {
  id: string;
  customer: { id: string; name: string };
  content: string;
  sortOrder: number;
};

type ReportDetailProps = {
  report: {
    id: string;
    date: string;
    status: "DRAFT" | "SUBMITTED" | "REJECTED" | "COMPLETED";
    user: { id: string; name: string };
    visitRecords: VisitRecord[];
    problem: string | null;
    plan: string | null;
    comments: Comment[];
  };
  backHref: string;
  showUser?: boolean;
  editHref?: string;
};

export function ReportDetail({ report, backHref, showUser = false, editHref }: ReportDetailProps) {
  const canEdit = report.status === "DRAFT" || report.status === "REJECTED";
  const generalComments = report.comments.filter((c) => c.targetField === "GENERAL");

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground">
          ← 一覧に戻る
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showUser && <span className="font-medium">{report.user.name}</span>}
          <span className="font-semibold text-lg">{formatDate(report.date)}</span>
          <StatusBadge status={report.status} />
        </div>
        {canEdit && editHref && (
          <Link
            href={editHref}
            className="inline-flex h-7 items-center justify-center rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            編集
          </Link>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-2 border-b">
          <h2 className="font-medium text-sm">訪問記録</h2>
        </div>
        <div className="divide-y">
          {report.visitRecords.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">訪問記録なし</p>
          ) : (
            report.visitRecords.map((vr) => (
              <div key={vr.id} className="px-4 py-3 flex gap-4 text-sm">
                <span className="font-medium min-w-32">{vr.customer.name}</span>
                <span className="text-muted-foreground">{vr.content}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-2 border-b">
          <h2 className="font-medium text-sm">Problem（課題・相談）</h2>
        </div>
        <div className="px-4 py-3">
          {report.problem ? (
            <p className="text-sm whitespace-pre-wrap">{report.problem}</p>
          ) : (
            <p className="text-sm text-muted-foreground">（なし）</p>
          )}
          <CommentBlock comments={report.comments} targetField="PROBLEM" />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-2 border-b">
          <h2 className="font-medium text-sm">Plan（明日やること）</h2>
        </div>
        <div className="px-4 py-3">
          {report.plan ? (
            <p className="text-sm whitespace-pre-wrap">{report.plan}</p>
          ) : (
            <p className="text-sm text-muted-foreground">（なし）</p>
          )}
          <CommentBlock comments={report.comments} targetField="PLAN" />
        </div>
      </div>

      {generalComments.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/30 px-4 py-2 border-b">
            <h2 className="font-medium text-sm">全般コメント</h2>
          </div>
          <div className="px-4 py-3">
            <CommentBlock comments={report.comments} targetField="GENERAL" />
          </div>
        </div>
      )}
    </div>
  );
}
