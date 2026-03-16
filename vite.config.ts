import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(() => ({
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
		reactRouter(),
	],
	resolve: {
		tsconfigPaths: true,
	},
}));
