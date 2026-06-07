// `import.meta.glob` resolves at build time, so route discovery needs no
// runtime filesystem — `/sitemap.xml` renders on Cloudflare Workers, where a
// `readdir` scan would throw. Only the keys are read; the imports never run.
const PAGE_FILES = import.meta.glob("/app/**/page.{tsx,ts,jsx,js,mdx}");

// Drop dynamic (`[slug]`), private (`_x`), and parallel (`@x`) routes; strip
// route groups (`(group)`). Dynamic routes are enumerated in `app/sitemap.ts`.
const STATIC_ROUTES: string[] = Object.keys(PAGE_FILES)
	.filter((file) => !/\/(\[|_|@)/.test(file))
	.map((file) =>
		file
			.replace(/^\/app/, "")
			.replace(/\/page\.\w+$/, "")
			.replace(/\/\([^/]+\)/g, ""),
	)
	.map((route) => route || "/");

export async function discoverStaticRoutes(
	options: { exclude?: Set<string> } = {},
): Promise<string[]> {
	const exclude = options.exclude ?? new Set<string>();
	return STATIC_ROUTES.filter((route) => !exclude.has(route));
}
