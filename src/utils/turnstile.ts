import { readEnv } from "./env";

// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ (2026-10-31 確認)
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_TOKEN_LENGTH = 2048;

export type TurnstileMode =
	/** キーが2つとも無く、localhost で開いている。ウィジェットを出さず、検証もしない（ローカル開発だけ） */
	| { kind: "disabled" }
	/** 両方そろっている。ウィジェットを出し、サーバーで必ず検証する */
	| { kind: "enabled"; siteKey: string; secret: string }
	/** 片方だけ設定されている。登録を受け付けない（検証を黙って飛ばさない） */
	| { kind: "misconfigured"; missing: "TURNSTILE_SECRET_KEY" | "PUBLIC_TURNSTILE_SITE_KEY" }
	/** キーが2つとも無く、localhost 以外で開いている（本番など）。登録を受け付けない */
	| { kind: "unconfigured" };

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** ローカルの wrangler dev / astro dev で開いているときだけ true */
export function isLocalHostname(hostname: string): boolean {
	return LOCAL_HOSTNAMES.has(hostname);
}

/**
 * requestUrl はいま処理しているリクエストの URL。Cloudflare では Host が workers.dev か
 * つないだドメインでないと Worker まで届かないので、本番で localhost 扱いになることはない。
 */
export function getTurnstileMode(requestUrl: URL): TurnstileMode {
	const siteKey = readEnv("PUBLIC_TURNSTILE_SITE_KEY");
	const secret = readEnv("TURNSTILE_SECRET_KEY");
	if (siteKey && secret) return { kind: "enabled", siteKey, secret };
	if (siteKey || secret) {
		return { kind: "misconfigured", missing: siteKey ? "TURNSTILE_SECRET_KEY" : "PUBLIC_TURNSTILE_SITE_KEY" };
	}
	return isLocalHostname(requestUrl.hostname) ? { kind: "disabled" } : { kind: "unconfigured" };
}

/** フォームに出すサイトキー。シークレットが無い状態でウィジェットだけ出すことはしない */
export function getTurnstileSiteKey(requestUrl: URL): string | undefined {
	const mode = getTurnstileMode(requestUrl);
	return mode.kind === "enabled" ? mode.siteKey : undefined;
}

export type TurnstileResult = { ok: true } | { ok: false; reason: "missing_token" | "rejected" | "unavailable" };

function isSiteverifyResponse(
	value: unknown,
): value is { success: boolean; hostname?: unknown; "error-codes"?: unknown } {
	return typeof value === "object" && value !== null && typeof Reflect.get(value, "success") === "boolean";
}

/**
 * expectedHostname はフォームを開いたページのホスト名（= リクエストのホスト名）。
 * 同じサイトキーを別のホスト名でも使えるように設定していた場合に、よそで解かれたトークンを通さない。
 */
export async function verifyTurnstileToken(
	secret: string,
	token: string | null,
	expectedHostname: string,
	fetchImpl: typeof fetch = fetch,
): Promise<TurnstileResult> {
	if (!token || token.length > MAX_TOKEN_LENGTH) return { ok: false, reason: "missing_token" };

	const body = new FormData();
	body.append("secret", secret);
	body.append("response", token);

	let response: Response;
	try {
		response = await fetchImpl(SITEVERIFY_URL, {
			method: "POST",
			body,
			signal: AbortSignal.timeout(5000),
		});
	} catch (error) {
		console.error("[turnstile] siteverify request failed", error);
		return { ok: false, reason: "unavailable" };
	}
	if (!response.ok) {
		console.error("[turnstile] siteverify returned HTTP", response.status);
		return { ok: false, reason: "unavailable" };
	}

	const data: unknown = await response.json().catch(() => null);
	if (!isSiteverifyResponse(data)) {
		console.error("[turnstile] unexpected siteverify response");
		return { ok: false, reason: "unavailable" };
	}
	if (!data.success) {
		console.warn("[turnstile] token rejected", data["error-codes"]);
		return { ok: false, reason: "rejected" };
	}
	// siteverify の応答の hostname は「チャレンジを出したホスト名」。docs のベストプラクティスに従って照合する
	// （https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ 2026-10-31 確認）
	if (data.hostname !== expectedHostname) {
		console.warn("[turnstile] hostname mismatch", { expected: expectedHostname, actual: data.hostname });
		return { ok: false, reason: "rejected" };
	}
	return { ok: true };
}
