export type SubscribeErrorCode =
	| "invalid_request"
	| "invalid_email"
	| "consent_required"
	| "captcha_failed"
	| "captcha_unavailable"
	| "unavailable";

export type SubscribeStatus = "ok" | SubscribeErrorCode;

export const SUBSCRIBE_MESSAGES: Record<SubscribeStatus, string> = {
	ok: "登録を受け付けました。特典はこのメールアドレス宛てにお送りします。",
	invalid_request: "送信内容を読み取れませんでした。ページを再読み込みして、もう一度お試しください。",
	invalid_email: "メールアドレスの形式を確認してください。",
	consent_required: "プライバシーポリシーへの同意が必要です。",
	captcha_failed: "ボット対策の確認に失敗しました。もう一度お試しください。",
	captcha_unavailable: "ボット対策の確認ができませんでした。時間をおいてお試しください。",
	unavailable: "ただいま登録を受け付けられません。時間をおいてお試しください。",
};

export const SUBSCRIBE_HTTP_STATUS: Record<SubscribeErrorCode, number> = {
	invalid_request: 400,
	invalid_email: 400,
	consent_required: 400,
	captcha_failed: 400,
	captcha_unavailable: 503,
	unavailable: 503,
};

const STATUSES: readonly SubscribeStatus[] = [
	"ok",
	"invalid_request",
	"invalid_email",
	"consent_required",
	"captcha_failed",
	"captcha_unavailable",
	"unavailable",
];

function isSubscribeStatus(value: string): value is SubscribeStatus {
	return STATUSES.some((status) => status === value);
}

/** リダイレクト先の ?subscribe= の値を、表示できる状態に絞る */
export function parseSubscribeStatus(value: string | null): SubscribeStatus | null {
	return value !== null && isSubscribeStatus(value) ? value : null;
}
