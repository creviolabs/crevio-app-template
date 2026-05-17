import { cloudflare } from "@cloudflare/vite-plugin";
import { crevioPlugins } from "@crevio/vite-plugins";
import tailwindcss from "@tailwindcss/vite";
import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
	server: {
		host: "::",
		port: 3000,
		hmr: {
			overlay: false,
		},
	},
	plugins: [
		vinext(),
		cloudflare({
			viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
		}),
		tailwindcss(),
		...crevioPlugins({
			APP_ID: process.env.CREVIO_ACCOUNT_ID,
			APP_URL: process.env.CREVIO_APP_URL,
			ORIGIN: "*",
			SHOW_WATERMARK:
				process.env.SHOW_WATERMARK !== undefined
					? process.env.SHOW_WATERMARK === "true"
					: mode === "production",
			NODE_ENV: mode,
			DEBUG_LOGS: mode === "development" ? "true" : "false",
		}),
	],
}));
