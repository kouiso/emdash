import { beforeEach, describe, expect, it } from "vitest";
import { handleSubscribe } from "../src/utils/subscribe-handler";
import { countSubscribers, createSqliteD1, formRequest } from "./helpers";
import { resetEnv } from "./stubs/cloudflare-workers";

const LOCAL = "http://localhost:8787/api/subscribe";

beforeEach(() => {
	resetEnv();
});

describe("handleSubscribe: body size", () => {
	it("returns 413 for a Content-Length over 16 KiB and saves nothing", async () => {
		const db = createSqliteD1();
		const request = formRequest(LOCAL, { email: "a@example.com", consent: "yes", pad: "a".repeat(20_000) });
		const response = await handleSubscribe(request, { db });
		expect(response.status).toBe(413);
		expect(await response.json()).toMatchObject({ ok: false, error: "too_large" });
		expect(db.statements).toEqual([]);
	});

	it("returns 413 for a chunked body over 16 KiB", async () => {
		const db = createSqliteD1();
		const encoder = new TextEncoder();
		const parts = [encoder.encode("email=a%40example.com&consent=yes&pad="), encoder.encode("a".repeat(8192)), encoder.encode("a".repeat(8192))];
		const stream = new ReadableStream<Uint8Array>({
			pull(controller) {
				const next = parts.shift();
				if (next) controller.enqueue(next);
				else controller.close();
			},
		});
		const request = new Request(LOCAL, {
			method: "POST",
			body: stream,
			headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
			duplex: "half",
		} as RequestInit & { duplex: "half" });
		expect(request.headers.get("content-length")).toBeNull();
		const response = await handleSubscribe(request, { db });
		expect(response.status).toBe(413);
		expect(db.statements).toEqual([]);
	});

	it("redirects a non-JS form post over the limit back to the form", async () => {
		const request = formRequest(LOCAL, { email: "a@example.com", consent: "yes", pad: "a".repeat(20_000) }, { accept: "text/html" });
		const response = await handleSubscribe(request, { db: createSqliteD1() });
		expect(response.status).toBe(303);
		expect(response.headers.get("location")).toBe("/?subscribe=too_large#gift");
	});

	it("accepts a normal local submission", async () => {
		const db = createSqliteD1();
		const response = await handleSubscribe(formRequest(LOCAL, { email: "A@Example.com", consent: "yes" }), { db });
		expect(response.status).toBe(200);
		expect(countSubscribers(db)).toBe(1);
	});
});

describe("handleSubscribe: validation", () => {
	it("rejects a cross-origin browser post", async () => {
		const response = await handleSubscribe(
			formRequest(LOCAL, { email: "a@example.com", consent: "yes" }, { origin: "https://evil.example" }),
			{ db: createSqliteD1() },
		);
		expect(response.status).toBe(403);
	});

	it("rejects a bad email and a missing consent", async () => {
		const db = createSqliteD1();
		const bad = await handleSubscribe(formRequest(LOCAL, { email: "=HYPERLINK(1)@a.b", consent: "yes" }), { db });
		expect(await bad.json()).toMatchObject({ error: "invalid_email" });
		const noConsent = await handleSubscribe(formRequest(LOCAL, { email: "a@example.com" }), { db });
		expect(await noConsent.json()).toMatchObject({ error: "consent_required" });
		expect(db.statements).toEqual([]);
	});
});
