import { z } from "./index";

export const createUserSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "E501" })
      .max(50, { message: "E502" })
      .openapi({ description: "氏名" }),
    email: z
      .string()
      .min(1, { message: "E503" })
      .email({ message: "E504" })
      .max(254, { message: "E506" })
      .openapi({ description: "メールアドレス" }),
    role: z.enum(["SALES", "MANAGER"], { message: "E507" }).openapi({ description: "ロール" }),
    isAdmin: z.boolean().openapi({ description: "管理者フラグ" }),
    managerId: z.string().optional().nullable().openapi({ description: "上長のユーザーID" }),
  })
  .refine(
    (data) => {
      if (data.role === "SALES" && !data.managerId) return false;
      return true;
    },
    { message: "E509", path: ["managerId"] }
  );

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "E501" })
      .max(50, { message: "E502" })
      .openapi({ description: "氏名" }),
    role: z.enum(["SALES", "MANAGER"], { message: "E507" }).openapi({ description: "ロール" }),
    isAdmin: z.boolean().openapi({ description: "管理者フラグ" }),
    managerId: z.string().optional().nullable().openapi({ description: "上長のユーザーID" }),
  })
  .refine(
    (data) => {
      if (data.role === "SALES" && !data.managerId) return false;
      return true;
    },
    { message: "E509", path: ["managerId"] }
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
