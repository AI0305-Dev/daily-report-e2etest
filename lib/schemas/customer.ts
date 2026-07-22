import { z } from "./index";

export const createCustomerSchema = z.object({
  name: z
    .string()
    .min(1, { message: "E401" })
    .max(100, { message: "E402" })
    .openapi({ description: "顧客名" }),
  address: z
    .string()
    .max(200, { message: "E403" })
    .nullable()
    .optional()
    .openapi({ description: "住所" }),
  note: z
    .string()
    .max(1000, { message: "E404" })
    .nullable()
    .optional()
    .openapi({ description: "備考" }),
});

export const updateCustomerSchema = createCustomerSchema;

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
