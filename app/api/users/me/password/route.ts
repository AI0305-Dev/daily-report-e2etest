import { NextRequest } from "next/server";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/middleware";
import { successResponse, errorResponse } from "@/lib/api/response";
import { toErrorCode } from "@/lib/api/errors";
import { changePasswordSchema } from "@/lib/schemas/password";
import { Session } from "next-auth";

export const PUT = withAuth(async (req: NextRequest, session: Session) => {
  const body: unknown = await req.json();
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    const code = toErrorCode(parsed.error.issues[0]?.message);
    return errorResponse(code ?? "E000", 400);
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user) return errorResponse("E001", 401);

  const match = await compare(currentPassword, user.password);
  if (!match) return errorResponse("E602", 400);

  const passwordHash = await hash(newPassword, 12);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: passwordHash, lastUpdateId: session.user.id },
  });

  return successResponse({ message: "パスワードを変更しました" });
});
