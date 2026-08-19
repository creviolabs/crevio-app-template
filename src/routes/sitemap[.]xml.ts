import { createFileRoute } from "@tanstack/react-router";
import { features } from "@/config/features";
import { getBlogPosts, getLegalPages } from "@/lib/data";
import { getAppUrl } from "@/lib/site-url";
import {
	type ChangeFrequency,
	discoverStaticRoutes,
} from "@/lib/sitemap-routes";

// Static pages are discovered from the router; each route declares its own
// priority and whether it belongs here at all via `staticData.sitemap`.
// Only dynamic content needs listing below.

// Add an entry to include another content type. `fetch` should return
// `{ data: Array<{ slug: string; updatedAt?: Date | string }> }`.
type DynamicItem = { slug: string; updatedAt?: Date | string };
type DynamicSource = {
	basePath: string;
	fetch: () => Promise<{ data: DynamicItem[] }>;
	priority: number;
	changeFrequency: ChangeFrequency;
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

interface SitemapEntry {
	url: string;
	lastModified?: Date | string;
	changeFrequency: ChangeFrequency;
	priority: number;
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function renderSitemap(entries: SitemapEntry[]): string {
	const urls = entries.map((entry) => {
		const lastModified =
			entry.lastModified instanceof Date
				? entry.lastModified.toISOString()
				: entry.lastModified;

		return [
			"  <url>",
			`    <loc>${escapeXml(entry.url)}</loc>`,
			...(lastModified ? [`    <lastmod>${lastModified}</lastmod>`] : []),
			`    <changefreq>${entry.changeFrequency}</changefreq>`,
			`    <priority>${entry.priority}</priority>`,
			"  </url>",
		].join("\n");
	});

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls,
		"</urlset>",
		"",
	].join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				const siteUrl = getAppUrl();

				const dynamicResults = await Promise.all(
					DYNAMIC_SOURCES.map((source) => source.fetch().catch(() => null)),
				);

				const entries: SitemapEntry[] = discoverStaticRoutes().map((route) => ({
					url: route.path === "/" ? siteUrl : `${siteUrl}${route.path}`,
					changeFrequency: route.changeFrequency,
					priority: route.priority,
				}));

				DYNAMIC_SOURCES.forEach((source, index) => {
					for (const item of dynamicResults[index]?.data ?? []) {
						entries.push({
							url: `${siteUrl}${source.basePath}/${item.slug}`,
							lastModified: item.updatedAt,
							changeFrequency: source.changeFrequency,
							priority: source.priority,
						});
					}
				});

				return new Response(renderSitemap(entries), {
					headers: { "content-type": "application/xml; charset=utf-8" },
				});
			},
		},
	},
});
