import { cloudflare } from "@cloudflare/vite-plugin";
import { crevioPlugins } from "@crevio/vite-plugins";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
	server: {
		host: "::",
		port: 5173,
		hmr: {
			overlay: false,
		},
	},
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		...crevioPlugins({
			APP_ID: process.env.CREVIO_ACCOUNT_ID,
			APP_URL: process.env.CREVIO_APP_URL,
			ORIGIN: process.env.CREVIO_APP_URL,
			SHOW_WATERMARK: mode === "production",
			NODE_ENV: mode,
			DEBUG_LOGS: mode === "development" ? "true" : "false",
			ANALYTICS_SCRIPT_ATTRS: JSON.stringify({
				src: "https://static.crevio.co/analytics.js",
				"data-domain": process.env.CREVIO_APP_URL,
			}),
		}),
		reactRouter(),
	],
	resolve: {
		tsconfigPaths: true,
	},
}));
