import { ChevronRight, Package } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { ProductCard } from "@/components/product-card";
import { StoreFooter } from "@/components/store-footer";
import { StoreHeader } from "@/components/store-header";
import { Skeleton } from "@/components/ui/skeleton";
import { createCrevioClient } from "@/lib/crevio-client";
import type { Route } from "./+types/home";

const PAGE_SIZE = 9;

export function meta({ data }: Route.MetaArgs) {
	const storeName = data?.account?.name ?? "Store";
	return [
		{ title: storeName },
		{
			name: "description",
			content: data?.account?.description || `Shop products from ${storeName}`,
		},
	];
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const crevio = createCrevioClient(context.cloudflare.env);
	const url = new URL(request.url);
	const after = url.searchParams.get("after") ?? undefined;

	try {
		const [account, productList] = await Promise.all([
			crevio.account.get(),
			crevio.products.list({
				status: "active",
				limit: PAGE_SIZE,
				...(after && { startingAfter: after }),
			}),
		]);

		return {
			account: {
				name: account.name,
				avatarUrl: account.avatarUrl,
				description: account.description,
				displayCurrency: account.displayCurrency,
				socialLinks: account.socialLinks,
			},
			products: productList.data,
			hasMore: productList.hasMore,
			error: null,
		};
	} catch (e) {
		console.error("Failed to load store data:", e);
		return {
			account: {
				name: "Store",
				avatarUrl: null,
				description: null,
				displayCurrency: "usd",
				socialLinks: [],
			},
			products: [],
			hasMore: false,
			error: "Could not connect to Crevio. Check your API key in .dev.vars.",
		};
	}
}

export function HydrateFallback() {
	return (
		<div className="min-h-screen flex flex-col">
			<div className="border-b border-border/40 sticky top-0 z-50">
				<div className="container flex h-16 items-center">
					<Skeleton className="size-8 rounded-full" />
					<Skeleton className="ml-2.5 h-4 w-28" />
				</div>
			</div>
			<div className="container pt-14 pb-10">
				<Skeleton className="size-16 rounded-full" />
				<Skeleton className="mt-5 h-7 w-48" />
				<Skeleton className="mt-3 h-4 w-80" />
			</div>
			<main className="container pb-16 flex-1">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={`skeleton-${i.toString()}`}>
							<Skeleton className="aspect-4/3 rounded-xl" />
							<div className="mt-3.5 space-y-2">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3.5 w-full" />
								<Skeleton className="h-3.5 w-16" />
							</div>
						</div>
					))}
				</div>
			</main>
		</div>
	);
}

export default function Home({ loaderData }: Route.ComponentProps) {
	const { account, products, hasMore, error } = loaderData;
	const [searchParams] = useSearchParams();
	const isFirstPage = !searchParams.has("after");
	const lastProductId =
		products.length > 0 ? products[products.length - 1].id : null;

	return (
		<div className="min-h-screen flex flex-col">
			<StoreHeader storeName={account.name} avatarUrl={account.avatarUrl} />

			{/* Store intro — left-aligned, only on first page */}
			{isFirstPage && (
				<div className="container pt-14 pb-10">
					{account.avatarUrl ? (
						<img
							src={account.avatarUrl}
							alt={account.name}
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

			{/* Products */}
			<main className="container pb-16 flex-1">
				{error ? (
					<div className="flex flex-col items-center justify-center py-24 gap-4">
						<Package className="size-8 text-muted-foreground/40" />
						<p className="text-sm text-muted-foreground">{error}</p>
					</div>
				) : products.length === 0 && isFirstPage ? (
					<div className="flex flex-col items-center justify-center py-24 gap-4">
						<Package className="size-8 text-muted-foreground/40" />
						<p className="text-sm text-muted-foreground">
							No products available yet.
						</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
							{products.map((product) => (
								<ProductCard key={product.id} product={product} currency={account.displayCurrency} />
							))}
						</div>

						{/* Pagination */}
						{(hasMore || !isFirstPage) && (
							<div className="flex items-center justify-center gap-3 mt-14 pt-8 border-t border-border/40">
								{!isFirstPage && (
									<Link
										to="/"
										className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
									>
										Back to first page
									</Link>
								)}
								{hasMore && lastProductId && (
									<Link
										to={`/?after=${lastProductId}`}
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
			</main>

			<StoreFooter
				storeName={account.name}
				socialLinks={account.socialLinks}
			/>
		</div>
	);
}
