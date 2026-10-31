/** テスト用の `cloudflare:workers`。テストごとに env の中身を入れ替える */
export const env: Record<string, unknown> = {};

/** 登録を受け付けるのに要る問い合わせ先。ほとんどのテストで入れておく */
export const CONTACT = { PUBLIC_CONTACT_EMAIL: "owner@example.com" };

export function resetEnv(values: Record<string, unknown> = {}): void {
	for (const key of Object.keys(env)) delete env[key];
	Object.assign(env, values);
}
