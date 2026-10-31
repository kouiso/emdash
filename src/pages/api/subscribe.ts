import type { APIRoute } from "astro";
import { SUBSCRIBE_HTTP_STATUS, SUBSCRIBE_MESSAGES, type SubscribeStatus } from "../../utils/subscribe-messages";
import { normalizeEmail, saveSubscriber } from "../../utils/subscribers";
import { getTurnstileMode, verifyTurnstileToken } from "../../utils/turnstile";

export const prerender = false;

/**
 * JS からの fetch（Accept: application/json）には JSON を返し、
 * JS が動かない環境の通常のフォーム送信にはトップの #gift へ 303 で戻す。
 * 登録済みのアドレスでも同じ成功応答にして、登録の有無が外から分からないようにする。
 */
export const POST: APIRoute = async ({ request }) => {
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

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return respond("invalid_request");
	}

	const email = normalizeEmail(form.get("email"));
	if (!email) return respond("invalid_email");
	if (form.get("consent") !== "yes") return respond("consent_required");

	const turnstile = getTurnstileMode();
	if (turnstile.kind === "misconfigured") {
		console.error(`[subscribe] Turnstile is half configured: ${turnstile.missing} is not set`);
		return respond("unavailable");
	}
	if (turnstile.kind === "enabled") {
		const token = form.get("cf-turnstile-response");
		const result = await verifyTurnstileToken(turnstile.secret, typeof token === "string" ? token : null);
		if (!result.ok) return respond(result.reason === "unavailable" ? "captcha_unavailable" : "captcha_failed");
	}

	try {
		await saveSubscriber(email);
	} catch (error) {
		console.error("[subscribe] failed to save subscriber", error);
		return respond("unavailable");
	}
	return respond("ok");
};

export const ALL: APIRoute = () =>
	new Response(null, { status: 405, headers: { Allow: "POST" } });

