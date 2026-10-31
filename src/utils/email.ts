// RFC 5321 のアドレス長の上限（全体 254、@ の前 64、ドメインのラベル 63）
const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_LENGTH = 64;

// @ の前は、配信サービスがふつう受け付ける ASCII の英数字と . _ % + - だけにする。
// 先頭は英数字に限る。= + - @ で始まる値は、登録者の一覧を CSV で開いたときに表計算ソフトが
// 数式として実行する（CSV インジェクション）ので、ここで止める。
// 引用符付きのローカル部や国際化メールアドレス（RFC 6531）は受け付けない。
const LOCAL_PART = /^[a-z0-9][a-z0-9._%+-]*$/;
// ドメインの各ラベルは英数字とハイフン。先頭と末尾はハイフンにしない。日本語ドメインは xn-- の形で受け付ける
const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const TOP_LEVEL_LABEL = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

/**
 * フォームの値を、保存してよいメールアドレスに正規化する。形が合わなければ null。
 * ASCII だけを通すので、NUL などの制御文字、bidi 制御文字（U+202E など）、全角文字は残らない。
 * 届くかどうかまでは判定しない。配信を始めるときのダブルオプトインで確かめる。
 */
export function normalizeEmail(raw: FormDataEntryValue | null): string | null {
	if (typeof raw !== "string") return null;
	const email = raw.trim().toLowerCase();
	if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return null;

	const at = email.indexOf("@");
	if (at <= 0 || at !== email.lastIndexOf("@")) return null;
	const local = email.slice(0, at);
	const domain = email.slice(at + 1);

	if (local.length > MAX_LOCAL_LENGTH || !LOCAL_PART.test(local)) return null;
	if (local.endsWith(".") || local.includes("..")) return null;

	const labels = domain.split(".");
	if (labels.length < 2) return null;
	if (!labels.every((label) => DOMAIN_LABEL.test(label))) return null;
	if (!TOP_LEVEL_LABEL.test(labels[labels.length - 1] ?? "")) return null;

	return email;
}
