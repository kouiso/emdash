import { beforeEach, describe, expect, it } from "vitest";
import { handleSubscribe } from "../src/utils/subscribe-handler";
import { getTurnstileMode, getTurnstileSiteKey, verifyTurnstileToken } from "../src/utils/turnstile";
import { countSubscribers, createSqliteD1, fakeSiteverify, formRequest } from "./helpers";
import { CONTACT, resetEnv } from "./stubs/cloudflare-workers";

const PROD = "https://ai-eng-blog.kouiso.workers.dev/api/subscribe";
const SITE_KEY = "1x00000000000000000000AA";
const SECRET = "1x0000000000000000000000000000000AA";

beforeEach(() => {
	resetEnv(CONTACT);
});

describe("getTurnstileMode", () => {
	it.each(["http://localhost:8787/", "http://127.0.0.1:8787/", "http://[::1]:4321/"])(
		"is disabled without keys on %s",
		(url) => {
			expect(getTurnstileMode(new URL(url))).toEqual({ kind: "disabled" });
		},
	);

	it.each([PROD, "https://example.com/", "http://localhost.evil.example/", "http://127.0.0.2/"])(
		"is unconfigured without keys on %s",
		(url) => {
			expect(getTurnstileMode(new URL(url))).toEqual({ kind: "unconfigured" });
		},
	);

	it("treats blank values as missing", () => {
		resetEnv({ ...CONTACT, PUBLIC_TURNSTILE_SITE_KEY: "  ", TURNSTILE_SECRET_KEY: "" });
		expect(getTurnstileMode(new URL(PROD)).kind).toBe("unconfigured");
	});

	it("is misconfigured with only one key, even on localhost", () => {
		resetEnv({ ...CONTACT, PUBLIC_TURNSTILE_SITE_KEY: SITE_KEY });
		expect(getTurnstileMode(new URL("http://localhost:8787/"))).toEqual({
			kind: "misconfigured",
			missing: "TURNSTILE_SECRET_KEY",
		});
		resetEnv({ ...CONTACT, TURNSTILE_SECRET_KEY: SECRET });
		expect(getTurnstileMode(new URL(PROD))).toEqual({ kind: "misconfigured", missing: "PUBLIC_TURNSTILE_SITE_KEY" });
	});

	it("is enabled with both keys and exposes only the site key", () => {
		resetEnv({ ...CONTACT, PUBLIC_TURNSTILE_SITE_KEY: SITE_KEY, TURNSTILE_SECRET_KEY: SECRET });
		expect(getTurnstileMode(new URL(PROD))).toEqual({ kind: "enabled", siteKey: SITE_KEY, secret: SECRET });
		expect(getTurnstileSiteKey(new URL(PROD))).toBe(SITE_KEY);
	});
});

