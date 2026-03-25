import { IframeNavigationHandler } from "@/components/iframe-navigation-handler";
import { StoreFooter } from "@/components/store-footer";
import { StoreHeader } from "@/components/store-header";
import { getAccount, getLegalPages } from "@/lib/data";
import "./app.css";

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [account, legalPagesList] = await Promise.all([
		getAccount().catch(() => null),
		getLegalPages().catch(() => null),
	]);
	const legalPages = (legalPagesList?.data ?? []).map((p) => ({
		title: p.title,
		slug: p.slug,
	}));

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</head>
			<body>
				<IframeNavigationHandler />
				<div className="min-h-screen flex flex-col">
					<StoreHeader
						storeName={account?.name ?? "Store"}
						avatarUrl={account?.avatarUrl ?? null}
					/>
					<main className="flex-1">{children}</main>
					<StoreFooter
						storeName={account?.name ?? "Store"}
						socialLinks={account?.socialLinks ?? []}
						legalPages={legalPages}
					/>
				</div>
			</body>
		</html>
	);
}
