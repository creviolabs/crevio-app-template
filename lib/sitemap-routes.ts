import { readdir } from "node:fs/promises";
import path from "node:path";

// Discovers static page routes by scanning the Next.js `app/` directory for `page.*` files.
// Skips dynamic segments (`[slug]`), route groups (`(group)`), private folders (`_internal`),
// and parallel routes (`@modal`). Dynamic routes should be enumerated from data sources instead.
export async function discoverStaticRoutes(
	options: { exclude?: Set<string> } = {},
): Promise<string[]> {
	const appDir = path.join(process.cwd(), "app");
	const exclude = options.exclude ?? new Set<string>();
	const routes: string[] = [];

	async function walk(dir: string, urlPath: string) {
		const entries = await readdir(dir, { withFileTypes: true });

		if (
			entries.some(
				(e) => e.isFile() && /^page\.(tsx|ts|jsx|js|mdx)$/.test(e.name),
			)
		) {
			routes.push(urlPath || "/");
		}

		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			const name = entry.name;
			if (
				name.startsWith("[") ||
				name.startsWith("(") ||
				name.startsWith("_") ||
				name.startsWith("@")
			)
				continue;
			await walk(path.join(dir, name), `${urlPath}/${name}`);
		}
	}

	await walk(appDir, "");
	return routes.filter((r) => !exclude.has(r));
}
