import { z } from "./index";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ description: "ページ番号" }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .openapi({ description: "1ページあたり件数" }),
});

export const reportQuerySchema = paginationSchema.extend({
  status: z
    .enum(["DRAFT", "SUBMITTED", "REJECTED", "COMPLETED"])
    .optional()
    .openapi({ description: "ステータス絞り込み" }),
  dateFrom: z.string().optional().openapi({ description: "開始日 (ISO8601)" }),
  dateTo: z.string().optional().openapi({ description: "終了日 (ISO8601)" }),
  userId: z.string().optional().openapi({ description: "営業ユーザーID（MANAGERのみ有効）" }),
});

export const customerQuerySchema = paginationSchema.extend({
  name: z.string().optional().openapi({ description: "顧客名（部分一致）" }),
});

export const userQuerySchema = paginationSchema.extend({
  name: z.string().optional().openapi({ description: "氏名（部分一致）" }),
  role: z.enum(["SALES", "MANAGER"]).optional().openapi({ description: "ロール絞り込み" }),
});
