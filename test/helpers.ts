import { DatabaseSync } from "node:sqlite";
import type { SubscriberDatabase } from "../src/utils/subscribers";

/**
 * D1 の prepare().bind().run() / prepare().run() と同じ形を node:sqlite で作る。
 * D1 も SQLite なので、SQL の解釈（ON CONFLICT、no such table のエラー文言）はそのまま確かめられる。
 */
export function createSqliteD1(): SubscriberDatabase & { sqlite: DatabaseSync; statements: string[] } {
	const sqlite = new DatabaseSync(":memory:");
	const statements: string[] = [];
	const run = (query: string, values: unknown[]) => {
		statements.push(query.replace(/\s+/g, " ").trim());
		// D1 の ?1 ?2 は node:sqlite でも番号付きの引数として読める
		const result = sqlite.prepare(query).run(...(values as (string | number | null)[]));
		return { meta: { changes: Number(result.changes) } };
	};
	return {
		sqlite,
		statements,
		prepare(query: string) {
			return {
				bind: (...values: unknown[]) => ({ run: async () => run(query, values) }),
				run: async () => run(query, []),
			};
		},
	};
}

export function countSubscribers(db: { sqlite: DatabaseSync }): number {
	const row = db.sqlite.prepare("SELECT COUNT(*) AS n FROM newsletter_subscribers").get() as { n: number };
	return Number(row.n);
}

/** siteverify の代わり。呼ばれた回数と送られた値を記録する */
export function fakeSiteverify(response: unknown, status = 200) {
	const calls: FormData[] = [];
	const impl: typeof fetch = async (_input, init) => {
		calls.push(init?.body as FormData);
		return new Response(JSON.stringify(response), { status, headers: { "content-type": "application/json" } });
	};
	return { impl, calls };
}

export function formRequest(
	url: string,
	fields: Record<string, string>,
	headers: Record<string, string> = {},
): Request {
	return new Request(url, {
		method: "POST",
		body: new URLSearchParams(fields),
		headers: { accept: "application/json", ...headers },
	});
}
