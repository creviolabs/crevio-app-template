import type { Product } from "@crevio/sdk/models";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { formatInterval, formatPrice, lowestVariant } from "@/lib/format-price";
import {
	embedUrl,
	isDisplayableMedia,
	isExternalVideo,
	isVideoMedia,
} from "@/lib/media";

export function ProductCard({ product }: { product: Product }) {
	// First image, or fall back to a video so a video-only product isn't blank.
	const cover = product.mediaGallery?.find(isDisplayableMedia);
	const variant = lowestVariant(product.priceVariants);

	const isFree = variant?.amountType === "free" || variant?.amount === 0;
	const isSubscription = variant?.billingType === "subscription";

	return (
		<Link
			to="/products/$slug"
			params={{ slug: product.slug }}
			className="group flex flex-col"
		>
			<div className="relative aspect-4/3 overflow-hidden rounded-xl bg-muted mb-3.5">
				{!cover ? (
					<div className="size-full flex items-center justify-center">
						<span className="text-4xl font-extralight text-muted-foreground/25 select-none">
							{product.name.charAt(0)}
						</span>
					</div>
				) : isExternalVideo(cover) ? (
					<iframe
						src={embedUrl(cover) ?? undefined}
						title={product.name}
						allow="encrypted-media; picture-in-picture"
						className="size-full pointer-events-none"
					/>
				) : isVideoMedia(cover) ? (
					<video
						src={cover.url}
						muted
						playsInline
						preload="metadata"
						className="size-full object-cover"
					>
						<track kind="captions" />
					</video>
				) : (
					<img
						src={cover.url}
						alt={product.name}
						width={800}
						height={600}
						loading="lazy"
						className="size-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.03]"
					/>
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
					) : variant ? (
						<span className="text-[13px] text-foreground">
							{variant.discountedFromAmount && (
								<span className="text-muted-foreground/50 line-through mr-1">
									{formatPrice(
										variant.discountedFromAmount,
										variant.currency ?? "usd",
									)}
								</span>
							)}
							<span className="font-medium">
								{formatPrice(variant.amount, variant.currency ?? "usd")}
							</span>
							{isSubscription && (
								<span className="text-muted-foreground">
									{" "}
									{formatInterval(
										variant.recurringInterval,
										variant.intervalCount,
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
