import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "DRAFT" | "SUBMITTED" | "REJECTED" | "COMPLETED";

const STATUS_LABELS: Record<Status, string> = {
  DRAFT: "下書き",
  SUBMITTED: "提出済",
  REJECTED: "差し戻し",
  COMPLETED: "完了",
};

const STATUS_CLASSES: Record<Status, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
};

type StatusBadgeProps = {
  status: Status;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(STATUS_CLASSES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export { STATUS_LABELS };
