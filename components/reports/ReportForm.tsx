"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VisitRecordFields, VisitRecordValue } from "@/components/reports/VisitRecordFields";
import { API_ERRORS } from "@/lib/api/errors";
import { todayISOString } from "@/lib/utils/date";

type ReportFormProps = {
  mode: "create" | "edit";
  reportId?: string;
  initialValues?: {
    date: string;
    visitRecords: VisitRecordValue[];
    problem: string;
    plan: string;
  };
  cancelHref: string;
};

type FieldErrors = {
  date?: string;
  visitRecords?: { customerId?: string; content?: string }[];
  problem?: string;
  plan?: string;
};

export function ReportForm({ mode, reportId, initialValues, cancelHref }: ReportFormProps) {
  const router = useRouter();

  const [date, setDate] = useState(initialValues?.date ?? todayISOString());
  const [visitRecords, setVisitRecords] = useState<VisitRecordValue[]>(
    initialValues?.visitRecords ?? []
  );
  const [problem, setProblem] = useState(initialValues?.problem ?? "");
  const [plan, setPlan] = useState(initialValues?.plan ?? "");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"draft" | "submit" | null>(null);

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!date) {
      errors.date = API_ERRORS.E201;
    } else {
      const d = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (d > today) {
        errors.date = API_ERRORS.E203;
      }
    }

    const vrErrors = visitRecords.map((r) => {
      const e: { customerId?: string; content?: string } = {};
      if (!r.customerId) e.customerId = API_ERRORS.E204;
      if (!r.content) e.content = API_ERRORS.E205;
      return e;
    });

    if (vrErrors.some((e) => e.customerId || e.content)) {
      errors.visitRecords = vrErrors;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(status: "DRAFT" | "SUBMITTED") {
    setServerError(null);
    if (visitRecords.length > 10) {
      setServerError(API_ERRORS.E206);
      return;
    }
    if (!validate()) return;

    setSubmitting(status === "DRAFT" ? "draft" : "submit");

    const body = {
      date,
      visitRecords: visitRecords.map((r, i) => ({
        customerId: r.customerId,
        content: r.content,
        sortOrder: i + 1,
      })),
      problem: problem || null,
      plan: plan || null,
      status,
    };

    try {
      const url = mode === "create" ? "/api/reports" : `/api/reports/${reportId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        const code = json?.error?.code as keyof typeof API_ERRORS | undefined;
        const message = code && code in API_ERRORS ? API_ERRORS[code] : API_ERRORS.E000;
        setServerError(message);
        return;
      }

      const id = json.data?.id ?? reportId;
      router.push(`/reports/${id}`);
    } catch {
      toast.error(API_ERRORS.E000);
    } finally {
      setSubmitting(null);
    }
  }

  const isLoading = submitting !== null;

  return (
    <div className="max-w-2xl space-y-6">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <Label htmlFor="date">
          日付{" "}
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="date"
          type="date"
          value={date}
          max={todayISOString()}
          onChange={(e) => setDate(e.target.value)}
          aria-invalid={!!fieldErrors.date}
          className="w-48"
        />
        {fieldErrors.date && <p className="text-sm text-destructive">{fieldErrors.date}</p>}
      </div>

      <div className="space-y-2">
        <Label>訪問記録</Label>
        <VisitRecordFields
          records={visitRecords}
          onChange={setVisitRecords}
          errors={fieldErrors.visitRecords}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="problem">Problem（課題・相談）</Label>
        <Textarea
          id="problem"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="課題・相談を入力"
          rows={4}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="plan">Plan（明日やること）</Label>
        <Textarea
          id="plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          placeholder="明日やることを入力"
          rows={4}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
          キャンセル
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleSubmit("DRAFT")}
          disabled={isLoading}
        >
          {submitting === "draft" ? "保存中..." : "下書き保存"}
        </Button>
        <Button type="button" onClick={() => handleSubmit("SUBMITTED")} disabled={isLoading}>
          {submitting === "submit" ? "提出中..." : "提出"}
        </Button>
      </div>
    </div>
  );
}
