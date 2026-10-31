import * as z from "zod";
import { samples } from "./samples.ts";

const LooseTicket = z.object({
  category: z.enum(["bug", "billing", "other"]),
  priority: z.number().int().min(1).max(3),
  summary: z.string().min(1).max(40),
  tags: z.array(z.string()),
});

const result = LooseTicket.safeParse(JSON.parse(samples["extra-key"]));
console.log(result.success, result.data);
