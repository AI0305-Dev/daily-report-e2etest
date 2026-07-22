"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { API_ERRORS } from "@/lib/api/errors";

type Customer = {
  id: string;
  name: string;
  address: string | null;
  note: string | null;
};

type CustomerListTableProps = {
  customers: Customer[];
};

export function CustomerListTable({ customers }: CustomerListTableProps) {
  const router = useRouter();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${deleteTargetId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        const code = json?.error?.code as keyof typeof API_ERRORS | undefined;
        toast.error(code && code in API_ERRORS ? API_ERRORS[code] : API_ERRORS.E000);
        return;
      }
      setDeleteTargetId(null);
      router.refresh();
    } catch {
      toast.error(API_ERRORS.E000);
    } finally {
      setDeleting(false);
    }
  }

  if (customers.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">顧客がありません</div>;
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">顧客名</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">住所</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">備考</th>
              <th className="w-32" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">{customer.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{customer.address ?? "-"}</td>
                <td
                  className="px-4 py-3 text-muted-foreground max-w-xs truncate"
                  title={customer.note ?? undefined}
                >
                  {customer.note ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <Link
                      href={`/admin/customers/${customer.id}/edit`}
                      className={buttonVariants({ variant: "soft", size: "sm" })}
                    >
                      編集
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTargetId(customer.id)}
                    >
                      削除
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>顧客を削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            削除後も過去の訪問記録では顧客名が表示されます。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)} disabled={deleting}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
