import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ReportDetail } from "@/components/reports/ReportDetail";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const report = await prisma.dailyReport.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
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
  if (report.userId !== session.user.id) redirect("/reports");

  const serialized = {
    id: report.id,
    date: report.date.toISOString(),
    status: report.status as "DRAFT" | "SUBMITTED" | "REJECTED" | "COMPLETED",
    user: report.user,
    visitRecords: report.visitRecords.map((vr) => ({
      id: vr.id,
      customer: vr.customer,
      content: vr.content,
      sortOrder: vr.sortOrder,
    })),
    problem: report.problem,
    plan: report.plan,
    comments: report.comments.map((c: NonNullable<typeof report>["comments"][number]) => ({
      id: c.id,
      targetField: c.targetField as "PROBLEM" | "PLAN" | "GENERAL",
      body: c.body,
      author: c.author,
      createdAt: c.createdAt.toISOString(),
    })),
  };

  return <ReportDetail report={serialized} backHref="/reports" editHref={`/reports/${id}/edit`} />;
}
