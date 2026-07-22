import { z } from "./index";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "E101" })
    .email({ message: "E102" })
    .openapi({ description: "メールアドレス", example: "user@example.com" }),
  password: z.string().min(1, { message: "E103" }).openapi({ description: "パスワード" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
