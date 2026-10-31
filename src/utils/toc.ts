export interface TocItem {
	id: string;
	text: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/**
 * Portable Text の h2 ブロックから目次を作る。id は本文側の h2 に
 * 同じ順番で振る（posts/[slug].astro のインラインスクリプト）。
 */
export function buildToc(blocks: readonly unknown[] | undefined): TocItem[] {
	if (!blocks) return [];
	const items: TocItem[] = [];
	for (const block of blocks) {
		if (!isRecord(block) || block._type !== "block" || block.style !== "h2") continue;
		const children = Array.isArray(block.children) ? block.children : [];
		const text = children
			.map((child: unknown) => (isRecord(child) && typeof child.text === "string" ? child.text : ""))
			.join("")
			.trim();
		if (text) items.push({ id: `sec-${items.length + 1}`, text });
	}
	return items;
}
