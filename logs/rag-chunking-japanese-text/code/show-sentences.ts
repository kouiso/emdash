import { splitSentences } from "./sentences.ts";

const text = "発送の前であれば、マイページから取り消せます。「領収書は出ますか？」には「はい。」とお答えしています。";

const segmenter = new Intl.Segmenter("ja", { granularity: "sentence" });
console.log("Intl.Segmenter:");
for (const { segment } of segmenter.segment(text)) console.log(" ", JSON.stringify(segment));

console.log("splitSentences:");
for (const sentence of splitSentences(text)) console.log(" ", JSON.stringify(sentence));
