import * as z from "zod";

export const searchOrdersInput = z.object({
  email: z.email().meta({ description: "注文した人のメールアドレス" }),
  status: z.enum(["pending", "shipped", "cancelled"]).meta({
    description: "注文の状態。pending は発送前、shipped は発送済み、cancelled はキャンセル済み",
  }),
  limit: z.number().int().min(1).max(50).default(10).meta({
    description: "返す注文の最大件数。省略すると10件",
  }),
});
