"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { InitialPasswordModal } from "@/components/admin/InitialPasswordModal";
import { API_ERRORS } from "@/lib/api/errors";

type PasswordResetButtonProps = {
  userId: string;
};

export function PasswordResetButton({ userId }: PasswordResetButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  async function handleReset() {
    setResetting(true);
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        const code = json?.error?.code as keyof typeof API_ERRORS | undefined;
        toast.error(code && code in API_ERRORS ? API_ERRORS[code] : API_ERRORS.E000);
        return;
      }
      setConfirmOpen(false);
      setNewPassword(json.data.initialPassword as string);
    } catch {
      toast.error(API_ERRORS.E000);
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setConfirmOpen(true)}>
        パスワードをリセット
      </Button>

      <Dialog open={confirmOpen} onOpenChange={(o) => !o && setConfirmOpen(false)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>パスワードをリセットしますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            新しい初期パスワードが発行されます。現在のパスワードは使用できなくなります。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={resetting}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={resetting}>
              {resetting ? "リセット中..." : "リセット"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {newPassword && (
        <InitialPasswordModal open password={newPassword} onClose={() => setNewPassword(null)} />
      )}
    </>
  );
}
