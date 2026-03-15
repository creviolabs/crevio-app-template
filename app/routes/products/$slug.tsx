import { ArrowLeft, Check, Clock, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { ProductCard } from "@/components/product-card";
import { StoreFooter } from "@/components/store-footer";
import { StoreHeader } from "@/components/store-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createCrevioClient } from "@/lib/crevio-client";
import { formatInterval, formatPrice } from "@/lib/format-price";
import type { Route } from "./+types/$slug";

export function meta({ data }: Route.MetaArgs) {
	if (!data?.product) return [{ title: "Product not found" }];
	const seo =
		data.product.seo && typeof data.product.seo === "object"
			? data.product.seo
			: null;
	const firstImage = data.product.mediaGallery?.find(
		(m: { type: string }) =>
			m.type !== "external/youtube" && m.type !== "external/vimeo",
	);
	return [
		{ title: seo?.title || `${data.product.name} — ${data.account.name}` },
		{
			name: "description",
			content: seo?.description || data.product.description || "",
		},
		// OG tags
		{ property: "og:title", content: data.product.name },
		{
			property: "og:description",
			content: seo?.description || data.product.description || "",
		},
		{ property: "og:type", content: "product" },
		...(firstImage ? [{ property: "og:image", content: firstImage.url }] : []),
		{ name: "twitter:card", content: "summary_large_image" },
	];
}

export async function loader({ params, context }: Route.LoaderArgs) {
	const crevio = createCrevioClient(context.cloudflare.env);

	const [account, productList] = await Promise.all([
		crevio.account.get(),
		crevio.products.list({ status: "active" }),
	]);

	const match = productList.data.find((p) => p.slug === params.slug);
	if (!match) {
		throw new Response("Product not found", { status: 404 });
	}

	const product = await crevio.products.get({
		id: match.id,
		expand: "reviews",
	});

	// Related products — other products from the same store, excluding current
	const relatedProducts = productList.data
		.filter((p) => p.id !== product.id)
		.slice(0, 3);

	return {
		account: {
			name: account.name,
			avatarUrl: account.avatarUrl,
			socialLinks: account.socialLinks,
			displayCurrency: account.displayCurrency,
		},
		product,
		relatedProducts,
	};
}

export function HydrateFallback() {
	return (
		<div className="min-h-screen flex flex-col">
			<div className="border-b border-border/40 sticky top-0 z-50">
				<div className="container flex h-14 items-center">
					<Skeleton className="size-6 rounded-full" />
					<Skeleton className="ml-2 h-4 w-28" />
				</div>
			</div>
			<main className="container py-12 flex-1">
				<div className="max-w-5xl mx-auto">
					<Skeleton className="h-4 w-16 mb-10" />
					<div className="grid grid-cols-1 md:grid-cols-5 gap-12">
						<div className="md:col-span-3">
							<Skeleton className="aspect-4/3 rounded-xl" />
						</div>
						<div className="md:col-span-2 space-y-4">
							<Skeleton className="h-7 w-3/4" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-24 w-full" />
							<Skeleton className="h-10 w-full rounded-lg" />
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

function StarRating({ rating }: { rating: number }) {
	return (
		<div className="flex gap-px">
			{Array.from({ length: 5 }).map((_, i) => (
				<Star
					key={`star-${i.toString()}`}
					className={`size-3.5 ${
						i < rating ? "fill-rating text-rating" : "fill-border text-border"
					}`}
				/>
			))}
		</div>
	);
}

interface PriceVariant {
	id: string;
	name: string;
	amount: number | null;
	amountType: string;
	billingType: string;
	recurringInterval: string | null;
	intervalCount: number;
	currency: string | null;
	discountedFromAmount: number | null;
	waitlist: boolean;
	benefits?: string[] | null;
}

function ProductJsonLd({
	product,
	currency,
}: {
	product: {
		name: string;
		description: string;
		url: string;
		averageRating: number | null;
		reviewsCount: number;
		priceVariants: PriceVariant[];
		mediaGallery?: Array<{ url: string; type: string }>;
	};
	currency: string;
}) {
	const lowestVariant = product.priceVariants
		.filter(
			(v) =>
				!v.waitlist && v.amountType !== "custom" && v.amountType !== "free",
		)
		.sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0))[0];

	const images = product.mediaGallery
		?.filter(
			(m) => m.type !== "external/youtube" && m.type !== "external/vimeo",
		)
		.map((m) => m.url);

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Product",
		name: product.name,
		description: product.description,
		url: product.url,
		...(images && images.length > 0 && { image: images }),
		...(product.averageRating && {
			aggregateRating: {
				"@type": "AggregateRating",
				ratingValue: product.averageRating,
				reviewCount: product.reviewsCount,
			},
		}),
		...(lowestVariant && {
			offers: {
				"@type": "Offer",
				price: ((lowestVariant.amount ?? 0) / 100).toFixed(2),
				priceCurrency: (
					lowestVariant.currency ??
					currency ??
					"USD"
				).toUpperCase(),
				availability: "https://schema.org/InStock",
			},
		}),
	};

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	);
}

