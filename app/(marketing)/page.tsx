import { ChevronRight, Package } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaSection } from "@/components/forms/cta-section";
import { ProductCard } from "@/components/product-card";
import { features } from "@/config/features";
import { getAccount, getActiveProducts } from "@/lib/data";

const PAGE_SIZE = 9;

export async function generateMetadata(): Promise<Metadata> {
	try {
		const account = await getAccount();
		const description =
			account.description || `Lear more about ${account.name}`;
		// No `images` — that would suppress the site-wide opengraph-image.tsx card.
		return {
			title: account.name,
			description,
			openGraph: {
				title: account.name,
				description,
				type: "website",
			},
			twitter: {
				card: "summary_large_image",
				title: account.name,
				description,
			},
		};
	} catch {
		return { title: "Store" };
	}
}

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ after?: string }>;
}) {
	const { after } = await searchParams;
	const isFirstPage = !after;

	const data = await Promise.all([
		getAccount(),
		getActiveProducts(PAGE_SIZE, after),
	]).catch((e: unknown) => {
		console.error("Failed to load store data:", e);
		return null;
	});

	const account = data?.[0];
	const products = data?.[1]?.data ?? [];
	const hasMore = data?.[1]?.hasMore ?? false;
	const lastProductId = products.at(-1)?.id;

	const emptyMessage = !data
		? "Couldn't connect to your Crevio account. Try asking AI to help fix it, or reach out to support if you're still stuck."
		: products.length === 0 && isFirstPage
			? "No products available yet."
			: null;

	return (
		<>
			{isFirstPage && account && (
				<div className="container pt-14 pb-10">
					{account.avatarUrl ? (
						<Image
							src={account.avatarUrl}
							alt={account.name}
							width={64}
							height={64}
							priority
							className="size-16 rounded-full object-cover"
						/>
					) : (
						<div className="flex size-16 items-center justify-center rounded-full bg-foreground text-background">
							<span className="text-xl font-semibold">
								{account.name.charAt(0)}
							</span>
						</div>
					)}
					<h1 className="mt-5 text-2xl font-semibold tracking-tight">
						{account.name}
					</h1>
					{account.description && (
						<p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
							{account.description}
						</p>
					)}
				</div>
			)}

			<div className="container pb-16">
				{emptyMessage ? (
					<div className="flex flex-col items-center justify-center py-24 gap-4">
						<Package className="size-8 text-muted-foreground/40" />
						<p className="text-sm text-muted-foreground">{emptyMessage}</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
							{products.map((product) => (
								<ProductCard key={product.id} product={product} />
							))}
						</div>

						{(hasMore || !isFirstPage) && (
							<div className="flex items-center justify-center gap-3 mt-14 pt-8 border-t border-border/40">
								{!isFirstPage && (
									<Link
										href="/"
										className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
									>
										Back to first page
									</Link>
								)}
								{hasMore && lastProductId && (
									<Link
										href={`/?after=${lastProductId}`}
										className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
									>
										More products
										<ChevronRight className="size-4" />
									</Link>
								)}
							</div>
						)}
					</>
				)}
			</div>
			{features.forms && (
				<CtaSection
					description={`Subscribe to ${account?.name ?? "us"} for occasional updates straight to your inbox.`}
				/>
			)}
		</>
	);
}
