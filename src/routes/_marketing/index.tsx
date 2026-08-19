import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Package } from "lucide-react";
import { z } from "zod";
import { CrevioBooking } from "@/components/booking/crevio-booking";
import { CtaSection } from "@/components/forms/cta-section";
import { ProductCard } from "@/components/product-card";
import { features } from "@/config/features";
import type { EventTypeId } from "@/lib/crevio-ids";
import { getActiveProducts } from "@/lib/data";
import { seo } from "@/lib/seo";

const PAGE_SIZE = 9;

/**
 * The EventType the homepage scheduler books.
 *
 * Create it FIRST via the `crevio_api` MCP (`POST /v1/event-types`) and paste
 * the `etype_…` prefix_id it returns. Empty does not compile: `EventTypeId` is
 * `` `etype_${string}` ``. To drop the scheduler, remove the <CrevioBooking>
 * block below (or set `bookings: false` in config/features.ts).
 */
const EVENT_TYPE_ID: EventTypeId = "";

export const Route = createFileRoute("/_marketing/")({
	staticData: { sitemap: { priority: 1 } },
	validateSearch: z.object({ after: z.string().optional() }),
	loaderDeps: ({ search }) => ({ after: search.after }),
	loader: async ({ deps, parentMatchPromise }) => {
		const [parent, products] = await Promise.all([
			parentMatchPromise,
			getActiveProducts({
				data: { limit: PAGE_SIZE, startingAfter: deps.after },
			}).catch((e: unknown) => {
				console.error("Failed to load store data:", e);
				return null;
			}),
		]);

		return {
			account: parent.loaderData?.account ?? null,
			products: products?.data ?? [],
			hasMore: products?.hasMore ?? false,
			error: products
				? null
				: "Couldn't connect to your Crevio account. Try asking AI to help fix it, or reach out to support if you're still stuck.",
		};
	},
	head: ({ loaderData }) => {
		const account = loaderData?.account;
		if (!account) return { meta: seo({ title: "Store" }) };

		return {
			meta: seo({
				title: account.name,
				description: account.description || `Learn more about ${account.name}`,
				path: "/",
			}),
		};
	},
	component: Home,
});

function Home() {
	const { after } = Route.useSearch();
	const { account, products, hasMore, error } = Route.useLoaderData();

	const isFirstPage = !after;
	const lastProductId = products.at(-1)?.id;

	const emptyMessage =
		error ??
		(products.length === 0 && isFirstPage
			? "No products available yet."
			: null);

	return (
		<>
			{isFirstPage && account && (
				<div className="container pt-14 pb-10">
					{account.avatarUrl ? (
						<img
							src={account.avatarUrl}
							alt={account.name}
							width={64}
							height={64}
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
										to="/"
										search={{}}
										className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
									>
										Back to first page
									</Link>
								)}
								{hasMore && lastProductId && (
									<Link
										to="/"
										search={{ after: lastProductId }}
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

			{features.bookings && (
				<section className="border-t border-border/40 py-14">
					<div className="container mx-auto max-w-2xl">
						<CrevioBooking
							eventTypeId={EVENT_TYPE_ID}
							heading="Book a time"
							description="Pick a date and time that works for you."
						/>
					</div>
				</section>
			)}
			{features.forms && (
				<CtaSection
					description={`Subscribe to ${account?.name ?? "us"} for occasional updates straight to your inbox.`}
				/>
			)}
		</>
	);
}
