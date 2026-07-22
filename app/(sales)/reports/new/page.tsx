import { ReportForm } from "@/components/reports/ReportForm";

export default function NewReportPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">日報作成</h1>
      <ReportForm mode="create" cancelHref="/reports" />
    </div>
  );
}
