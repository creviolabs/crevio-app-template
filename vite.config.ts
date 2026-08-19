import { cloudflare } from "@cloudflare/vite-plugin";
import { crevioPlugins } from "@crevio/vite-plugins";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
	server: {
		port: 3000,
		hmr: { overlay: false },
	},
	resolve: {
		// Resolve `@/*` from tsconfig.json rather than restating it here.
		tsconfigPaths: true,
	},
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tanstackStart(),
		react(),
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
