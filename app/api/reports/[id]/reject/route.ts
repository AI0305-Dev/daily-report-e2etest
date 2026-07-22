import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { successResponse, errorResponse } from "@/lib/api/response";
import { toErrorCode } from "@/lib/api/errors";
import { z } from "@/lib/schemas/index";
import { Session } from "next-auth";

const rejectSchema = z.object({
  reason: z.string().max(1000, { message: "E304" }).optional(),
});

export const POST = withAuth(
  async (req: NextRequest, session: Session, params?: Record<string, string>) => {
    const id = params?.id;
    if (!id) return errorResponse("E003", 404);

    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: { user: { select: { managerId: true } } },
    });

    if (!report) return errorResponse("E003", 404);

    if (report.user.managerId !== session.user.id) {
      return errorResponse("E302", 403);
    }

    if (report.status !== "SUBMITTED") {
      return errorResponse("E301", 400);
    }

    const body: unknown = await req.json().catch(() => ({}));
    const parsed = rejectSchema.safeParse(body);

    if (!parsed.success) {
      const code = toErrorCode(parsed.error.issues[0]?.message);
      return errorResponse(code ?? "E000", 400);
    }

    const { reason } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.dailyReport.update({
        where: { id },
        data: { status: "REJECTED", lastUpdateId: session.user.id },
        select: { id: true, status: true },
      });

      if (reason) {
        await tx.comment.create({
          data: {
            reportId: id,
            authorId: session.user.id,
            targetField: "GENERAL",
            body: reason,
            lastUpdateId: session.user.id,
          },
        });
      }

      return result;
    });

    return successResponse(updated);
  },
  { role: "MANAGER" }
);
