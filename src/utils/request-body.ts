/**
 * 登録フォームの本文の上限。メールアドレス（254 文字）、同意、Turnstile のトークン（最大 2048 文字）と
 * multipart の区切りを足しても 4 KB に届かないので、余裕を見て 16 KB にする。
 */
export const MAX_FORM_BYTES = 16 * 1024;

export type LimitedBody = { ok: true; body: Uint8Array<ArrayBuffer> } | { ok: false; reason: "too_large" | "unreadable" };

/**
 * 本文を上限まで読む。Content-Length が上限を超えていれば読まずに断る。
 * Content-Length の無い chunked の本文も、読んだ量が上限を超えた時点で読むのをやめて断る。
 * request.formData() は上限なしに全部をメモリに読むので、その前にここを通す。
 */
export async function readBodyWithLimit(request: Request, maxBytes: number = MAX_FORM_BYTES): Promise<LimitedBody> {
	const declared = request.headers.get("content-length");
	if (declared !== null) {
		const length = Number(declared);
		if (!Number.isFinite(length) || length < 0) return { ok: false, reason: "unreadable" };
		if (length > maxBytes) return { ok: false, reason: "too_large" };
	}
	if (request.body === null) return { ok: true, body: new Uint8Array(0) };

	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			total += value.byteLength;
			if (total > maxBytes) {
				await reader.cancel().catch(() => undefined);
				return { ok: false, reason: "too_large" };
			}
			chunks.push(value);
		}
	} catch {
		return { ok: false, reason: "unreadable" };
	}

	const body = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		body.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return { ok: true, body };
}

/** 上限内で読んだ本文を、元の Content-Type のままフォームとして読む */
export async function parseLimitedForm(request: Request, maxBytes: number = MAX_FORM_BYTES): Promise<
	{ ok: true; form: FormData } | { ok: false; reason: "too_large" | "unreadable" }
> {
	const read = await readBodyWithLimit(request, maxBytes);
	if (!read.ok) return read;
	const contentType = request.headers.get("content-type");
	if (contentType === null) return { ok: false, reason: "unreadable" };
	try {
		const form = await new Response(read.body, { headers: { "content-type": contentType } }).formData();
		return { ok: true, form };
	} catch {
		return { ok: false, reason: "unreadable" };
	}
}
