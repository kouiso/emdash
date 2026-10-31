import { describe, expect, it } from "vitest";
import { collectionSitemapPaths, countListedEntries, ENTRIES_PER_SITEMAP, type SitemapPage } from "../src/utils/sitemap";

const listed = { slug: "a", hidden: false };

describe("countListedEntries", () => {
	it("skips entries without a slug and entries hidden from search engines", async () => {
		const count = await countListedEntries(async () => ({
			items: [listed, { slug: null, hidden: false }, { slug: "b", hidden: true }, { slug: "c", hidden: false }],
		}));
		expect(count).toBe(2);
	});

	it("follows the cursor until hasMore is false", async () => {
		const pages: Record<string, SitemapPage> = {
			start: { items: [listed, listed], hasMore: true, nextCursor: "p2" },
			p2: { items: [listed], hasMore: true, nextCursor: "p3" },
			p3: { items: [listed], hasMore: false },
		};
		const seen: (string | undefined)[] = [];
		const count = await countListedEntries(async (cursor) => {
			seen.push(cursor);
			return pages[cursor ?? "start"]!;
		});
		expect(count).toBe(4);
		expect(seen).toEqual([undefined, "p2", "p3"]);
	});

	it("stops if the cursor does not move", async () => {
		const count = await countListedEntries(async () => ({ items: [listed], hasMore: true, nextCursor: "same" }));
		expect(count).toBe(2);
	});

	it("throws when the query returns an error instead of counting zero", async () => {
		await expect(countListedEntries(async () => ({ items: [], error: new Error("D1 down") }))).rejects.toThrow("D1 down");
	});
});

describe("collectionSitemapPaths", () => {
	it("lists nothing for zero entries (the built-in child sitemap would 404)", () => {
		expect(collectionSitemapPaths("posts", 0)).toEqual([]);
	});

	it("uses -2, -3 suffixes per 2,000 entries", () => {
		expect(collectionSitemapPaths("posts", 1)).toEqual(["/sitemap-posts.xml"]);
		expect(collectionSitemapPaths("posts", ENTRIES_PER_SITEMAP)).toEqual(["/sitemap-posts.xml"]);
		expect(collectionSitemapPaths("posts", ENTRIES_PER_SITEMAP + 1)).toEqual(["/sitemap-posts.xml", "/sitemap-posts-2.xml"]);
		expect(collectionSitemapPaths("pages", ENTRIES_PER_SITEMAP * 2 + 1)).toEqual([
			"/sitemap-pages.xml",
			"/sitemap-pages-2.xml",
			"/sitemap-pages-3.xml",
		]);
	});
});
