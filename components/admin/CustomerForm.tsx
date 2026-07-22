"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_ERRORS, toErrorCode } from "@/lib/api/errors";

const customerFormSchema = z.object({
  name: z.string().min(1, { message: "E401" }).max(100, { message: "E402" }),
  address: z.string().max(200, { message: "E403" }),
  note: z.string().max(1000, { message: "E404" }),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

type CustomerFormProps =
  | { mode: "create"; customerId?: never; initialValues?: never }
  | {
      mode: "edit";
      customerId: string;
      initialValues: { name: string; address: string; note: string };
    };

function resolveErrorMessage(code: string | undefined): string {
  const errorCode = toErrorCode(code);
  return errorCode ? API_ERRORS[errorCode] : API_ERRORS.E000;
}

export function CustomerForm({ mode, customerId, initialValues }: CustomerFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      address: initialValues?.address ?? "",
      note: initialValues?.note ?? "",
    },
  });

  async function onSubmit(data: CustomerFormValues) {
    setServerError(null);

    const body = {
      name: data.name,
      address: data.address || null,
      note: data.note || null,
    };

    try {
      const url = mode === "create" ? "/api/customers" : `/api/customers/${customerId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        const code = json?.error?.code as string | undefined;
        setServerError(resolveErrorMessage(code));
        return;
      }

      router.push("/admin/customers");
      router.refresh();
    } catch {
      toast.error(API_ERRORS.E000);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1">
          <Label htmlFor="name">
            顧客名{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
          {errors.name && (
            <p className="text-sm text-destructive">{resolveErrorMessage(errors.name.message)}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="address">住所</Label>
          <Input id="address" {...register("address")} aria-invalid={!!errors.address} />
          {errors.address && (
            <p className="text-sm text-destructive">
              {resolveErrorMessage(errors.address.message)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="note">備考</Label>
          <Textarea id="note" {...register("note")} aria-invalid={!!errors.note} rows={4} />
          {errors.note && (
            <p className="text-sm text-destructive">{resolveErrorMessage(errors.note.message)}</p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/customers")}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "保存"}
          </Button>
        </div>
      </form>
    </div>
  );
}