describe("verifyTurnstileToken", () => {
	it("passes when siteverify succeeds for the expected hostname", async () => {
		const siteverify = fakeSiteverify({ success: true, hostname: "ai-eng-blog.kouiso.workers.dev" });
		await expect(verifyTurnstileToken(SECRET, "tok", "ai-eng-blog.kouiso.workers.dev", siteverify.impl)).resolves.toEqual({
			ok: true,
		});
		expect(siteverify.calls[0]?.get("secret")).toBe(SECRET);
		expect(siteverify.calls[0]?.get("response")).toBe("tok");
	});

	it("rejects a successful token issued for another hostname", async () => {
		const siteverify = fakeSiteverify({ success: true, hostname: "evil.example" });
		await expect(verifyTurnstileToken(SECRET, "tok", "ai-eng-blog.kouiso.workers.dev", siteverify.impl)).resolves.toEqual({
			ok: false,
			reason: "rejected",
		});
	});

	it("skips the hostname check for Cloudflare's testing keys (they always report example.com)", async () => {
		const siteverify = fakeSiteverify({
			success: true,
			hostname: "example.com",
			metadata: { result_with_testing_key: true },
		});
		expect(await verifyTurnstileToken(SECRET, "XXXX.DUMMY.TOKEN.XXXX", "localhost", siteverify.impl)).toEqual({ ok: true });
	});

	it("still checks the hostname when metadata.result_with_testing_key is not true", async () => {
		const siteverify = fakeSiteverify({ success: true, hostname: "example.com", metadata: { result_with_testing_key: "true" } });
		expect((await verifyTurnstileToken(SECRET, "tok", "localhost", siteverify.impl)).ok).toBe(false);
	});

	it("rejects a response without hostname", async () => {
		const siteverify = fakeSiteverify({ success: true });
		expect((await verifyTurnstileToken(SECRET, "tok", "site.example", siteverify.impl)).ok).toBe(false);
	});

	it("rejects success:false", async () => {
		const siteverify = fakeSiteverify({ success: false, "error-codes": ["invalid-input-response"] });
		await expect(verifyTurnstileToken(SECRET, "tok", "site.example", siteverify.impl)).resolves.toEqual({
			ok: false,
			reason: "rejected",
		});
	});

	it("does not call siteverify without a token or with an oversized one", async () => {
		const siteverify = fakeSiteverify({ success: true, hostname: "site.example" });
		expect(await verifyTurnstileToken(SECRET, null, "site.example", siteverify.impl)).toEqual({ ok: false, reason: "missing_token" });
		expect(await verifyTurnstileToken(SECRET, "x".repeat(2049), "site.example", siteverify.impl)).toEqual({
			ok: false,
			reason: "missing_token",
		});
		expect(siteverify.calls).toHaveLength(0);
	});

	it("reports unavailable for HTTP errors, bad JSON and network failures", async () => {
		expect(await verifyTurnstileToken(SECRET, "tok", "site.example", fakeSiteverify({}, 500).impl)).toEqual({
			ok: false,
			reason: "unavailable",
		});
		expect(await verifyTurnstileToken(SECRET, "tok", "site.example", fakeSiteverify({ nope: 1 }).impl)).toEqual({
			ok: false,
			reason: "unavailable",
		});
		const failing: typeof fetch = async () => {
			throw new TypeError("network down");
		};
		expect(await verifyTurnstileToken(SECRET, "tok", "site.example", failing)).toEqual({ ok: false, reason: "unavailable" });
	});
});

describe("handleSubscribe with Turnstile", () => {
	const fields = { email: "a@example.com", consent: "yes", "cf-turnstile-response": "tok" };

	it("refuses with 503 outside localhost when no keys are set, and saves nothing", async () => {
		const db = createSqliteD1();
		const response = await handleSubscribe(formRequest(PROD, fields), { db });
		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({ error: "unavailable" });
		expect(db.statements).toEqual([]);
	});

	it("saves on localhost without keys", async () => {
		const db = createSqliteD1();
		const response = await handleSubscribe(formRequest("http://127.0.0.1:8787/api/subscribe", fields), { db });
		expect(response.status).toBe(200);
		expect(countSubscribers(db)).toBe(1);
	});

	it("refuses with 503 when only one key is set", async () => {
		resetEnv({ ...CONTACT, TURNSTILE_SECRET_KEY: SECRET });
		const response = await handleSubscribe(formRequest(PROD, fields), { db: createSqliteD1() });
		expect(response.status).toBe(503);
	});

	it("verifies against the request hostname and saves on success", async () => {
		resetEnv({ ...CONTACT, PUBLIC_TURNSTILE_SITE_KEY: SITE_KEY, TURNSTILE_SECRET_KEY: SECRET });
		const db = createSqliteD1();
		const siteverify = fakeSiteverify({ success: true, hostname: "ai-eng-blog.kouiso.workers.dev" });
		const response = await handleSubscribe(formRequest(PROD, fields), { db, fetchImpl: siteverify.impl });
		expect(response.status).toBe(200);
		expect(countSubscribers(db)).toBe(1);
	});

	it("returns captcha_failed for a hostname mismatch and captcha_unavailable when siteverify is down", async () => {
		resetEnv({ ...CONTACT, PUBLIC_TURNSTILE_SITE_KEY: SITE_KEY, TURNSTILE_SECRET_KEY: SECRET });
		const db = createSqliteD1();
		const mismatch = await handleSubscribe(formRequest(PROD, fields), {
			db,
			fetchImpl: fakeSiteverify({ success: true, hostname: "evil.example" }).impl,
		});
		expect(mismatch.status).toBe(400);
		expect(await mismatch.json()).toMatchObject({ error: "captcha_failed" });
		const down = await handleSubscribe(formRequest(PROD, fields), { db, fetchImpl: fakeSiteverify({}, 502).impl });
		expect(down.status).toBe(503);
		expect(await down.json()).toMatchObject({ error: "captcha_unavailable" });
		expect(db.statements).toEqual([]);
	});
});
