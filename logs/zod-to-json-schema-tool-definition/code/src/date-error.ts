import * as z from "zod";

try {
  z.toJSONSchema(z.object({ dueDate: z.date() }), { io: "input" });
} catch (error) {
  console.log("error:", error instanceof Error ? error.message : error);
}

const dueDate = z.iso.date().meta({ description: "期限日（YYYY-MM-DD）" });
const json = z.toJSONSchema(dueDate, { io: "input" });
console.log("fixed:", json.type, json.format);
