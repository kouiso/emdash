import { beforeEach, describe, expect, it } from "vitest";
import { getContactEmail, getSubscribeAvailability } from "../src/utils/subscribe-availability";
import { handleSubscribe } from "../src/utils/subscribe-handler";
import { SUBSCRIBE_MESSAGES } from "../src/utils/subscribe-messages";
import { createSqliteD1, formRequest } from "./helpers";
import { CONTACT, resetEnv } from "./stubs/cloudflare-workers";

const LOCAL = new URL("http://localhost:8787/");
const PROD = new URL("https://ai-eng-blog.kouiso.workers.dev/");
const KEYS = { PUBLIC_TURNSTILE_SITE_KEY: "site-key", TURNSTILE_SECRET_KEY: "secret" };

beforeEach(() => {
	resetEnv();
});

describe("getSubscribeAvailability", () => {
	it("is closed without a contact address, even on localhost", () => {
		expect(getSubscribeAvailability(LOCAL)).toEqual({ open: false, reason: "no_contact" });
	});

	it("ignores a contact value that is not an email address", () => {
		resetEnv({ PUBLIC_CONTACT_EMAIL: "[連絡先]" });
		expect(getContactEmail()).toBeNull();
		expect(getSubscribeAvailability(LOCAL)).toEqual({ open: false, reason: "no_contact" });
	});

	it("is open on localhost with a contact and no Turnstile keys", () => {
		resetEnv(CONTACT);
		expect(getSubscribeAvailability(LOCAL)).toEqual({ open: true, turnstileSiteKey: undefined });
	});

	it("is closed in production until both Turnstile keys are set", () => {
		resetEnv(CONTACT);
		expect(getSubscribeAvailability(PROD)).toEqual({ open: false, reason: "no_turnstile" });
		resetEnv({ ...CONTACT, PUBLIC_TURNSTILE_SITE_KEY: "site-key" });
		expect(getSubscribeAvailability(PROD)).toEqual({ open: false, reason: "no_turnstile" });
		resetEnv({ ...CONTACT, ...KEYS });
		expect(getSubscribeAvailability(PROD)).toEqual({ open: true, turnstileSiteKey: "site-key" });
	});
});

describe("handleSubscribe without a contact address", () => {
	it("returns 503 and saves nothing", async () => {
		const db = createSqliteD1();
		const response = await handleSubscribe(formRequest(LOCAL.href + "api/subscribe", { email: "a@example.com", consent: "yes" }), { db });
		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({ error: "unavailable" });
		expect(db.statements).toEqual([]);
	});
});

describe("success message", () => {
	it("does not promise to send the gift by email", () => {
		expect(SUBSCRIBE_MESSAGES.ok).not.toMatch(/特典.*お送りします/);
		expect(SUBSCRIBE_MESSAGES.ok).toContain("まだ始めていません");
	});
});
