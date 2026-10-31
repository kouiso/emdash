// 記事の外の確認: tool.ts の出力の email.pattern が、z.email() の検証に使う正規表現と同じ文字列かを比べる。
import * as z from "zod";

const json = z.toJSONSchema(z.object({ email: z.email() }), { io: "input" });
console.log("pattern === z.regexes.email.source:", json.properties.email.pattern === z.regexes.email.source);
