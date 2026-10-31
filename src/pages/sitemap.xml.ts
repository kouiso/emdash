import type { APIRoute } from "astro";
import { getEmDashCollection } from "emdash";
import { escapeXml, xmlResponse } from "../utils/sitemap";

export const prerender = false;

// EmDash の組み込みサイトマップは、SEO と URL パターンを持つコレクション（posts と pages）の
// 子サイトマップ /sitemap-{collection}.xml を作るが、トップや記事一覧、タグなどの
// サイト側で書いたページは含まない（https://docs.emdashcms.com/guides/seo/ 2026-10-31 確認）。
// そこでインデックスだけを差し替え、組み込みの子サイトマップと /static-sitemap.xml を並べる。
const COLLECTIONS = ["posts", "pages"] as const;
// 組み込みの子サイトマップは1ファイル 2,000 件まで。超えた分は -2, -3 … に続く（同ドキュメント）
const ENTRIES_PER_SITEMAP = 2000;

async function collectionSitemapPaths(collection: string): Promise<string[]> {
	const paths: string[] = [];
	// offset で各ファイルの先頭に1件でもあるかを見て、ページ数を数える。
	// 公開済みが0件のコレクションは組み込みの子サイトマップが 404 を返すので載せない
	for (let page = 1; ; page++) {
		const { entries } = await getEmDashCollection(collection, {
			status: "published",
			limit: 1,
			offset: ENTRIES_PER_SITEMAP * (page - 1),
		});
		if (entries.length === 0) break;
		paths.push(page === 1 ? `/sitemap-${collection}.xml` : `/sitemap-${collection}-${page}.xml`);
	}
	return paths;
}

export const GET: APIRoute = async ({ url }) => {
	const paths = ["/static-sitemap.xml"];
	for (const collection of COLLECTIONS) {
		paths.push(...(await collectionSitemapPaths(collection)));
	}
	const items = paths
		.map((path) => `\t<sitemap><loc>${escapeXml(new URL(path, url.origin).href)}</loc></sitemap>`)
		.join("\n");
	return xmlResponse(
		`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`,
	);
};
