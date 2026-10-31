import { describe, expect, it } from "vitest";
import { MAX_FORM_BYTES, parseLimitedForm, readBodyWithLimit } from "../src/utils/request-body";

function chunkedRequest(chunks: Uint8Array[], contentType = "application/x-www-form-urlencoded"): Request {
	let pulled = 0;
	const stream = new ReadableStream<Uint8Array>({
		pull(controller) {
			const chunk = chunks[pulled++];
			if (chunk) controller.enqueue(chunk);
			else controller.close();
		},
	});
	// Content-Length を付けない本文（Transfer-Encoding: chunked と同じ扱い）
	return new Request("https://site.example/api/subscribe", {
		method: "POST",
		body: stream,
		headers: { "content-type": contentType },
		duplex: "half",
	} as RequestInit & { duplex: "half" });
}

describe("readBodyWithLimit", () => {
	it("is 16 KiB", () => {
		expect(MAX_FORM_BYTES).toBe(16384);
	});

	it("rejects a declared Content-Length over the limit without reading", async () => {
		const request = new Request("https://site.example/", {
			method: "POST",
			body: "x",
			headers: { "content-length": String(MAX_FORM_BYTES + 1) },
		});
		await expect(readBodyWithLimit(request)).resolves.toEqual({ ok: false, reason: "too_large" });
		expect(request.bodyUsed).toBe(false);
	});

	it("accepts a body of exactly the limit", async () => {
		const result = await readBodyWithLimit(chunkedRequest([new Uint8Array(MAX_FORM_BYTES)]));
		expect(result.ok && result.body.byteLength).toBe(MAX_FORM_BYTES);
	});

	it("stops reading a chunked body as soon as it passes the limit", async () => {
		const chunk = new Uint8Array(4096);
		let pulls = 0;
		const stream = new ReadableStream<Uint8Array>({
			pull(controller) {
				pulls++;
				controller.enqueue(chunk); // 終わらない本文
			},
		});
		const request = new Request("https://site.example/", {
			method: "POST",
			body: stream,
			duplex: "half",
		} as RequestInit & { duplex: "half" });
		await expect(readBodyWithLimit(request)).resolves.toEqual({ ok: false, reason: "too_large" });
		// 16 KiB を超えた 5 回目で止まる（先読みの分を見込んでも 1 MB まで読み続けない）
		expect(pulls).toBeLessThan(10);
	});

	it("rejects a malformed Content-Length", async () => {
		const request = new Request("https://site.example/", { method: "POST", body: "a", headers: { "content-length": "abc" } });
		await expect(readBodyWithLimit(request)).resolves.toEqual({ ok: false, reason: "unreadable" });
	});
});

describe("parseLimitedForm", () => {
	it("parses urlencoded and multipart bodies under the limit", async () => {
		const encoded = new TextEncoder().encode("email=a%40b.cd&consent=yes");
		const urlencoded = await parseLimitedForm(chunkedRequest([encoded.slice(0, 5), encoded.slice(5)]));
		expect(urlencoded.ok && urlencoded.form.get("email")).toBe("a@b.cd");

		const fd = new FormData();
		fd.append("email", "a@b.cd");
		const multipart = await parseLimitedForm(new Request("https://site.example/", { method: "POST", body: fd }));
		expect(multipart.ok && multipart.form.get("email")).toBe("a@b.cd");
	});

	it("returns too_large for a chunked body over the limit", async () => {
		const result = await parseLimitedForm(chunkedRequest([new Uint8Array(10_000), new Uint8Array(10_000)]));
		expect(result).toEqual({ ok: false, reason: "too_large" });
	});

	it("returns unreadable without a Content-Type", async () => {
		const request = new Request("https://site.example/", { method: "POST", body: new Uint8Array([1, 2, 3]) });
		request.headers.delete("content-type");
		expect((await parseLimitedForm(request)).ok).toBe(false);
	});
});
