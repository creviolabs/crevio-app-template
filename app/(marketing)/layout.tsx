import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLd } from "@/components/json-ld";
import { features } from "@/config/features";
import { getAccount, getLegalPages } from "@/lib/data";
import { getAppUrl } from "@/lib/site-url";

// Public storefront chrome (Header + Footer + org JSON-LD). The gated /dashboard
// group has its own shell, so it never picks this up.
export default async function MarketingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [account, legalPagesList] = await Promise.all([
		getAccount().catch(() => null),
		features.legal ? getLegalPages().catch(() => null) : null,
	]);
	const legalPages = (legalPagesList?.data ?? []).map((p) => ({
		title: p.title,
		slug: p.slug,
	}));

	const organizationJsonLd = account
		? {
				"@context": "https://schema.org",
				"@type": "Organization",
				name: account.name,
				url: getAppUrl(),
				...(account.avatarUrl && { logo: account.avatarUrl }),
				...(account.description && { description: account.description }),
				...(account.supportEmail && { email: account.supportEmail }),
				...(account.socialLinks.length > 0 && {
					sameAs: account.socialLinks.map((link) => link.url),
				}),
			}
		: null;

	return (
		<div className="flex min-h-screen flex-col">
			{organizationJsonLd && <JsonLd data={organizationJsonLd} />}
			<Header
				name={account?.name ?? "Store"}
				avatarUrl={account?.avatarUrl ?? null}
			/>
			<main className="flex-1">{children}</main>
			<Footer
				name={account?.name ?? "Store"}
				socialLinks={account?.socialLinks ?? []}
				legalPages={legalPages}
			/>
		</div>
	);
}
