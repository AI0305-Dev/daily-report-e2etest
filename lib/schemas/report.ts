import { z } from "./index";

const visitRecordSchema = z.object({
  customerId: z.string().min(1, { message: "E204" }).openapi({ description: "顧客ID" }),
  content: z
    .string()
    .min(1, { message: "E205" })
    .max(1000, { message: "E207" })
    .openapi({ description: "訪問内容" }),
  sortOrder: z.number().int().min(1).openapi({ description: "表示順" }),
});

export const createReportSchema = z.object({
  date: z
    .string()
    .min(1, { message: "E201" })
    .refine(
      (val) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
        const d = new Date(`${val}T00:00:00`);
        if (isNaN(d.getTime())) return false;
        if (d.getMonth() + 1 !== Number(val.slice(5, 7))) return false;
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        return val <= todayStr;
      },
      { message: "E203" }
    )
    .openapi({ description: "日報日付 (ISO8601)", example: "2026-05-18" }),
  visitRecords: z
    .array(visitRecordSchema)
    .max(10, { message: "E206" })
    .default([])
    .openapi({ description: "訪問記録" }),
  problem: z
    .string()
    .max(2000, { message: "E208" })
    .nullable()
    .optional()
    .openapi({ description: "課題・相談" }),
  plan: z
    .string()
    .max(2000, { message: "E209" })
    .nullable()
    .optional()
    .openapi({ description: "明日やること" }),
  status: z.enum(["DRAFT", "SUBMITTED"]).openapi({ description: "ステータス" }),
});

export const updateReportSchema = createReportSchema;

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
