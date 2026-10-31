#!/usr/bin/env node
// push の前に、変更したファイルだけを正規表現で調べる秘密情報のスキャン。
// このリポジトリでは GitHub Advanced Security が有効でなく、GitHub の secret scanning
// （run_secret_scanning）が使えないため、その代わりに使う（CLAUDE.md の秘密情報のルール）。
//
// 使い方: node scripts/secret-scan.mjs [比較の基準]
//   基準を省略すると、追跡しているリモートのブランチ（@{upstream}）と比べる。
//   「基準から HEAD までにコミットした変更」と「まだコミットしていない変更」の両方を調べる。
// 見つかれば終了コード 1。値そのものは出さず、ファイル名、行番号、種類だけを出す。
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const PATTERNS = [
	["private key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY( BLOCK)?-----/],
	["Anthropic API key", /\bsk-ant-[A-Za-z0-9_-]{20,}/],
	["OpenAI API key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/],
	["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})/],
	["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
	["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
	["Slack token", /\bxox[abposr]-[A-Za-z0-9-]{10,}/],
	["Stripe secret key", /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}/],
	["EmDash personal access token", /\bec_pat_[A-Za-z0-9_-]{16,}/],
	["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
	["Cloudflare account ID in an API path", /\/accounts\/[0-9a-f]{32}\b/],
	["Turnstile secret key", /\b0x4[A-Za-z0-9_-]{30,}/],
	[
		"assigned secret",
		/\b(?:api[_-]?key|secret(?:[_-]?key)?|token|password|passwd|client[_-]?secret)\b\s*[:=]\s*["']?[A-Za-z0-9+/_\-.]{24,}/i,
	],
];

// 公開されているテスト用の値。誤検出として外す
const ALLOWED = [
	"1x0000000000000000000000000000000AA", // Turnstile のテスト用シークレット（常に通る）
	"2x0000000000000000000000000000000AA", // Turnstile のテスト用シークレット（常に落ちる）
	"XXXX.DUMMY.TOKEN.XXXX",
];

const SKIP = [/^package-lock\.json$/, /^vendor\//, /(^|\/)node_modules\//, /\.(png|jpe?g|gif|webp|ico|zip|pdf|woff2?)$/i];

function git(...args) {
	return execFileSync("git", args, { encoding: "utf8" });
}

const base = process.argv[2] ?? "@{upstream}";
const files = new Set(
	[
		...git("diff", "--name-only", "--diff-filter=ACMR", `${base}...HEAD`).split("\n"),
		...git("diff", "--name-only", "--diff-filter=ACMR", "HEAD").split("\n"),
		...git("ls-files", "--others", "--exclude-standard").split("\n"),
	].filter(Boolean),
);

const findings = [];
let scanned = 0;
for (const file of files) {
	if (SKIP.some((re) => re.test(file)) || !existsSync(file)) continue;
	scanned++;
	const lines = readFileSync(file, "utf8").split("\n");
	lines.forEach((raw, index) => {
		const line = ALLOWED.reduce((text, allowed) => text.replaceAll(allowed, ""), raw);
		for (const [kind, pattern] of PATTERNS) {
			if (pattern.test(line)) findings.push(`${file}:${index + 1}: ${kind}`);
		}
	});
}

console.log(`secret-scan: base ${base}, ${scanned} changed file(s) scanned, ${findings.length} finding(s)`);
for (const finding of findings) console.log(`  ${finding}`);
process.exit(findings.length > 0 ? 1 : 0);
