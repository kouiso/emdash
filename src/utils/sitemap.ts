export function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export function xmlResponse(body: string): Response {
	return new Response(body, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}

/** 組み込みの子サイトマップ1ファイルの上限（https://docs.emdashcms.com/guides/seo/ 2026-10-31 確認） */
export const ENTRIES_PER_SITEMAP = 2000;

/** サイトマップに載るかどうかの判定に使う、エントリ1件分の値 */
export interface SitemapCandidate {
	slug: string | null;
	/** SEO パネルの「検索エンジンに表示しない」が付いている */
	hidden: boolean;
}

export interface SitemapPage {
	items: SitemapCandidate[];
	error?: unknown;
	nextCursor?: string;
	hasMore?: boolean;
}

/**
 * 組み込みの子サイトマップが載せるのは「公開済み・削除されていない・slug がある・検索エンジンから隠していない」
 * エントリ（docs の SEO ガイド）。公開済みで削除されていないものだけを fetchPage が返し、残りの2条件をここで見る。
 * 取得がエラーを返したら投げる。件数を数え損ねたまま 404 の子サイトマップを載せないため。
 */
export async function countListedEntries(fetchPage: (cursor: string | undefined) => Promise<SitemapPage>): Promise<number> {
	let count = 0;
	let cursor: string | undefined;
	for (;;) {
		const page = await fetchPage(cursor);
		if (page.error) throw page.error instanceof Error ? page.error : new Error(String(page.error));
		count += page.items.filter((item) => Boolean(item.slug) && !item.hidden).length;
		if (!page.hasMore || !page.nextCursor || page.nextCursor === cursor) break;
		cursor = page.nextCursor;
	}
	return count;
}

/** 載せる件数から子サイトマップのパスを作る。0 件のコレクションは組み込みの子サイトマップが 404 になるので載せない */
export function collectionSitemapPaths(collection: string, listedCount: number): string[] {
	const pages = Math.ceil(listedCount / ENTRIES_PER_SITEMAP);
	return Array.from({ length: pages }, (_, i) =>
		i === 0 ? `/sitemap-${collection}.xml` : `/sitemap-${collection}-${i + 1}.xml`,
	);
}

/** サイトマップを作れなかったときの応答。キャッシュさせず、クローラーには後でやり直してもらう */
export function sitemapUnavailable(): Response {
	return new Response("Sitemap temporarily unavailable\n", {
		status: 503,
		headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "300" },
	});
}
