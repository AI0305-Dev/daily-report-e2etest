import { describe, it, expect } from "vitest";
import { ReportStatus } from "@prisma/client";
import { canSubmit, canApprove, canReject } from "@/lib/utils/statusTransition";

describe("canSubmit", () => {
  it("UT060: DRAFT → SUBMITTED は可能", () => {
    expect(canSubmit(ReportStatus.DRAFT)).toBe(true);
  });

  it("UT061: REJECTED → SUBMITTED は可能", () => {
    expect(canSubmit(ReportStatus.REJECTED)).toBe(true);
  });

  it("UT062: SUBMITTED → SUBMITTED は不可", () => {
    expect(canSubmit(ReportStatus.SUBMITTED)).toBe(false);
  });

  it("UT063: COMPLETED → SUBMITTED は不可", () => {
    expect(canSubmit(ReportStatus.COMPLETED)).toBe(false);
  });
});

describe("canApprove", () => {
  it("UT064: SUBMITTED → COMPLETED は可能", () => {
    expect(canApprove(ReportStatus.SUBMITTED)).toBe(true);
  });

  it("UT065: DRAFT → COMPLETED は不可", () => {
    expect(canApprove(ReportStatus.DRAFT)).toBe(false);
  });

  it("UT068: REJECTED → COMPLETED は不可", () => {
    expect(canApprove(ReportStatus.REJECTED)).toBe(false);
  });

  it("UT069: COMPLETED → COMPLETED は不可", () => {
    expect(canApprove(ReportStatus.COMPLETED)).toBe(false);
  });
});

describe("canReject", () => {
  it("UT066: SUBMITTED → REJECTED は可能", () => {
    expect(canReject(ReportStatus.SUBMITTED)).toBe(true);
  });

  it("UT067: COMPLETED → REJECTED は不可", () => {
    expect(canReject(ReportStatus.COMPLETED)).toBe(false);
  });

  it("UT070: DRAFT → REJECTED は不可", () => {
    expect(canReject(ReportStatus.DRAFT)).toBe(false);
  });

  it("UT071: REJECTED → REJECTED は不可", () => {
    expect(canReject(ReportStatus.REJECTED)).toBe(false);
  });
});
