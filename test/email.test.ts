import { describe, expect, it } from "vitest";
import { normalizeEmail } from "../src/utils/email";

describe("normalizeEmail", () => {
	it.each([
		["user@example.com", "user@example.com"],
		["  User.Name+tag@Example.CO.JP ", "user.name+tag@example.co.jp"],
		["a_b%c-d@sub-domain.example.org", "a_b%c-d@sub-domain.example.org"],
		["user@xn--eckwd4c7c.xn--zckzah", "user@xn--eckwd4c7c.xn--zckzah"],
	])("accepts %j", (input, expected) => {
		expect(normalizeEmail(input)).toBe(expected);
	});

	it.each([
		// レビューで挙がった値
		['=HYPERLINK("https://evil.example")@a.b', "CSV の数式"],
		["=HYPERLINK@a.bc", "= で始まる"],
		["+cmd@a.bc", "+ で始まる"],
		["-cmd@a.bc", "- で始まる"],
		["<img>@a.b", "HTML タグ"],
		["<img src=x onerror=alert(1)>@a.bc", "HTML タグ（空白あり）"],
		["a\u0000b@c.de", "NUL"],
		["a‮@b.cc", "bidi 制御文字 RLO"],
		["a@b⁦.cc", "bidi 制御文字 LRI"],
		["a@b..c", "ドメインの連続したドット"],
		// そのほかの崩れた形
		["", "空"],
		["   ", "空白だけ"],
		["plain", "@ が無い"],
		["@example.com", "@ の前が空"],
		["a@", "@ の後が空"],
		["a@b@c.de", "@ が2つ"],
		["a@localhost", "ドメインにドットが無い"],
		["a@b.c", "1文字のトップレベル"],
		["a@b.123", "数字だけのトップレベル"],
		["a..b@c.de", "ローカル部の連続したドット"],
		["a.@c.de", "ローカル部の末尾のドット"],
		[".a@c.de", "ローカル部の先頭のドット"],
		["a@-b.cd", "ハイフンで始まるラベル"],
		["a@b-.cd", "ハイフンで終わるラベル"],
		["a@.b.cd", "空のラベル"],
		["a b@c.de", "空白を含む"],
		['"a"@c.de', "引用符付きのローカル部"],
		["ユーザー@example.com", "ASCII 以外のローカル部"],
		["user@例え.jp", "punycode にしていない日本語ドメイン"],
		["ｕｓｅｒ@example.com", "全角英字"],
		[`${"a".repeat(65)}@example.com`, "ローカル部が 64 文字超"],
		[`a@${"b".repeat(64)}.com`, "ラベルが 63 文字超"],
		[`${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(60)}.com`, "全体が 254 文字超"],
	])("rejects %j (%s)", (input) => {
		expect(normalizeEmail(input)).toBeNull();
	});

	it("rejects non-string form values", () => {
		expect(normalizeEmail(null)).toBeNull();
		expect(normalizeEmail(new File(["a@b.cd"], "x.txt"))).toBeNull();
	});
});
