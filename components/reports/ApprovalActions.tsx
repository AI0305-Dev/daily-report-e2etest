"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { API_ERRORS } from "@/lib/api/errors";

type ApprovalActionsProps = {
  reportId: string;
  backHref: string;
};

export function ApprovalActions({ reportId, backHref }: ApprovalActionsProps) {
  const router = useRouter();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleApprove() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/approve`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json();
        const code = json?.error?.code as keyof typeof API_ERRORS | undefined;
        toast.error(code && code in API_ERRORS ? API_ERRORS[code] : API_ERRORS.E000);
        return;
      }
      setApproveOpen(false);
      router.push(backHref);
    } catch {
      toast.error(API_ERRORS.E000);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || undefined }),
      });
      if (!res.ok) {
        const json = await res.json();
        const code = json?.error?.code as keyof typeof API_ERRORS | undefined;
        toast.error(code && code in API_ERRORS ? API_ERRORS[code] : API_ERRORS.E000);
        return;
      }
      setRejectOpen(false);
      router.push(backHref);
    } catch {
      toast.error(API_ERRORS.E000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setRejectOpen(true)}>
          差し戻し
        </Button>
        <Button onClick={() => setApproveOpen(true)}>承認</Button>
      </div>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>日報を承認しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">承認後は取り消しできません。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={submitting}>
              キャンセル
            </Button>
            <Button onClick={handleApprove} disabled={submitting}>
              {submitting ? "承認中..." : "承認"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>日報を差し戻しますか？</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="reason">差し戻し理由（任意）</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="差し戻し理由を入力"
              maxLength={1000}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={submitting}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={submitting}>
              {submitting ? "処理中..." : "差し戻し"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
