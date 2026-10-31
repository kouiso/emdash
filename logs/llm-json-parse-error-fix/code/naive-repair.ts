import { samples } from "./samples.ts";

const repaired = samples.truncated + '"}';
console.log(JSON.parse(repaired));
