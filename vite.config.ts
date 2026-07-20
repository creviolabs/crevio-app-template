import { cloudflare } from "@cloudflare/vite-plugin";
import { crevioPlugins } from "@crevio/vite-plugins";
import tailwindcss from "@tailwindcss/vite";
import { cdnAdapter } from "@vinext/cloudflare/cache/cdn-adapter";
import { kvDataAdapter } from "@vinext/cloudflare/cache/kv-data-adapter";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";
import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
	server: {
		allowedHosts: true,
		host: "::",
		port: 3000,
		hmr: {
			overlay: false,
		},
	},
	plugins: [
		vinext({
			images: { optimizer: imagesOptimizer() },
			cache: { cdn: cdnAdapter(), data: kvDataAdapter() },
		}),
		cloudflare({
			viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
		}),
		tailwindcss(),
		...crevioPlugins({
			APP_ID: process.env.CREVIO_ACCOUNT_ID,
			APP_URL: process.env.CREVIO_APP_URL,
			ORIGIN: "*",
			NODE_ENV: mode,
			DEBUG_LOGS: mode === "development" ? "true" : "false",
		}),
	],
}));
