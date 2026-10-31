import { readEnv } from "./env";

/**
 * EMDASH_SITE_URL（または SITE_URL）が URL の形なら、そのオリジン。無いか URL の形でなければ null。
 * EmDash も同じ変数を同じ順で読み、URL の形でない値は使わない（docs/decisions/site-url.md の確認結果）。
 */
export function getConfiguredSiteOrigin(): string | null {
	for (const name of ["EMDASH_SITE_URL", "SITE_URL"]) {
		const value = readEnv(name);
		if (!value) continue;
		try {
			const url = new URL(value);
			if (url.protocol === "https:" || url.protocol === "http:") return url.origin;
		} catch {
			// URL の形でない値（仮の REPLACE_WITH_... など）は使わない
		}
	}
	return null;
}

/**
 * canonical、og:url、OGP 画像、sitemap に書く絶対 URL のオリジン。
 * リクエストの Host をそのまま使うと、別のホスト名（version URL や、Host を書き換えた
 * リクエスト）で開かれたときにそのホスト名が canonical や sitemap に載るので、設定した値を優先する。
 * 設定が無いローカル開発では、開いたアドレスを使う。
 */
export function getSiteOrigin(requestUrl: URL): string {
	return getConfiguredSiteOrigin() ?? requestUrl.origin;
}

/** サイトのオリジンを基準にした絶対 URL */
export function siteUrlFor(path: string, requestUrl: URL): string {
	return new URL(path, getSiteOrigin(requestUrl)).href;
}
