import * as z from "zod";
import { Ticket } from "./schema.ts";
import { samples } from "./samples.ts";

const result = Ticket.safeParse(JSON.parse(samples.many));
if (!result.success) {
  const message = [
    "前回の JSON は、次の点がスキーマに合いませんでした。",
    z.prettifyError(result.error),
    "直した JSON だけを返してください。",
  ].join("\n");
  console.log(message);
}
