import { ReportStatus } from "@prisma/client";

export function canSubmit(status: ReportStatus): boolean {
  return status === ReportStatus.DRAFT || status === ReportStatus.REJECTED;
}

export function canApprove(status: ReportStatus): boolean {
  return status === ReportStatus.SUBMITTED;
}

export function canReject(status: ReportStatus): boolean {
  return status === ReportStatus.SUBMITTED;
}
