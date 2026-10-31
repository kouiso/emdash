import { normalizeEmail } from "./email";
import { parseLimitedForm } from "./request-body";
import { SUBSCRIBE_HTTP_STATUS, SUBSCRIBE_MESSAGES, type SubscribeStatus } from "./subscribe-messages";
import { getContactEmail } from "./subscribe-availability";
import { saveSubscriber, type SubscriberDatabase } from "./subscribers";
import { getTurnstileMode, verifyTurnstileToken } from "./turnstile";

export interface SubscribeDeps {
	db: SubscriberDatabase;
	/** siteverify への fetch。テストで差し替える */
	fetchImpl?: typeof fetch;
	now?: () => Date;
}

/**
 * POST /api/subscribe の中身。ルートから `env.DB` を渡して呼ぶ。
 * JS からの fetch（Accept: application/json）には JSON を返し、
 * JS が動かない環境の通常のフォーム送信にはトップの #gift へ 303 で戻す。
 * 登録済みのアドレスでも同じ成功応答にして、登録の有無が外から分からないようにする。
 */
export async function handleSubscribe(request: Request, deps: SubscribeDeps): Promise<Response> {
	const wantsJson = (request.headers.get("accept") ?? "").includes("application/json");
	const respond = (code: SubscribeStatus): Response => {
		const status = code === "ok" ? 200 : SUBSCRIBE_HTTP_STATUS[code];
		if (wantsJson) {
			return Response.json(
				code === "ok" ? { ok: true, message: SUBSCRIBE_MESSAGES.ok } : { ok: false, error: code, message: SUBSCRIBE_MESSAGES[code] },
				{ status, headers: { "Cache-Control": "no-store" } },
			);
		}
		const location = new URL("/", request.url);
		location.searchParams.set("subscribe", code);
		location.hash = "gift";
		return new Response(null, {
			status: 303,
			headers: { Location: location.pathname + location.search + location.hash, "Cache-Control": "no-store" },
		});
	};

	// 別サイトに置いたフォームから他人のアドレスを登録させないよう、ブラウザが付ける Origin を確かめる。
	// このプロジェクトの設定では Astro の checkOrigin がこのルートの別オリジン POST を止めなかった（2026-10-31 実測）
	const origin = request.headers.get("origin");
	if (origin !== null && origin !== new URL(request.url).origin) {
		return Response.json({ ok: false, error: "forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
	}

	// 問い合わせ先が無いあいだは、削除の依頼を受けられないので登録を受け付けない（フォームも閉じている）
	if (!getContactEmail()) {
		console.error("[subscribe] PUBLIC_CONTACT_EMAIL is not set; refusing sign-ups");
		return respond("unavailable");
	}

	const parsed = await parseLimitedForm(request);
	if (!parsed.ok) {
		return respond(parsed.reason === "too_large" ? "too_large" : "invalid_request");
	}
	const form = parsed.form;

	const email = normalizeEmail(form.get("email"));
	if (!email) return respond("invalid_email");
	if (form.get("consent") !== "yes") return respond("consent_required");

	const requestUrl = new URL(request.url);
	const turnstile = getTurnstileMode(requestUrl);
	if (turnstile.kind === "misconfigured") {
		console.error(`[subscribe] Turnstile is half configured: ${turnstile.missing} is not set`);
		return respond("unavailable");
	}
	if (turnstile.kind === "unconfigured") {
		// 鍵なしで本番に出たときに、ボット対策なしで登録を通さない
		console.error("[subscribe] Turnstile keys are not set; refusing outside localhost");
		return respond("unavailable");
	}
	if (turnstile.kind === "enabled") {
		const token = form.get("cf-turnstile-response");
		const result = await verifyTurnstileToken(
			turnstile.secret,
			typeof token === "string" ? token : null,
			requestUrl.hostname,
			deps.fetchImpl,
		);
		if (!result.ok) return respond(result.reason === "unavailable" ? "captcha_unavailable" : "captcha_failed");
	}

	try {
		await saveSubscriber(deps.db, email, deps.now?.());
	} catch (error) {
		console.error("[subscribe] failed to save subscriber", error);
		return respond("unavailable");
	}
	return respond("ok");
}
