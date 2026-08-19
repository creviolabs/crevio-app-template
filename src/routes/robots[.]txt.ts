import { createFileRoute } from "@tanstack/react-router";
import { getAppUrl } from "@/lib/site-url";

export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: () => {
				const siteUrl = getAppUrl();
				const body = [
					"User-agent: *",
					"Allow: /",
					"",
					`Sitemap: ${siteUrl}/sitemap.xml`,
					"",
				].join("\n");

				return new Response(body, {
					headers: { "content-type": "text/plain; charset=utf-8" },
				});
			},
		},
	},
});
