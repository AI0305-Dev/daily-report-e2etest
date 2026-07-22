import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ReportForm } from "@/components/reports/ReportForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditReportPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const report = await prisma.dailyReport.findUnique({
    where: { id },
    include: {
      visitRecords: {
        orderBy: { sortOrder: "asc" },
        include: { customer: { select: { id: true, name: true } } },
      },
    },
  });

  if (!report) notFound();
  if (report.userId !== session.user.id) redirect("/reports");
  if (report.status !== "DRAFT" && report.status !== "REJECTED") {
    redirect(`/reports/${id}`);
  }

  const dateStr = report.date.toISOString().slice(0, 10);

  const initialValues = {
    date: dateStr,
    visitRecords: report.visitRecords.map((vr) => ({
      _id: vr.id,
      customerId: vr.customerId,
      customerName: vr.customer.name,
      content: vr.content,
    })),
    problem: report.problem ?? "",
    plan: report.plan ?? "",
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">日報編集</h1>
      <ReportForm
        mode="edit"
        reportId={id}
        initialValues={initialValues}
        cancelHref={`/reports/${id}`}
      />
    </div>
  );
}
