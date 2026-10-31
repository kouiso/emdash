import { env } from "cloudflare:workers";

/**
 * Worker の vars / secrets（ローカルは .dev.vars）から文字列を読む。
 * 未設定や空文字は undefined にして、呼び出し側で「機能を出さない」判断に使う。
 * 名前ごとの型を Cloudflare.Env に足すと、`wrangler types` が .dev.vars から
 * 同じ名前を必須の string として生成したときに型が衝突するため、ここで実行時に確かめる。
 */
export function readEnv(name: string): string | undefined {
	const value: unknown = Reflect.get(env, name);
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed === "" ? undefined : trimmed;
}
