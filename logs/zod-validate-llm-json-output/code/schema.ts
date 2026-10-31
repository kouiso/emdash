import * as z from "zod";

export const Ticket = z.strictObject({
  category: z.enum(["bug", "billing", "other"]),
  priority: z.number().int().min(1).max(3),
  summary: z.string().min(1).max(40),
  tags: z.array(z.string()),
});

export type Ticket = z.infer<typeof Ticket>;
