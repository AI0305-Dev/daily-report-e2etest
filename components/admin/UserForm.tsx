"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordResetButton } from "@/components/admin/PasswordResetButton";
import { InitialPasswordModal } from "@/components/admin/InitialPasswordModal";
import { API_ERRORS, toErrorCode } from "@/lib/api/errors";

const userFormSchema = z
  .object({
    name: z.string().min(1, { message: "E501" }).max(50, { message: "E502" }),
    email: z
      .string()
      .min(1, { message: "E503" })
      .email({ message: "E504" })
      .max(254, { message: "E506" }),
    role: z.enum(["SALES", "MANAGER"], { message: "E507" }),
    isAdmin: z.boolean(),
    managerId: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.role === "SALES" && !data.managerId) return false;
      return true;
    },
    { message: "E509", path: ["managerId"] }
  );

type UserFormValues = z.infer<typeof userFormSchema>;

type Manager = {
  id: string;
  name: string;
};

type UserFormProps =
  | {
      mode: "create";
      userId?: never;
      initialValues?: never;
    }
  | {
      mode: "edit";
      userId: string;
      initialValues: {
        name: string;
        email: string;
        role: "SALES" | "MANAGER";
        isAdmin: boolean;
        managerId: string | null;
      };
    };

function resolveErrorMessage(code: string | undefined): string {
  const errorCode = toErrorCode(code);
  return errorCode ? API_ERRORS[errorCode] : API_ERRORS.E000;
}

export function UserForm({ mode, userId, initialValues }: UserFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [initialPassword, setInitialPassword] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      email: initialValues?.email ?? "",
      role: initialValues?.role ?? "SALES",
      isAdmin: initialValues?.isAdmin ?? false,
      managerId: initialValues?.managerId ?? null,
    },
  });

  const selectedRole = useWatch({ control, name: "role" });

  useEffect(() => {
    fetch("/api/users?role=MANAGER&limit=100")
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (Array.isArray(json.data)) setManagers(json.data as Manager[]);
      })
      .catch(() => toast.error(API_ERRORS.E000))
      .finally(() => setLoadingManagers(false));
  }, []);

  async function onSubmit(data: UserFormValues) {
    setServerError(null);

    const body =
      mode === "create"
        ? {
            name: data.name,
            email: data.email,
            role: data.role,
            isAdmin: data.isAdmin,
            managerId: data.role === "SALES" ? (data.managerId ?? null) : null,
          }
        : {
            name: data.name,
            role: data.role,
            isAdmin: data.isAdmin,
            managerId: data.role === "SALES" ? (data.managerId ?? null) : null,
          };

    try {
      const url = mode === "create" ? "/api/users" : `/api/users/${userId}`;
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

      if (mode === "create" && json.data?.initialPassword) {
        setInitialPassword(json.data.initialPassword as string);
      } else {
        router.push("/admin/users");
        router.refresh();
      }
    } catch {
      toast.error(API_ERRORS.E000);
    }
  }

  return (
    <>
      <div className="max-w-2xl space-y-6">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1">
            <Label htmlFor="name">
              氏名{" "}
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
            <Label htmlFor="email">
              メールアドレス{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            </Label>
            {mode === "create" ? (
              <>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {resolveErrorMessage(errors.email.message)}
                  </p>
                )}
              </>
            ) : (
              <Input
                id="email"
                type="email"
                value={initialValues?.email ?? ""}
                disabled
                className="bg-muted text-muted-foreground"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>
              ロール{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            </Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="SALES" id="role-sales" />
                    <Label htmlFor="role-sales" className="cursor-pointer font-normal">
                      SALES
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="MANAGER" id="role-manager" />
                    <Label htmlFor="role-manager" className="cursor-pointer font-normal">
                      MANAGER
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.role && (
              <p className="text-sm text-destructive">{resolveErrorMessage(errors.role.message)}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              name="isAdmin"
              control={control}
              render={({ field }) => (
                <Checkbox id="isAdmin" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="isAdmin" className="cursor-pointer font-normal">
              管理者権限を付与する
            </Label>
          </div>

          {selectedRole === "SALES" && (
            <div className="space-y-1">
              <Label htmlFor="managerId">
                上長{" "}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </Label>
              <Controller
                name="managerId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v !== "" ? v : null)}
                    disabled={loadingManagers}
                  >
                    <SelectTrigger id="managerId" aria-invalid={!!errors.managerId}>
                      <SelectValue
                        placeholder={loadingManagers ? "読み込み中..." : "選択してください"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.managerId && (
                <p className="text-sm text-destructive">
                  {resolveErrorMessage(errors.managerId.message)}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            {mode === "edit" && userId && <PasswordResetButton userId={userId} />}
            <div className="ml-auto flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/users")}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {initialPassword && (
        <InitialPasswordModal
          open
          password={initialPassword}
          onClose={() => {
            setInitialPassword(null);
            router.push("/admin/users");
            router.refresh();
          }}
        />
      )}
    </>
  );
}
