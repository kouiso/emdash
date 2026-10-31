import { encodingForModel, type TiktokenModel } from "js-tiktoken";

for (const model of ["gpt-5-mini", "gpt-5.6-terra"]) {
  try {
    const enc = encodingForModel(model as TiktokenModel);
    console.log(`${model}: ${enc.encode("hello").length} token`);
  } catch (error) {
    console.log(`${model}: ${(error as Error).message}`);
  }
}
