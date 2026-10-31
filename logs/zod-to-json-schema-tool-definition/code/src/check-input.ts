import { searchOrdersInput } from "./schema.ts";

const samples: unknown[] = [
  { email: "user@example.com", status: "shipped" },
  { email: "user@example.com", status: "delivered", limit: 100 },
];

for (const sample of samples) {
  const result = searchOrdersInput.safeParse(sample);
  if (result.success) {
    console.log("ok:", result.data);
  } else {
    console.log("ng:", result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
  }
}
