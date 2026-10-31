/**
 * 入門ステップ講座の並び。CLAUDE.md の「読者と講座の順番」と同じ6語で、
 * slug は seed/seed.json の tag タクソノミーの term と一致させている。
 */
export interface CourseStep {
	no: string;
	slug: string;
	name: string;
	desc: string;
	lead: string;
}

export const COURSE_STEPS: readonly CourseStep[] = [
	{
		no: "01",
		slug: "llm-api",
		name: "LLM API",
		desc: "API キーを取って、最初の1回を呼ぶ",
		lead: "API キーを取るところから、自分のコードで LLM を1回呼んで返事を受け取るところまでの記事です。上から順に読むと、料金の確かめ方も含めて最初の1回を動かせます。",
	},
	{
		no: "02",
		slug: "structured-output",
		name: "構造化出力",
		desc: "返答を JSON で受け取り、型で検証する",
		lead: "LLM の返事を JSON で受け取り、型で検証してからアプリで使う作り方の記事です。上から順に読むと、返事の形が崩れたときの扱いまで一通り書けます。",
	},
	{
		no: "03",
		slug: "rag",
		name: "RAG",
		desc: "自分のデータを検索して答えさせる",
		lead: "自分のデータを検索して、その結果をもとに AI に答えさせる作り方の記事です。上から順に読むと、検索の部分から答えを出す部分まで一通り作れます。",
	},
	{
		no: "04",
		slug: "ai-agent",
		name: "AIエージェント",
		desc: "ツールを呼びながら作業を進めさせる",
		lead: "LLM にツールを呼ばせながら、何手かに分けて作業を進めさせる作り方の記事です。上から順に読むと、ツールの定義から止めどころの決め方まで作れます。",
	},
	{
		no: "05",
		slug: "mcp-server",
		name: "MCPサーバー",
		desc: "自分のツールを AI から使えるようにする",
		lead: "自分で書いたツールを MCP サーバーにして、AI から呼べるようにする記事です。上から順に読むと、サーバーを立てて Claude からつなぐところまで動かせます。",
	},
	{
		no: "06",
		slug: "llm-eval",
		name: "LLM 評価",
		desc: "答えの質を測って、本番に出せるか判断する",
		lead: "LLM の答えの質を測り、本番に出してよいかを判断する方法の記事です。上から順に読むと、評価用のデータを作って結果を比べるところまでできます。",
	},
];

export function findCourseStep(slug: string | null | undefined): {
	step: CourseStep;
	prev: CourseStep | null;
	next: CourseStep | null;
} | null {
	if (!slug) return null;
	const index = COURSE_STEPS.findIndex((s) => s.slug === slug);
	if (index === -1) return null;
	return {
		step: COURSE_STEPS[index]!,
		prev: COURSE_STEPS[index - 1] ?? null,
		next: COURSE_STEPS[index + 1] ?? null,
	};
}

/** 記事に付いたタグのうち、最初に見つかった講座ステップを返す */
export function courseStepForTags(
	tags: readonly { slug: string }[],
): ReturnType<typeof findCourseStep> {
	for (const tag of tags) {
		const found = findCourseStep(tag.slug);
		if (found) return found;
	}
	return null;
}

export function formatDateJa(date: Date): string {
	return date.toLocaleDateString("ja-JP", {
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: "Asia/Tokyo",
	});
}
