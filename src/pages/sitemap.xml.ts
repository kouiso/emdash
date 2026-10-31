import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { getEmDashCollection } from "emdash";
import { siteUrlFor } from "../utils/site-origin";
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

/**
 * 「検索エンジンに表示しない」にしたエントリの ULID。
 * getEmDashCollection の結果には SEO の値が入らず（getSeoMeta の robots も null になる。2026-10-31 にローカルで確認）、
 * 公開 API にまとめて引く関数も無い（https://docs.emdashcms.com/reference/api/ 2026-10-31 確認）。
 * そこで EmDash が SEO を保存している D1 の _emdash_seo を1回だけ読む。EmDash の内部のテーブルなので、
 * 版を上げたときは docs/decisions/sitemap.md の手順でこの列がまだあることを確かめる。
 * 読めなければ投げて 503 にする（黙って 0 件扱いにすると、404 の子サイトマップを載せてしまう）
 */
async function hiddenEntryIds(collection: string): Promise<Set<string>> {
	const { results } = await env.DB.prepare(
		"SELECT content_id FROM _emdash_seo WHERE collection = ?1 AND seo_no_index = 1",
	)
		.bind(collection)
		.all<{ content_id: string }>();
	return new Set(results.map((row) => row.content_id));
}

export const GET: APIRoute = async ({ url }) => {
	const paths = ["/static-sitemap.xml"];
	try {
		for (const collection of COLLECTIONS) {
			const hidden = await hiddenEntryIds(collection);
			const count = await countListedEntries(async (cursor) => {
				const result = await getEmDashCollection(collection, { status: "published", limit: PAGE_SIZE, cursor });
				return {
					error: result.error,
					nextCursor: result.nextCursor,
					hasMore: result.hasMore,
					items: result.entries.map((entry) => ({ slug: entry.data.slug, hidden: hidden.has(entry.data.id) })),
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
