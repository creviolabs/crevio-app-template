/**
 * Meta-tag helpers for a route's `head()`.
 *
 * `head()` runs during SSR and again on client navigation, so everything here
 * must be isomorphic — see `getAppUrl`.
 */
import { getAppUrl } from "./site-url";

type MetaTag = Record<string, string> & { title?: string };

export interface SeoOptions {
	title?: string;
	description?: string;
	/** Absolute or site-relative image URL. Omit to keep the site-wide OG card. */
	image?: string;
	/** Site-relative path this page canonicalizes to, e.g. `/blog/hello`. */
	path?: string;
	type?: "website" | "article";
	publishedTime?: Date | string;
	noindex?: boolean;
}

function absolute(url: string): string {
	return url.startsWith("http") ? url : `${getAppUrl()}${url}`;
}

export function seo(options: SeoOptions): Array<MetaTag> {
	const {
		title,
		description,
		image,
		path,
		type = "website",
		publishedTime,
		noindex,
	} = options;

	const tags: Array<MetaTag> = [];

	if (title) {
		tags.push(
			{ title },
			{ property: "og:title", content: title },
			{ name: "twitter:title", content: title },
		);
	}
	if (description) {
		tags.push(
			{ name: "description", content: description },
			{ property: "og:description", content: description },
			{ name: "twitter:description", content: description },
		);
	}
	tags.push({ property: "og:type", content: type });
	// The site always has an OG card (src/routes/api/og.tsx), so a page that sets
	// no image of its own still wants the wide layout, not a thumbnail.
	tags.push({ name: "twitter:card", content: "summary_large_image" });
	if (image) {
		tags.push(
			{ property: "og:image", content: absolute(image) },
			{ name: "twitter:image", content: absolute(image) },
		);
	}
	if (path) tags.push({ property: "og:url", content: absolute(path) });
	if (publishedTime) {
		tags.push({
			property: "article:published_time",
			content:
				publishedTime instanceof Date
					? publishedTime.toISOString()
					: publishedTime,
		});
	}
	if (noindex) tags.push({ name: "robots", content: "noindex" });

	return tags;
}

/** Structured data, for `head().scripts`. */
export function jsonLd(data: Record<string, unknown>) {
	return { type: "application/ld+json", children: JSON.stringify(data) };
}

/** BreadcrumbList structured data from an ordered list of crumbs. */
export function breadcrumbJsonLd(crumbs: Array<{ name: string; url: string }>) {
	return jsonLd({
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: crumbs.map((crumb, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: crumb.name,
			item: crumb.url,
		})),
	});
}
