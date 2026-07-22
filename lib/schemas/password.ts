import { z } from "./index";

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "E601" })
      .openapi({ description: "現在のパスワード" }),
    newPassword: z
      .string()
      .min(1, { message: "E603" })
      .min(8, { message: "E604" })
      .refine((val) => /[A-Za-z]/.test(val) && /[0-9]/.test(val), {
        message: "E605",
      })
      .openapi({ description: "新しいパスワード（8文字以上・英数字混在）" }),
    confirmPassword: z
      .string()
      .min(1, { message: "E606" })
      .openapi({ description: "新しいパスワード（確認）" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "E607",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
