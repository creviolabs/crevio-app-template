import type { MetadataRoute } from "next";
import { getActiveProducts, getBlogPosts, getLegalPages } from "@/lib/data";
import { getAppUrl } from "@/lib/site-url";
import { discoverStaticRoutes } from "@/lib/sitemap-routes";

// ---------------------------------------------------------------------------
// Sitemap configuration — edit these to control what appears in /sitemap.xml.
// ---------------------------------------------------------------------------

// Static routes auto-discovered from `app/`. Override priority here or
// add a path to `EXCLUDED_STATIC_ROUTES` to hide it.
const EXCLUDED_STATIC_ROUTES = new Set<string>(["/forms-demo"]);
const STATIC_PRIORITY: Record<string, number> = { "/": 1, "/blog": 0.8 };
const DEFAULT_STATIC_PRIORITY = 0.5;
const STATIC_CHANGE_FREQUENCY: MetadataRoute.Sitemap[number]["changeFrequency"] =
	"daily";

// Dynamic content sources. Add a new entry here to include another content type.
// `fetch` should return `{ data: Array<{ slug: string; updatedAt?: Date | string }> }`.
type DynamicItem = { slug: string; updatedAt?: Date | string };
type DynamicSource = {
	basePath: string;
	fetch: () => Promise<{ data: DynamicItem[] }>;
	priority: number;
	changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

const DYNAMIC_SOURCES: DynamicSource[] = [
	{
		basePath: "/products",
		fetch: getActiveProducts,
		priority: 0.9,
		changeFrequency: "weekly",
	},
	{
		basePath: "/blog",
		fetch: getBlogPosts,
		priority: 0.7,
		changeFrequency: "weekly",
	},
	{
		basePath: "/legal",
		fetch: getLegalPages,
		priority: 0.3,
		changeFrequency: "monthly",
	},
];

// ---------------------------------------------------------------------------

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const siteUrl = getAppUrl();

	const [staticRoutes, ...dynamicResults] = await Promise.all([
		discoverStaticRoutes({ exclude: EXCLUDED_STATIC_ROUTES }),
		...DYNAMIC_SOURCES.map((source) => source.fetch().catch(() => null)),
	]);

	const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
		url: route === "/" ? siteUrl : `${siteUrl}${route}`,
		changeFrequency: STATIC_CHANGE_FREQUENCY,
		priority: STATIC_PRIORITY[route] ?? DEFAULT_STATIC_PRIORITY,
	}));

	DYNAMIC_SOURCES.forEach((source, index) => {
		const items = dynamicResults[index]?.data ?? [];
		for (const item of items) {
			entries.push({
				url: `${siteUrl}${source.basePath}/${item.slug}`,
				lastModified: item.updatedAt,
				changeFrequency: source.changeFrequency,
				priority: source.priority,
			});
		}
	});

	return entries;
}
