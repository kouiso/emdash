import { describe, expect, it } from "vitest";
import { PRIVACY_POLICY_VERSION, saveSubscriber, type SubscriberDatabase } from "../src/utils/subscribers";
import { createSqliteD1 } from "./helpers";

const NOW = new Date("2026-10-31T01:02:03.000Z");

describe("saveSubscriber", () => {
	it("creates the table only when the first INSERT finds none", async () => {
		const db = createSqliteD1();
		await expect(saveSubscriber(db, "a@example.com", NOW)).resolves.toBe("created");
		expect(db.statements.map((sql) => sql.split(" ").slice(0, 2).join(" "))).toEqual([
			"INSERT INTO",
			"CREATE TABLE",
			"INSERT INTO",
		]);
	});

	it("runs a single INSERT once the table exists", async () => {
		const db = createSqliteD1();
		await saveSubscriber(db, "a@example.com", NOW);
		db.statements.length = 0;
		await expect(saveSubscriber(db, "b@example.com", NOW)).resolves.toBe("created");
		expect(db.statements).toHaveLength(1);
		expect(db.statements[0]).toMatch(/^INSERT INTO newsletter_subscribers/);
	});

	it("keeps the first consent and reports already_subscribed", async () => {
		const db = createSqliteD1();
		await saveSubscriber(db, "a@example.com", NOW);
		await expect(saveSubscriber(db, "a@example.com", new Date("2027-01-01T00:00:00Z"))).resolves.toBe("already_subscribed");
		const rows = db.sqlite.prepare("SELECT * FROM newsletter_subscribers").all();
		expect(rows).toEqual([
			{
				email: "a@example.com",
				created_at: NOW.toISOString(),
				consent_at: NOW.toISOString(),
				consent_policy_version: PRIVACY_POLICY_VERSION,
			},
		]);
	});

	it("rethrows errors other than the missing table without creating anything", async () => {
		const statements: string[] = [];
		const failing: SubscriberDatabase = {
			prepare(query) {
				statements.push(query);
				const fail = async (): Promise<never> => {
					throw new Error("D1_ERROR: database is locked: SQLITE_BUSY");
				};
				return { bind: () => ({ run: fail }), run: fail };
			},
		};
		await expect(saveSubscriber(failing, "a@example.com", NOW)).rejects.toThrow("SQLITE_BUSY");
		expect(statements).toHaveLength(1);
	});

	it("recognises the D1 wording of the missing-table error", async () => {
		let calls = 0;
		const d1Like: SubscriberDatabase = {
			prepare(query) {
				return {
					bind: () => ({
						run: async () => {
							calls++;
							if (calls === 1) throw new Error("D1_ERROR: no such table: newsletter_subscribers: SQLITE_ERROR");
							return { meta: { changes: 1 } };
						},
					}),
					run: async () => {
						expect(query).toMatch(/^CREATE TABLE IF NOT EXISTS newsletter_subscribers/);
						return {};
					},
				};
			},
		};
		await expect(saveSubscriber(d1Like, "a@example.com", NOW)).resolves.toBe("created");
		expect(calls).toBe(2);
	});
});
