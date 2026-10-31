/** プライバシーポリシーの版。同意した版を登録ごとに保存する。ポリシーを変えたら更新する */
export const PRIVACY_POLICY_VERSION = "2026-10-31";

// EmDash のテーブル（ec_*、_emdash_* など）と名前がぶつからないよう接頭辞を付けない独自名にする。
// EmDash のマイグレーションはサイト側のテーブルを管理しないので、初回の書き込みで作る。
const CREATE_TABLE_SQL = `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
	email TEXT PRIMARY KEY NOT NULL,
	created_at TEXT NOT NULL,
	consent_at TEXT NOT NULL,
	consent_policy_version TEXT NOT NULL
)`;

export type SubscribeOutcome = "created" | "already_subscribed";

/** D1Database のうち、ここで使う部分だけ。テストでは node:sqlite で同じ形を作る */
export interface SubscriberDatabase {
	prepare(query: string): {
		bind(...values: unknown[]): { run(): Promise<{ meta: { changes: number } }> };
		run(): Promise<unknown>;
	};
}

/**
 * 同じアドレスの2回目以降は何も変えずに already_subscribed を返す（最初の同意日時を残す）。
 */
export async function saveSubscriber(
	db: SubscriberDatabase,
	email: string,
	now: Date = new Date(),
): Promise<SubscribeOutcome> {
	const timestamp = now.toISOString();
	await db.prepare(CREATE_TABLE_SQL).run();
	const result = await db
		.prepare(
			`INSERT INTO newsletter_subscribers (email, created_at, consent_at, consent_policy_version)
			 VALUES (?1, ?2, ?2, ?3)
			 ON CONFLICT(email) DO NOTHING`,
		)
		.bind(email, timestamp, PRIVACY_POLICY_VERSION)
		.run();
	return result.meta.changes > 0 ? "created" : "already_subscribed";
}
