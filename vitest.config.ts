import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// src/ のモジュールは Workers の `cloudflare:workers` から env を読む。Node で動かすテストでは
// テストから中身を書き換えられるスタブに差し替える
export default defineConfig({
	resolve: {
		alias: {
			"cloudflare:workers": fileURLToPath(new URL("./test/stubs/cloudflare-workers.ts", import.meta.url)),
		},
	},
	test: {
		include: ["test/**/*.test.ts"],
		environment: "node",
	},
});
