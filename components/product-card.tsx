import type { Product } from "@crevio/sdk/models";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatInterval, formatPrice } from "@/lib/format-price";
import { isImageMedia } from "@/lib/media";

export function ProductCard({
	product,
	currency = "usd",
}: {
	product: Product;
	currency?: string;
}) {
	const firstImage = product.mediaGallery?.find(isImageMedia);
	const lowestVariant = product.priceVariants
		.filter((v) => v.amountType !== "custom")
		.sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0))[0];

	const isFree =
		lowestVariant?.amountType === "free" || lowestVariant?.amount === 0;
	const isSubscription = lowestVariant?.billingType === "subscription";

	return (
		<Link href={`/products/${product.slug}`} className="group flex flex-col">

			<div className="relative aspect-4/3 overflow-hidden rounded-xl bg-muted mb-3.5">
				{firstImage ? (
					<Image
						src={firstImage.url}
						alt={product.name}
						fill
						className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.03]"
					/>
				) : (
					<div className="size-full flex items-center justify-center">
						<span className="text-4xl font-extralight text-muted-foreground/25 select-none">
							{product.name.charAt(0)}
						</span>
					</div>
				)}
			</div>


			<div className="space-y-1">
				<div className="flex items-start justify-between gap-3">
					<h3 className="font-medium text-[15px] leading-snug text-foreground line-clamp-1">
						{product.name}
					</h3>

					{product.averageRating != null && product.reviewsCount > 0 && (
						<span className="flex shrink-0 items-center gap-0.5 text-[13px] tabular-nums text-muted-foreground">
							<Star className="size-3 fill-rating text-rating" />
							{product.averageRating}
						</span>
					)}
				</div>

				{product.description && (
					<p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-1">
						{product.description}
					</p>
				)}

				<div className="pt-0.5">
					{isFree ? (
						<span className="text-[13px] font-medium text-muted-foreground">
							Free
						</span>
					) : lowestVariant ? (
						<span className="text-[13px] text-foreground">
							{lowestVariant.discountedFromAmount && (
								<span className="text-muted-foreground/50 line-through mr-1">
									{formatPrice(
										lowestVariant.discountedFromAmount,
										lowestVariant.currency ?? currency,
									)}
								</span>
							)}
							<span className="font-medium">
								{formatPrice(
									lowestVariant.amount,
									lowestVariant.currency ?? currency,
								)}
							</span>
							{isSubscription && (
								<span className="text-muted-foreground">
									{" "}
									{formatInterval(
										lowestVariant.recurringInterval,
										lowestVariant.intervalCount,
									)}
								</span>
							)}
						</span>
					) : null}
				</div>
			</div>
		</Link>
	);
}
