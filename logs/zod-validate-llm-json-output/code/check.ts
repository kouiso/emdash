import { Ticket } from "./schema.ts";
import { samples } from "./samples.ts";

const name = process.argv[2] ?? "ok";
const text = samples[name];
if (text === undefined) {
  console.error(`unknown sample: ${name}`);
  process.exit(1);
}

const result = Ticket.safeParse(JSON.parse(text));
if (result.success) {
  console.log("success:", result.data);
} else {
  console.log(result.error.issues);
}
