"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { API_ERRORS } from "@/lib/api/errors";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "SALES" | "MANAGER";
  isAdmin: boolean;
  manager: { id: string; name: string } | null;
};

type Props = {
  users: UserRow[];
};

export function UserTable({ users }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (users.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">ユーザーが見つかりません</div>;
  }

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${deletingId}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) {
        const code = json?.error?.code as string | undefined;
        const message =
          code && code in API_ERRORS
            ? API_ERRORS[code as keyof typeof API_ERRORS]
            : API_ERRORS.E000;
        toast.error(message);
        return;
      }
      setDeletingId(null);
      router.refresh();
    } catch {
      toast.error(API_ERRORS.E000);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">氏名</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                メールアドレス
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">ロール</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">管理者</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">上長</th>
              <th className="w-32" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">{user.isAdmin ? "○" : "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.role === "SALES" ? (user.manager?.name ?? "-") : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className={buttonVariants({ variant: "soft", size: "sm" })}
                    >
                      編集
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => setDeletingId(user.id)}>
                      削除
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザーを削除</DialogTitle>
            <DialogDescription>
              このユーザーを削除しますか？削除後も過去の日報・コメントでは氏名が表示されます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)} disabled={isDeleting}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "削除中..." : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
