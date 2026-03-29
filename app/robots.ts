import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
	const siteUrl = getAppUrl();

	return {
		rules: [
			{ userAgent: "Googlebot", allow: "/" },
			{ userAgent: "Bingbot", allow: "/" },
			{ userAgent: "Twitterbot", allow: "/" },
			{ userAgent: "facebookexternalhit", allow: "/" },
			{ userAgent: "*", allow: "/" },
		],
		sitemap: `${siteUrl}/sitemap.xml`,
	};
}
