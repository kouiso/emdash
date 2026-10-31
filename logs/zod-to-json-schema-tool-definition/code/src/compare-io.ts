import * as z from "zod";
import { searchOrdersInput } from "./schema.ts";

const output = z.toJSONSchema(searchOrdersInput);
const input = z.toJSONSchema(searchOrdersInput, { io: "input" });
const strictInput = z.toJSONSchema(z.strictObject(searchOrdersInput.shape), { io: "input" });

console.log("output:      ", output.required, output.additionalProperties);
console.log("input:       ", input.required, input.additionalProperties);
console.log("strict input:", strictInput.required, strictInput.additionalProperties);
