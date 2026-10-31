import type { APIRoute } from "astro";
import { getTaxonomyTerms } from "emdash";
import { siteUrlFor } from "../utils/site-origin";
import { escapeXml, xmlResponse } from "../utils/sitemap";

export const prerender = false;

// EmDash のコレクションに入っていない、サイト側で書いたページ。
// 記事と固定ページは組み込みの /sitemap-posts.xml と /sitemap-pages.xml が持つ
const FIXED_PATHS = ["/", "/posts", "/privacy"];

type Term = { slug: string; children?: Term[] };

function flatten(terms: Term[]): Term[] {
	return terms.flatMap((term) => [term, ...flatten(term.children ?? [])]);
}

export const GET: APIRoute = async ({ url }) => {
	const [tags, categories] = await Promise.all([getTaxonomyTerms("tag"), getTaxonomyTerms("category")]);
	const paths = [
		...FIXED_PATHS,
		...flatten(tags).map((t) => `/tag/${encodeURIComponent(t.slug)}`),
		...flatten(categories).map((c) => `/category/${encodeURIComponent(c.slug)}`),
	];
	const items = paths
		.map((path) => `\t<url><loc>${escapeXml(siteUrlFor(path, url))}</loc></url>`)
		.join("\n");
	return xmlResponse(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`,
	);
};
