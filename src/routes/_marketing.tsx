import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { features } from "@/config/features";
import { getAccountOrNull, getLegalPages } from "@/lib/data";
import { jsonLd, seo } from "@/lib/seo";
import { getAppUrl } from "@/lib/site-url";

// Public storefront chrome (Header + Footer + org JSON-LD). The gated /dashboard
// route has its own shell, so it never picks this up.
export const Route = createFileRoute("/_marketing")({
	// Both are awaited: the footer's legal links are internal links that must be
	// in the server-rendered HTML. Deferring them streams the data but leaves the
	// markup client-only, so crawlers see a footer with no links.
	loader: async () => {
		const [account, legalPages] = await Promise.all([
			getAccountOrNull(),
			features.legal
				? getLegalPages()
						.then((list) =>
							list.data.map((page) => ({ title: page.title, slug: page.slug })),
						)
						.catch(() => [])
				: Promise.resolve([]),
		]);

		return { account, legalPages };
	},
	head: ({ loaderData }) => {
		const account = loaderData?.account;
		if (!account) return {};

		return {
			// A floor for every marketing route: the router keeps the deepest title
			// and dedupes meta by name/property, so a page that sets its own wins.
			meta: seo({
				title: account.name,
				description: account.description ?? undefined,
			}),
			scripts: [
				jsonLd({
					"@context": "https://schema.org",
					"@type": "Organization",
					name: account.name,
					url: getAppUrl(),
					...(account.avatarUrl && { logo: account.avatarUrl }),
					...(account.description && { description: account.description }),
					...(account.supportEmail && { email: account.supportEmail }),
				}),
			],
		};
	},
	component: MarketingLayout,
});

function MarketingLayout() {
	const { account, legalPages } = Route.useLoaderData();
	const name = account?.name ?? "Store";

	return (
		<div className="flex min-h-screen flex-col">
			<Header name={name} avatarUrl={account?.avatarUrl ?? null} />
			<main className="flex-1">
				<Outlet />
			</main>
			<Footer
				name={name}
				socialLinks={account?.socialLinks ?? []}
				legalPages={legalPages}
			/>
		</div>
	);
}
