// 記事には載せない確認用。reproduce.ts が切って表示した部分を含む、エラーの文の全体と position の指す位置を出す。
import { samples } from "../samples.ts";

for (const [name, text] of Object.entries(samples)) {
  try {
    JSON.parse(text);
  } catch (error) {
    console.log(`${name}: ${JSON.stringify(String(error))}`);
  }
}
console.log("trailing の「以」の位置:", samples.trailing.indexOf("以"));
console.log("truncated の長さ:", samples.truncated.length);
