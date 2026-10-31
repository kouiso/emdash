import { normalizeEmail } from "./email";
import { readEnv } from "./env";
import { getTurnstileMode } from "./turnstile";

/**
 * プライバシーポリシーに書く問い合わせ先（削除の依頼を受けるアドレス）。
 * 公開してよい値なので wrangler.jsonc の vars に PUBLIC_CONTACT_EMAIL として書く。形が崩れていれば null
 */
export function getContactEmail(): string | null {
	return normalizeEmail(readEnv("PUBLIC_CONTACT_EMAIL") ?? null);
}

export type SubscribeClosedReason = "no_contact" | "no_turnstile";

export type SubscribeAvailability =
	| { open: true; turnstileSiteKey: string | undefined }
	| { open: false; reason: SubscribeClosedReason };

/** フォームを閉じている理由。トップのフォームの下にそのまま出す */
export const SUBSCRIBE_CLOSED_MESSAGES: Record<SubscribeClosedReason, string> = {
	no_contact:
		"いまは登録を受け付けていません。削除の依頼を受ける問い合わせ先をプライバシーポリシーに載せる準備ができてから、受け付けを始めます。",
	no_turnstile: "いまは登録を受け付けていません。ボット対策（Cloudflare Turnstile）の準備ができてから、受け付けを始めます。",
};

/**
 * 登録を受け付けてよいか。トップのフォームと POST /api/subscribe の両方がこれを見る。
 * 問い合わせ先が無いと、登録した人が削除を頼む先が無いので受け付けない。
 * Turnstile は、キーが2つそろっているか、localhost でキーが2つとも無いときだけ受け付ける。
 */
export function getSubscribeAvailability(requestUrl: URL): SubscribeAvailability {
	if (!getContactEmail()) return { open: false, reason: "no_contact" };
	const turnstile = getTurnstileMode(requestUrl);
	if (turnstile.kind === "enabled") return { open: true, turnstileSiteKey: turnstile.siteKey };
	if (turnstile.kind === "disabled") return { open: true, turnstileSiteKey: undefined };
	return { open: false, reason: "no_turnstile" };
}
