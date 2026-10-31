import type { APIRoute } from "astro";
import { decodeSlug, getEmDashEntry, getSiteSettings } from "emdash";
import { courseStepForTags } from "../../../utils/course";
import { resolveStarterSiteIdentity } from "../../../utils/site-identity";
import { escapeXml } from "../../../utils/sitemap";

export const prerender = false;

const WIDTH = 1200;
const HEIGHT = 630;
const FONT_SIZE = 60;
const LINE_HEIGHT = 84;
const MAX_LINES = 4;
// 全角文字を1として幅を数え、1行に入る幅を決める（60px の文字で、左の余白 80px と同じだけ右にも余白が残る幅）
const MAX_LINE_UNITS = 16;

// ASCII は文字ごとに幅が違う。フォントを同梱しないので、Chromium の代替フォントで測った字幅（大文字は最大 0.78、M・W・m・w は 0.78〜0.94）より広めに見積もる
const NARROW_ASCII = /[ !'(),\-./:;I\[\]`fijlrt|]/;
const WIDE_ASCII = /[MW@%mw]/;

function charUnits(grapheme: string): number {
	if (grapheme.length !== 1 || !/[\x20-\x7e]/.test(grapheme)) return 1;
	if (NARROW_ASCII.test(grapheme)) return 0.4;
	if (WIDE_ASCII.test(grapheme)) return 1;
	if (/[A-Z0-9&]/.test(grapheme)) return 0.8;
	return 0.65;
}

// XML 1.0 で使えない文字（タブ・改行以外の制御文字、対になっていないサロゲートなど）は SVG を壊すので取り除く
function stripInvalidXmlChars(value: string): string {
	return value.replace(/[^\t\n\r\x20-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, "");
}

function svgText(value: string): string {
	return escapeXml(stripInvalidXmlChars(value));
}

const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });

/** 日本語は単語の区切りが無いので、見た目の1文字（書記素）ずつ幅を足して折り返す。国旗や ZWJ の絵文字を途中で割らない */
function wrapTitle(title: string): string[] {
	const graphemes = Array.from(segmenter.segment(stripInvalidXmlChars(title).trim()), (s) => s.segment);
	const lines: string[][] = [];
	let current: string[] = [];
	let units = 0;
	for (const g of graphemes) {
		const w = charUnits(g);
		if (units + w > MAX_LINE_UNITS && current.length > 0) {
			lines.push(current);
			current = [];
			units = 0;
		}
		if (current.length === 0 && g === " ") continue;
		current.push(g);
		units += w;
	}
	if (current.length > 0) lines.push(current);
	if (lines.length > MAX_LINES) {
		const kept = lines.slice(0, MAX_LINES);
		kept[MAX_LINES - 1] = [...kept[MAX_LINES - 1].slice(0, -1), "…"];
		return kept.map((line) => line.join(""));
	}
	return lines.map((line) => line.join(""));
}

/**
 * 記事タイトルから OGP 画像（SVG）を作る。外部サービスもフォントの同梱も使わない。
 * X や Facebook は og:image の SVG を表示しないため、SNS で画像を出したい記事は
 * SEO パネルの OG Image（PNG/JPEG）を設定する。そちらがあれば記事ページはそれを優先する。
 */
export const GET: APIRoute = async ({ params }) => {
	const slug = decodeSlug(params.slug);
	if (!slug) return new Response("Not found", { status: 404 });
	const { entry: post } = await getEmDashEntry("posts", slug);
	if (!post) return new Response("Not found", { status: 404 });

	const { siteTitle } = resolveStarterSiteIdentity(await getSiteSettings());
	const course = courseStepForTags(post.data.terms?.tag ?? []);
	const eyebrow = course ? `入門ステップ講座 ${course.step.no} / ${course.step.name}` : "記事";
	const lines = wrapTitle(post.data.title);
	const titleTop = (HEIGHT - lines.length * LINE_HEIGHT) / 2 + FONT_SIZE * 0.8;

	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${svgText(post.data.title)}">
	<rect width="${WIDTH}" height="${HEIGHT}" fill="#f6f5f1"/>
	<rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" rx="24" fill="#ffffff" stroke="#dedbd2" stroke-width="2"/>
	<g font-family="'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif" fill="#1a1d21">
		<text x="80" y="120" font-size="28" font-weight="700" fill="#c2571a">${svgText(eyebrow)}</text>
		${lines
			.map(
				(line, i) =>
					`<text x="80" y="${Math.round(titleTop + i * LINE_HEIGHT)}" font-size="${FONT_SIZE}" font-weight="800">${svgText(line)}</text>`,
			)
			.join("\n\t\t")}
		<text x="80" y="${HEIGHT - 80}" font-size="30" font-weight="700" fill="#3f444b">${svgText(siteTitle)}</text>
	</g>
</svg>
`;
	return new Response(svg, {
		headers: {
			"Content-Type": "image/svg+xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