export default function ProductDetail({ loaderData }: Route.ComponentProps) {
	const { account, product, relatedProducts } = loaderData;
	const currency = account.displayCurrency ?? "usd";

	const images = (product.mediaGallery ?? []).filter(
		(m: { type: string }) =>
			m.type !== "external/youtube" && m.type !== "external/vimeo",
	);
	const [selectedImage, setSelectedImage] = useState(0);
	const currentImage = images[selectedImage];

	const visibleVariants = product.priceVariants.filter(
		(v: { hidden: boolean | null; archived: boolean | null }) =>
			!v.hidden && !v.archived,
	);
	const buttonCta = product.buttonCta;
	const reviews = product.reviews ?? [];

	return (
		<div className="min-h-screen flex flex-col">
			<ProductJsonLd product={product} currency={currency} />
			<StoreHeader storeName={account.name} avatarUrl={account.avatarUrl} />

			<main className="flex-1">
				<div className="container py-10">
					<div className="max-w-5xl mx-auto">
						<Link
							to="/"
							className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-5"
						>
							<ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
							Back
						</Link>

						<div className="grid grid-cols-1 md:grid-cols-5 gap-12">
							{/* Images — 3/5 */}
							<div className="md:col-span-3 space-y-3">
								{currentImage ? (
									<div className="aspect-4/3 overflow-hidden rounded-xl bg-muted">
										<img
											src={currentImage.url}
											alt={product.name}
											className="size-full object-cover"
										/>
									</div>
								) : (
									<div className="aspect-4/3 rounded-xl bg-muted flex items-center justify-center">
										<span className="text-6xl font-extralight text-muted-foreground/15 select-none">
											{product.name.charAt(0)}
										</span>
									</div>
								)}

								{/* Thumbnail strip */}
								{images.length > 1 && (
									<div className="flex gap-2 overflow-x-auto pb-1">
										{images.map((img: { url: string }, idx: number) => (
											<button
												key={img.url}
												type="button"
												onClick={() => setSelectedImage(idx)}
												className={`shrink-0 size-16 rounded-lg overflow-hidden bg-muted transition-opacity ${
													idx === selectedImage
														? "ring-2 ring-foreground/20"
														: "opacity-60 hover:opacity-100"
												}`}
											>
												<img
													src={img.url}
													alt=""
													className="size-full object-cover"
												/>
											</button>
										))}
									</div>
								)}
							</div>

							{/* Info — 2/5, sticky */}
							<div className="md:col-span-2 md:sticky md:top-20 md:self-start">
								<div className="space-y-5">
									<div>
										<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
											{product.name}
										</h1>

										<div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
											{product.reviewsCount > 0 && product.averageRating && (
												<div className="flex items-center gap-1.5">
													<StarRating
														rating={Math.round(product.averageRating)}
													/>
													<span className="text-xs tabular-nums text-muted-foreground">
														{product.averageRating}
													</span>
												</div>
											)}

											{product.totalSold > 0 && (
												<span className="flex items-center gap-1 text-xs text-muted-foreground">
													<ShoppingBag className="size-3" />
													{product.totalSold.toLocaleString()} sold
												</span>
											)}

											{product.availableUntil && (
												<Badge
													variant="outline"
													className="gap-1 font-normal text-xs"
												>
													<Clock className="size-2.5" />
													Until{" "}
													{new Date(
														product.availableUntil,
													).toLocaleDateString()}
												</Badge>
											)}
										</div>
									</div>

									{product.bodyHtml ? (
										<div
											className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-foreground"
											// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted HTML from CMS
											dangerouslySetInnerHTML={{
												__html: product.bodyHtml,
											}}
										/>
									) : product.description ? (
										<p className="text-[15px] leading-relaxed text-muted-foreground">
											{product.description}
										</p>
									) : null}

									{/* Variants */}
									{visibleVariants.length > 0 && (
										<div className="space-y-2 pt-1">
											{visibleVariants.map((variant: PriceVariant) => {
												const hasBenefits =
													variant.benefits && variant.benefits.length > 0;
												const variantCurrency = variant.currency ?? currency;

												return (
													<div
														key={variant.id}
														className="rounded-lg border border-border/60 p-3"
													>
														<div className="flex items-center justify-between gap-3">
															<div className="min-w-0">
																<p className="text-sm font-medium text-foreground">
																	{variant.name}
																</p>
																<p className="text-xs text-muted-foreground">
																	{variant.amountType === "free" ? (
																		"Free"
																	) : variant.amountType === "custom" ? (
																		"Name your price"
																	) : (
																		<>
																			{variant.discountedFromAmount && (
																				<span className="line-through text-muted-foreground/50 mr-1">
																					{formatPrice(
																						variant.discountedFromAmount,
																						variantCurrency,
																					)}
																				</span>
																			)}
																			<span className="font-semibold text-foreground text-sm">
																				{formatPrice(
																					variant.amount,
																					variantCurrency,
																				)}
																			</span>
																			{variant.billingType ===
																				"subscription" && (
																				<span className="ml-0.5">
																					{formatInterval(
																						variant.recurringInterval,
																						variant.intervalCount,
																					)}
																				</span>
																			)}
																		</>
																	)}
																</p>
															</div>

															<Button size="sm" className="shrink-0">
																{variant.waitlist
																	? "Join waitlist"
																	: variant.amountType === "free"
																		? "Get for free"
																		: buttonCta || "Buy now"}
															</Button>
														</div>

														{hasBenefits && (
															<ul className="mt-2.5 pt-2.5 border-t border-border/40 space-y-1">
																{variant.benefits?.map((benefit: string) => (
																	<li
																		key={benefit}
																		className="flex items-start gap-2 text-[13px] text-muted-foreground"
																	>
																		<Check className="mt-0.5 size-3 shrink-0 text-foreground/40" />
																		{benefit}
																	</li>
																))}
															</ul>
														)}
													</div>
												);
											})}
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Reviews */}
						{reviews.length > 0 && (
							<section className="mt-20 pt-10 border-t border-border/40">
								<h2 className="text-sm font-medium text-muted-foreground mb-8">
									What people are saying
								</h2>
								<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
									{reviews.map(
										(review: {
											id: string;
											rating: number;
											customerName: string | null;
											content: string | null;
											customerImageUrl: string | null;
										}) => (
											<div key={review.id} className="space-y-3">
												<StarRating rating={review.rating} />
												{review.content && (
													<p className="text-sm leading-relaxed text-foreground/80">
														{review.content}
													</p>
												)}
												<div className="flex items-center gap-2.5">
													{review.customerImageUrl ? (
														<img
															src={review.customerImageUrl}
															alt={review.customerName ?? ""}
															className="size-7 rounded-full object-cover"
														/>
													) : review.customerName ? (
														<div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
															{review.customerName.charAt(0)}
														</div>
													) : null}
													{review.customerName && (
														<span className="text-xs text-muted-foreground">
															{review.customerName}
														</span>
													)}
												</div>
											</div>
										),
									)}
								</div>
							</section>
						)}

						{/* Related Products */}
						{relatedProducts.length > 0 && (
							<section className="mt-20 pt-10 border-t border-border/40">
								<h2 className="text-sm font-medium text-muted-foreground mb-8">
									You might also like
								</h2>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
									{relatedProducts.map((p) => (
										<ProductCard key={p.id} product={p} />
									))}
								</div>
							</section>
						)}
					</div>
				</div>
			</main>

			<StoreFooter storeName={account.name} socialLinks={account.socialLinks} />
		</div>
	);
}
