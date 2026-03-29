import type { PriceVariant, Product, Review } from "@crevio/sdk/models";
import { ArrowLeft, Check, Clock, Star } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAccount, getActiveProducts, getProduct } from "@/lib/data";
import { formatInterval, formatPrice } from "@/lib/format-price";
import { isImageMedia } from "@/lib/media";
import { getAppUrl } from "@/lib/site-url";
import { ProductImageGallery } from "./product-image-gallery";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;

	try {
		const [account, product] = await Promise.all([
			getAccount(),
			getProduct(slug, "reviews"),
		]);
		const seo =
			product.seo && typeof product.seo === "object" ? product.seo : null;
		const firstImage = product.mediaGallery?.find(isImageMedia);

		return {
			title: seo?.title || `${product.name} — ${account.name}`,
			description: seo?.description || product.description || "",
			openGraph: {
				title: product.name,
				description: seo?.description || product.description || "",
				type: "website",
				...(firstImage && { images: [{ url: firstImage.url }] }),
			},
			twitter: { card: "summary_large_image" },
		};
	} catch {
		return { title: "Product not found" };
	}
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

function ProductJsonLd({
	product,
}: {
	product: Product;
}) {
	const lowestVariant = product.priceVariants
		.filter(
			(v) =>
				!v.waitlist && v.amountType !== "custom" && v.amountType !== "free",
		)
		.sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0))[0];

	const images = product.mediaGallery?.filter(isImageMedia).map((m) => m.url);

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
				priceCurrency: (lowestVariant.currency ?? "USD").toUpperCase(),
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

function BreadcrumbJsonLd({
	items,
}: { items: Array<{ name: string; url: string }> }) {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: item.name,
			item: item.url,
		})),
	};

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	);
}

export default async function ProductPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	let product: Awaited<ReturnType<typeof getProduct>>;
	let relatedProducts: Awaited<ReturnType<typeof getActiveProducts>>["data"];
	try {
		const [p, productList] = await Promise.all([
			getProduct(slug, "reviews"),
			getActiveProducts(4),
		]);
		product = p;
		relatedProducts = productList.data
			.filter((r) => r.id !== p.id)
			.slice(0, 3);
	} catch {
		notFound();
	}

	const images = product.mediaGallery.filter(isImageMedia);

	const visibleVariants = product.priceVariants.filter(
		(v: PriceVariant) => !v.hidden && !v.archived,
	);
	const reviews = product.reviews ?? [];

	const siteUrl = getAppUrl();

	return (
		<>
			<ProductJsonLd product={product} />
			<BreadcrumbJsonLd
				items={[
					{ name: "Home", url: siteUrl },
					{
						name: product.name,
						url: `${siteUrl}/products/${product.slug}`,
					},
				]}
			/>
			<div className="container py-10">
				<div className="max-w-5xl mx-auto">
						<Link
							href="/"
							className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-5"
						>
							<ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
							Back
						</Link>

						<div className="grid grid-cols-1 md:grid-cols-5 gap-12">
							{/* Images — 3/5 */}
							<div className="md:col-span-3 space-y-3">
								<ProductImageGallery
									images={images}
									productName={product.name}
								/>
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


									{visibleVariants.length > 0 && (
										<div className="space-y-2 pt-1">
											{visibleVariants.map((variant: PriceVariant) => {
												const hasBenefits =
													variant.benefits && variant.benefits.length > 0;
												const variantCurrency = variant.currency ?? "usd";

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

															<a
																href={variant.purchaseUrl}
																className={buttonVariants({ size: "lg" })}
															>
																{variant.waitlist
																	? "Join waitlist"
																	: variant.amountType === "free"
																		? "Get for free"
																		: product.buttonCta || "Buy now"}
															</a>
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


						{reviews.length > 0 && (
							<section className="mt-20 pt-10 border-t border-border/40">
								<h2 className="text-sm font-medium text-muted-foreground mb-8">
									What people are saying
								</h2>
								<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
									{reviews.map((review: Review) => (
										<div key={review.id} className="space-y-3">
											<StarRating rating={review.rating} />
											{review.content && (
												<p className="text-sm leading-relaxed text-foreground/80">
													{review.content}
												</p>
											)}
											<div className="flex items-center gap-2.5">
												{review.customerImageUrl ? (
													<Image
														src={review.customerImageUrl}
														alt={review.customerName ?? ""}
														width={28}
														height={28}
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
									))}
								</div>
							</section>
						)}


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
		</>
	);
}
