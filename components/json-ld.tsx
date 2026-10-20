// Structured data for search and AI answer engines. Add one per fact a page
// states (LocalBusiness, Service, FAQPage, Review…); validate at
// https://validator.schema.org.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: `<` is escaped, so merchant text can't close the tag
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(data).replace(/</g, "\\u003c"),
			}}
		/>
	);
}

export function BreadcrumbJsonLd({
	items,
}: {
	items: Array<{ name: string; url: string }>;
}) {
	return (
		<JsonLd
			data={{
				"@context": "https://schema.org",
				"@type": "BreadcrumbList",
				itemListElement: items.map((item, i) => ({
					"@type": "ListItem",
					position: i + 1,
					name: item.name,
					item: item.url,
				})),
			}}
		/>
	);
}
