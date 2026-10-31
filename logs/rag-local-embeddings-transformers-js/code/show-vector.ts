import { embed } from "./embed.ts";

const text = process.argv[2] ?? "";
const [vector] = await embed([`query: ${text}`]);
const length = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));

console.log("次元数", vector.length);
console.log("先頭の3つ", vector.slice(0, 3).map((x) => x.toFixed(4)));
console.log("長さ", length.toFixed(4));
