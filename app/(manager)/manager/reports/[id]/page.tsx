import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/reports/StatusBadge";
import { CommentBlock } from "@/components/reports/CommentBlock";
import { CommentForm } from "@/components/reports/CommentForm";
import { ApprovalActions } from "@/components/reports/ApprovalActions";
import { formatDate } from "@/lib/utils/date";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ManagerReportDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

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

  if (!report) notFound();
  if (report.user.managerId !== session.user.id) redirect("/manager/reports");

  const isSubmitted = report.status === "SUBMITTED";

  type ReportComment = NonNullable<typeof report>["comments"][number];
  const comments = report.comments.map((c: ReportComment) => ({
    id: c.id,
    targetField: c.targetField as "PROBLEM" | "PLAN" | "GENERAL",
    body: c.body,
    author: c.author,
    createdAt: c.createdAt.toISOString(),
  }));

  const generalComments = comments.filter((c) => c.targetField === "GENERAL");

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <Link
          href="/manager/reports"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 一覧に戻る
        </Link>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="font-medium">{report.user.name}</span>
          <span className="font-semibold text-lg">{formatDate(report.date.toISOString())}</span>
          <StatusBadge status={report.status as "DRAFT" | "SUBMITTED" | "REJECTED" | "COMPLETED"} />
        </div>
        {isSubmitted && <ApprovalActions reportId={id} backHref="/manager/reports" />}
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
          <CommentBlock comments={comments} targetField="PROBLEM" />
          {isSubmitted && <CommentForm reportId={id} targetField="PROBLEM" />}
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
          <CommentBlock comments={comments} targetField="PLAN" />
          {isSubmitted && <CommentForm reportId={id} targetField="PLAN" />}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-2 border-b">
          <h2 className="font-medium text-sm">全般コメント</h2>
        </div>
        <div className="px-4 py-3">
          {generalComments.length > 0 && <CommentBlock comments={comments} targetField="GENERAL" />}
          {isSubmitted && <CommentForm reportId={id} targetField="GENERAL" />}
          {!isSubmitted && generalComments.length === 0 && (
            <p className="text-sm text-muted-foreground">（なし）</p>
          )}
        </div>
      </div>
    </div>
  );
}
