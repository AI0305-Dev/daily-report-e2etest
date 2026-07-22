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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_ERRORS, toErrorCode } from "@/lib/api/errors";

const passwordChangeFormSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "E601" }),
    newPassword: z
      .string()
      .min(1, { message: "E603" })
      .min(8, { message: "E604" })
      .refine((val) => /[A-Za-z]/.test(val) && /[0-9]/.test(val), {
        message: "E605",
      }),
    confirmPassword: z.string().min(1, { message: "E606" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "E607",
    path: ["confirmPassword"],
  });

type PasswordChangeFormValues = z.infer<typeof passwordChangeFormSchema>;

type PasswordChangeFormProps = {
  role: "SALES" | "MANAGER";
};

function resolveErrorMessage(code: string | undefined): string {
  const errorCode = toErrorCode(code);
  return errorCode ? API_ERRORS[errorCode] : API_ERRORS.E000;
}

function getHomeByRole(role: "SALES" | "MANAGER"): string {
  return role === "SALES" ? "/reports" : "/manager/reports";
}

export function PasswordChangeForm({ role }: PasswordChangeFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeFormSchema),
    mode: "onBlur",
  });

  async function onSubmit(data: PasswordChangeFormValues) {
    setServerError(null);

    try {
      const res = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const code = json?.error?.code as string | undefined;
        if (code === "E602") {
          setServerError(API_ERRORS.E602);
        } else {
          setServerError(resolveErrorMessage(code));
        }
        return;
      }

      toast.success("パスワードを変更しました");
      router.push(getHomeByRole(role));
    } catch {
      toast.error(API_ERRORS.E000);
    }
  }

  function handleCancel() {
    router.push(getHomeByRole(role));
  }

  return (
    <div className="max-w-md space-y-6">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1">
          <Label htmlFor="currentPassword">
            現在のパスワード{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <Input
            id="currentPassword"
            type="password"
            {...register("currentPassword")}
            aria-invalid={!!errors.currentPassword}
          />
          {errors.currentPassword && (
            <p className="text-sm text-destructive">
              {resolveErrorMessage(errors.currentPassword.message)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="newPassword">
            新しいパスワード{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <Input
            id="newPassword"
            type="password"
            {...register("newPassword")}
            aria-invalid={!!errors.newPassword}
          />
          {errors.newPassword && (
            <p className="text-sm text-destructive">
              {resolveErrorMessage(errors.newPassword.message)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirmPassword">
            新しいパスワード（確認）{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {resolveErrorMessage(errors.confirmPassword.message)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "変更中..." : "変更する"}
          </Button>
        </div>
      </form>
    </div>
  );
}
