import { z } from "./index";

export const createCommentSchema = z.object({
  targetField: z
    .enum(["PROBLEM", "PLAN", "GENERAL"])
    .openapi({ description: "コメント対象フィールド" }),
  body: z
    .string()
    .min(1, { message: "E303" })
    .max(1000, { message: "E304" })
    .openapi({ description: "コメント本文" }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
