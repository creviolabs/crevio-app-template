import type { MetadataRoute } from "next";
import { type FeatureKey, features } from "@/config/features";
import { getBlogPosts, getLegalPages } from "@/lib/data";
import { getAppUrl } from "@/lib/site-url";
import { discoverStaticRoutes } from "@/lib/sitemap-routes";

// ---------------------------------------------------------------------------
// Sitemap configuration — edit these to control what appears in /sitemap.xml.
// ---------------------------------------------------------------------------

// Routes that only exist while their feature module is enabled (config/features).
const FEATURE_ROUTES: Record<string, FeatureKey> = {
	"/blog": "blog",
	"/dashboard": "auth",
};

// Static routes auto-discovered from `app/` (see `lib/sitemap-routes.ts`).
// Override priority below, or add a discovered path here to hide it. Disabled
// feature modules are dropped automatically.
// Auth / members routes are noindex — never list them in the sitemap.
const NOINDEX_ROUTES = ["/login", "/dashboard"];

const EXCLUDED_STATIC_ROUTES = new Set<string>([
	...NOINDEX_ROUTES,
	...Object.entries(FEATURE_ROUTES)
		.filter(([, key]) => !features[key])
		.map(([route]) => route),
]);
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
	...(features.blog
		? [
				{
					basePath: "/blog",
					fetch: getBlogPosts,
					priority: 0.7,
					changeFrequency: "weekly" as const,
				},
			]
		: []),
	...(features.legal
		? [
				{
					basePath: "/legal",
					fetch: getLegalPages,
					priority: 0.3,
					changeFrequency: "monthly" as const,
				},
			]
		: []),
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
