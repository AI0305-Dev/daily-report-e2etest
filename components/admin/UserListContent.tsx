import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { UserTable } from "@/components/admin/UserTable";
import { PaginationWrapper } from "@/components/reports/PaginationWrapper";
import { Prisma } from "@prisma/client";

type SearchParams = {
  name?: string;
  role?: string;
  page?: string;
};

type Props = {
  searchParams: SearchParams;
};

export async function UserListContent({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const limit = 20;
  const name = searchParams.name ?? "";
  const role = searchParams.role;

  const where: Prisma.UserWhereInput = { isDeleted: false };
  if (name) where.name = { contains: name, mode: "insensitive" };
  if (role && role !== "ALL") where.role = role as "SALES" | "MANAGER";

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAdmin: true,
        manager: { select: { id: true, name: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <UserTable users={users} />
      <Suspense fallback={null}>
        <PaginationWrapper page={page} totalPages={totalPages} />
      </Suspense>
    </div>
  );
}
