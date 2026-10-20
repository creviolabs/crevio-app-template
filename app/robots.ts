import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/site-url";

const PRIVATE_PATHS = ["/login", "/dashboard"];

// A crawler with its own group ignores `*`, so a later `*` disallow can't hide the site from these.
const SEARCH_AND_ANSWER_CRAWLERS = [
	"Googlebot",
	"Bingbot",
	"Applebot",
	"OAI-SearchBot",
	"ChatGPT-User",
	"Claude-SearchBot",
	"Claude-User",
	"PerplexityBot",
	"Perplexity-User",
	"meta-webindexer",
	"meta-externalfetcher",
	"Twitterbot",
	"facebookexternalhit",
];

export default function robots(): MetadataRoute.Robots {
	const siteUrl = getAppUrl();

	return {
		rules: [
			{
				userAgent: SEARCH_AND_ANSWER_CRAWLERS,
				allow: "/",
				disallow: PRIVATE_PATHS,
			},
			{
				userAgent: "*",
				allow: "/",
				disallow: PRIVATE_PATHS,
				other: {
					"Content-Signal": "search=yes, ai-input=yes, ai-train=no",
				},
			},
		],
		sitemap: `${siteUrl}/sitemap.xml`,
	};
}
