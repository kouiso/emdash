import type { APIRoute } from "astro";
import { getEmDashCollection, getSeoMeta } from "emdash";
import { getSiteOrigin, siteUrlFor } from "../utils/site-origin";
import {
	collectionSitemapPaths,
	countListedEntries,
	escapeXml,
	sitemapUnavailable,
	xmlResponse,
} from "../utils/sitemap";

export const prerender = false;

// EmDash の組み込みサイトマップは、SEO と URL パターンを持つコレクション（posts と pages）の
// 子サイトマップ /sitemap-{collection}.xml を作るが、トップや記事一覧、タグなどの
// サイト側で書いたページは含まない（https://docs.emdashcms.com/guides/seo/ 2026-10-31 確認）。
// そこでインデックスだけを差し替え、組み込みの子サイトマップと /static-sitemap.xml を並べる。
const COLLECTIONS = ["posts", "pages"] as const;
const PAGE_SIZE = 500;

export const GET: APIRoute = async ({ url }) => {
	const siteUrl = getSiteOrigin(url);
	const paths = ["/static-sitemap.xml"];
	try {
		for (const collection of COLLECTIONS) {
			const count = await countListedEntries(async (cursor) => {
				const result = await getEmDashCollection(collection, { status: "published", limit: PAGE_SIZE, cursor });
				return {
					error: result.error,
					nextCursor: result.nextCursor,
					hasMore: result.hasMore,
					items: result.entries.map((entry) => ({
						slug: entry.data.slug,
						robots: getSeoMeta(entry, { siteTitle: "", siteUrl, path: `/${entry.id}` }).robots,
					})),
				};
			});
			paths.push(...collectionSitemapPaths(collection, count));
		}
	} catch (error) {
		// エラーのまま件数を 0 と数えると、記事があるのに子サイトマップが消えたインデックスを 1 時間キャッシュさせてしまう
		console.error("[sitemap] failed to count entries", error);
		return sitemapUnavailable();
	}
	const items = paths.map((path) => `\t<sitemap><loc>${escapeXml(siteUrlFor(path, url))}</loc></sitemap>`).join("\n");
	return xmlResponse(
		`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`,
	);
};
