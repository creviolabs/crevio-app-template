import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
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
			}
		: null;

	return (
		<div className="flex min-h-screen flex-col">
			{organizationJsonLd && (
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(organizationJsonLd),
					}}
				/>
			)}
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
