"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { API_ERRORS } from "@/lib/api/errors";

type CommentFormProps = {
  reportId: string;
  targetField: "PROBLEM" | "PLAN" | "GENERAL";
};

export function CommentForm({ reportId, targetField }: CommentFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!body.trim()) {
      setError(API_ERRORS.E303);
      return;
    }
    if (body.length > 1000) {
      setError(API_ERRORS.E304);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetField, body }),
      });

      if (!res.ok) {
        const json = await res.json();
        const code = json?.error?.code as keyof typeof API_ERRORS | undefined;
        toast.error(code && code in API_ERRORS ? API_ERRORS[code] : API_ERRORS.E000);
        return;
      }

      setBody("");
      router.refresh();
    } catch {
      toast.error(API_ERRORS.E000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 space-y-1">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="コメントを入力"
        rows={2}
        maxLength={1000}
        aria-invalid={!!error}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "送信中..." : "送信"}
        </Button>
      </div>
    </div>
  );
}
