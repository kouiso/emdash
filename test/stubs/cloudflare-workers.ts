/** テスト用の `cloudflare:workers`。テストごとに env の中身を入れ替える */
export const env: Record<string, unknown> = {};

export function resetEnv(values: Record<string, unknown> = {}): void {
	for (const key of Object.keys(env)) delete env[key];
	Object.assign(env, values);
}
