import type { EventType, PriceVariant } from "@crevio/sdk/models";
import { ArrowRight, CalendarClock, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAccount, getEventTypes } from "@/lib/data";
import { requireFeature } from "@/config/features";
import { formatPrice } from "@/lib/format-price";

export async function generateMetadata(): Promise<Metadata> {
	const account = await getAccount().catch(() => null);
	const name = account?.name ?? "us";
	return {
		title: `Book a time — ${name}`,
		description: `Pick a service and book a time with ${name}.`,
	};
}

function priceLabel(eventType: EventType): string {
	if (eventType.free) return "Free";

	const amounts = eventType.priceVariants
		.filter(
			(v: PriceVariant) => !v.hidden && !v.archived && v.amountType !== "free",
		)
		.map((v: PriceVariant) => ({ amount: v.amount, currency: v.currency }))
		.filter((v) => v.amount !== null)
		.sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0));

	const lowest = amounts[0];
	if (!lowest) return "";

	const price = formatPrice(lowest.amount, lowest.currency ?? "usd");
	return amounts.length > 1 ? `From ${price}` : price;
}

export default async function BookIndexPage() {
	requireFeature("bookings");
	const eventTypes = await getEventTypes().catch(() => null);
	const list = eventTypes?.data ?? [];

	return (
		<div className="container py-10">
			<div className="mx-auto max-w-3xl">
				<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
					Book a time
				</h1>
				<p className="mt-1 mb-8 text-sm text-muted-foreground">
					Choose a service below to see availability.
				</p>

				{list.length === 0 ? (
					<div className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-muted/20 p-12 text-center">
						<CalendarClock className="size-6 text-muted-foreground" />
						<p className="text-sm font-medium">Nothing to book yet</p>
						<p className="text-xs text-muted-foreground">
							Check back soon — booking options will appear here.
						</p>
					</div>
				) : (
					<div className="grid gap-3">
						{list.map((eventType) => {
							const price = priceLabel(eventType);
							return (
								<Link
									key={eventType.id}
									href={`/book/${eventType.slug}`}
									className="group flex items-center justify-between gap-4 rounded-xl border border-border/60 p-5 transition-colors hover:border-foreground/30 hover:bg-muted/30"
								>
									<div className="min-w-0">
										<p className="font-medium text-foreground">
											{eventType.name}
										</p>
										<div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
											<Clock className="size-3" />
											{Number(eventType.durationMinutes)} min
											{price && (
												<>
													<span className="text-border">·</span>
													<span>{price}</span>
												</>
											)}
										</div>
									</div>
									<ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
