import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { handleSubscribe } from "../../utils/subscribe-handler";

export const prerender = false;

// 中身は src/utils/subscribe-handler.ts。D1 を引数で渡すのは、Node のテストから同じ処理を呼ぶため
export const POST: APIRoute = ({ request }) => handleSubscribe(request, { db: env.DB });

export const ALL: APIRoute = () =>
	new Response(null, { status: 405, headers: { Allow: "POST" } });
