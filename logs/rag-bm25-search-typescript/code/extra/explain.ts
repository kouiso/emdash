// 記事には載せない確認用。検索結果ごとに、質問のどの語が文書と一致したかを出す。
import { docs } from "../docs.ts";
import { tokenize } from "../tokenize.ts";

for (const query of process.argv.slice(2)) {
  const terms = new Set(tokenize(query));
  console.log(`## ${query} -> ${[...terms].join(" | ")}`);
  for (const doc of docs) {
    const docTerms = tokenize(doc.text);
    const matched = [...terms].filter((t) => docTerms.includes(t));
    const df = (t: string) => docs.filter((d) => tokenize(d.text).includes(t)).length;
    if (matched.length > 0) {
      console.log(doc.id, matched.map((t) => `${t}(tf=${docTerms.filter((x) => x === t).length},df=${df(t)})`).join(" "), `len=${docTerms.length}`);
    }
  }
}
