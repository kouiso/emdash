import { beforeEach, describe, expect, it } from "vitest";
import { getConfiguredSiteOrigin, getSiteOrigin, siteUrlFor } from "../src/utils/site-origin";
import { resetEnv } from "./stubs/cloudflare-workers";

const PROD = "https://ai-eng-blog.kouiso.workers.dev";

beforeEach(() => {
	resetEnv();
});

describe("getSiteOrigin", () => {
	it("uses EMDASH_SITE_URL instead of the request host", () => {
		resetEnv({ EMDASH_SITE_URL: PROD });
		expect(getSiteOrigin(new URL("http://evil.example/privacy"))).toBe(PROD);
		expect(siteUrlFor("/static-sitemap.xml", new URL("https://abc123-ai-eng-blog.kouiso.workers.dev/"))).toBe(
			`${PROD}/static-sitemap.xml`,
		);
	});

	it("drops a path or trailing slash in the configured value", () => {
		resetEnv({ EMDASH_SITE_URL: `${PROD}/blog/` });
		expect(getConfiguredSiteOrigin()).toBe(PROD);
	});

	it("falls back to SITE_URL, then to the request origin", () => {
		resetEnv({ SITE_URL: "https://example.org" });
		expect(getSiteOrigin(new URL("http://localhost:8787/"))).toBe("https://example.org");
		resetEnv();
		expect(getSiteOrigin(new URL("http://localhost:8787/x"))).toBe("http://localhost:8787");
	});

	it.each(["REPLACE_WITH_WORKERS_DEV_URL", "ftp://example.org", "javascript:alert(1)", "   "])(
		"ignores a value that is not an http(s) URL: %j",
		(value) => {
			resetEnv({ EMDASH_SITE_URL: value });
			expect(getSiteOrigin(new URL("http://127.0.0.1:8787/"))).toBe("http://127.0.0.1:8787");
		},
	);
});
