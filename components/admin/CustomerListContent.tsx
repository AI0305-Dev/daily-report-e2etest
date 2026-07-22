import { prisma } from "@/lib/prisma";
import { CustomerListTable } from "@/components/admin/CustomerListTable";
import { PaginationWrapper } from "@/components/reports/PaginationWrapper";

type SearchParams = {
  name?: string;
  page?: string;
};

type Props = {
  searchParams: SearchParams;
};

export async function CustomerListContent({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const limit = 20;
  const name = searchParams.name ?? "";

  const where = {
    isDeleted: false,
    ...(name ? { name: { contains: name, mode: "insensitive" as const } } : {}),
  };

  const [total, customers] = await prisma.$transaction([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        address: true,
        note: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <CustomerListTable customers={customers} />
      <PaginationWrapper page={page} totalPages={totalPages} />
    </div>
  );
}
