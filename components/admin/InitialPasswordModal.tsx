"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type InitialPasswordModalProps = {
  open: boolean;
  password: string;
  onClose: () => void;
};

export function InitialPasswordModal({ open, password, onClose }: InitialPasswordModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>初期パスワード</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          以下の初期パスワードをユーザーに共有してください。このダイアログを閉じると二度と確認できません。
        </p>
        <div className="rounded-md bg-muted px-4 py-3 font-mono text-base font-semibold tracking-widest text-center select-all">
          {password}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
