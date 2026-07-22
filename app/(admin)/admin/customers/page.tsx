import Link from "next/link";
import { Suspense } from "react";
import { CustomerSearchFilter } from "@/components/admin/CustomerSearchFilter";
import { CustomerListContent } from "@/components/admin/CustomerListContent";

type SearchParams = {
  name?: string;
  page?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">顧客マスタ</h1>
        <Link
          href="/admin/customers/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + 顧客を追加
        </Link>
      </div>
      <Suspense fallback={null}>
        <CustomerSearchFilter />
      </Suspense>
      <Suspense
        fallback={<div className="text-center py-12 text-muted-foreground">読み込み中...</div>}
      >
        <CustomerListContent searchParams={params} />
      </Suspense>
    </div>
  );
}
