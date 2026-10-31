/** プライバシーポリシーの版。同意した版を登録ごとに保存する。ポリシーを変えたら更新する */
export const PRIVACY_POLICY_VERSION = "2026-10-31";

// EmDash のテーブル（ec_*、_emdash_* など）と名前がぶつからないよう接頭辞を付けない独自名にする。
// EmDash のマイグレーションはサイト側のテーブルを管理しないので、最初の登録でテーブルが無ければ作る。
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

const INSERT_SQL = `INSERT INTO newsletter_subscribers (email, created_at, consent_at, consent_policy_version)
	VALUES (?1, ?2, ?2, ?3)
	ON CONFLICT(email) DO NOTHING`;

/** D1 は SQLite のエラー文をそのまま含めて投げる（例: "D1_ERROR: no such table: newsletter_subscribers: SQLITE_ERROR"） */
function isMissingTableError(error: unknown): boolean {
	return error instanceof Error && error.message.includes("no such table: newsletter_subscribers");
}

/**
 * 同じアドレスの2回目以降は何も変えずに already_subscribed を返す（最初の同意日時を残す）。
 * ふだんは INSERT の1回だけ。テーブルがまだ無いとき（最初の1件）だけ作ってから入れ直す。
 */
export async function saveSubscriber(
	db: SubscriberDatabase,
	email: string,
	now: Date = new Date(),
): Promise<SubscribeOutcome> {
	const insert = () => db.prepare(INSERT_SQL).bind(email, now.toISOString(), PRIVACY_POLICY_VERSION).run();
	let result: { meta: { changes: number } };
	try {
		result = await insert();
	} catch (error) {
		if (!isMissingTableError(error)) throw error;
		await db.prepare(CREATE_TABLE_SQL).run();
		result = await insert();
	}
	return result.meta.changes > 0 ? "created" : "already_subscribed";
}
