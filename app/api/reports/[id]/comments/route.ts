import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { successResponse, errorResponse } from "@/lib/api/response";
import { toErrorCode } from "@/lib/api/errors";
import { createCommentSchema } from "@/lib/schemas/comment";
import { Session } from "next-auth";

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
      return errorResponse("E305", 400);
    }

    const body: unknown = await req.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      const code = toErrorCode(parsed.error.issues[0]?.message);
      return errorResponse(code ?? "E000", 400);
    }

    const { targetField, body: commentBody } = parsed.data;

    const comment = await prisma.comment.create({
      data: {
        reportId: id,
        authorId: session.user.id,
        targetField,
        body: commentBody,
        lastUpdateId: session.user.id,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    try {
      revalidatePath(`/reports/${id}`);
      revalidatePath(`/manager/reports/${id}`);
    } catch {
      // Next.js静的生成コンテキスト外（統合テスト等）では無視する
    }

    return successResponse(comment, 201);
  },
  { role: "MANAGER" }
);
