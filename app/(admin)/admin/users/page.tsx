import Link from "next/link";
import { Suspense } from "react";
import { UserListContent } from "@/components/admin/UserListContent";
import { UserSearchFilter } from "@/components/admin/UserSearchFilter";

type SearchParams = {
  name?: string;
  role?: string;
  page?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function UsersPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">営業マスタ</h1>
        <Link
          href="/admin/users/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + 営業を追加
        </Link>
      </div>

      <Suspense fallback={null}>
        <UserSearchFilter />
      </Suspense>

      <Suspense
        fallback={<div className="text-center py-12 text-muted-foreground">読み込み中...</div>}
      >
        <UserListContent searchParams={params} />
      </Suspense>
    </div>
  );
}
