import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { IframeNavigationHandler } from "@/components/iframe-navigation-handler";
import { getAccount, getBlogPosts, getLegalPages } from "@/lib/data";
import { getAppUrl } from "@/lib/site-url";
import "./app.css";

export async function generateMetadata(): Promise<Metadata> {
	const siteUrl = getAppUrl();
	return {
		metadataBase: new URL(siteUrl),
		// Render the site-wide opengraph-image as a full-width card on X.
		// Per-route pages can override this (e.g. a text-only post → "summary").
		twitter: { card: "summary_large_image" },
	};
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [account, legalPagesList, blogPostList] = await Promise.all([
		getAccount().catch(() => null),
		getLegalPages().catch(() => null),
		getBlogPosts().catch(() => null),
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
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</head>
			<body>
				{organizationJsonLd && (
					<script
						type="application/ld+json"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
						dangerouslySetInnerHTML={{
							__html: JSON.stringify(organizationJsonLd),
						}}
					/>
				)}
				<IframeNavigationHandler />
				<div className="min-h-screen flex flex-col">
					<Header
						name={account?.name ?? "Store"}
						avatarUrl={account?.avatarUrl ?? null}
						hasBlog={(blogPostList?.data?.length ?? 0) > 0}
					/>
					<main className="flex-1">{children}</main>
					<Footer
						name={account?.name ?? "Store"}
						socialLinks={account?.socialLinks ?? []}
						legalPages={legalPages}
					/>
				</div>
			</body>
		</html>
	);
}
