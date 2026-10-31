import * as z from "zod";
import { ja } from "zod/locales";
import { Ticket } from "./schema.ts";
import { samples } from "./samples.ts";

z.config(ja());
const result = Ticket.safeParse(JSON.parse(samples.many));
if (!result.success) {
  console.log(z.prettifyError(result.error));
}
