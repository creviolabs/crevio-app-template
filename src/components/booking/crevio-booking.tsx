import type { PriceVariant } from "@crevio/sdk/models";
import {
	type BookingEventType,
	BookingWidget,
} from "@/components/booking/booking-widget";
import { CrevioEmbed } from "@/components/crevio-embed";
import type { EventTypeId } from "@/lib/crevio-ids";
import { getEventType } from "@/lib/data";

interface CrevioBookingProps {
	eventTypeId: EventTypeId;
	heading?: string;
	description?: string;
	className?: string;
}

/**
 * CrevioBooking
 *
 * Embeddable scheduler. Pass the prefix_id ("etype_...") from
 * `crevio.eventTypes.create()` (the `crevio_api` MCP) and the component
 * fetches the EventType, renders a calendar + time picker, and books through
 * `lib/actions/bookings.ts`. Drop it anywhere you'd offer a single booking —
 * there is no all-bookings index page.
 *
 * The EventType is fetched from the browser so the component stays droppable
 * into any page without that page's loader knowing about it; a route that
 * always shows a booking should load it in its own `loader` instead and render
 * <BookingWidget> directly.
 *
 * `eventTypeId` is typed `` `etype_${string}` ``, so an empty or wrong-prefix
 * id fails to compile rather than shipping the fallback below.
 */
export function CrevioBooking({
	eventTypeId,
	heading,
	description,
	className,
}: CrevioBookingProps) {
	return (
		<CrevioEmbed
			id={eventTypeId}
			load={(id) => getEventType({ data: { id } })}
			intent="book a time"
			skeletonClassName="h-72 w-full rounded-xl"
			className={className}
		>
			{(eventType) => (
				<div className="flex flex-col gap-6">
					{(heading || description) && (
						<div className="flex flex-col gap-1">
							{heading && (
								<h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
									{heading}
								</h2>
							)}
							{description && (
								<p className="text-sm text-muted-foreground">{description}</p>
							)}
						</div>
					)}
					<BookingWidget eventType={toBookingEventType(eventType)} />
				</div>
			)}
		</CrevioEmbed>
	);
}

function toBookingEventType(
	eventType: NonNullable<Awaited<ReturnType<typeof getEventType>>>,
): BookingEventType {
	const variants = eventType.priceVariants
		.filter(
			(v: PriceVariant) => !v.hidden && !v.archived && v.amountType !== "free",
		)
		.map((v: PriceVariant) => ({
			id: v.id,
			name: v.name,
			amount: v.amount,
			currency: v.currency,
		}));

	return {
		id: eventType.id,
		slug: eventType.slug,
		name: eventType.name,
		durationMinutes: Number(eventType.durationMinutes),
		locationType: eventType.locationType
			? String(eventType.locationType)
			: null,
		free: eventType.free,
		bookingWindowDays: eventType.bookingWindowDays
			? Number(eventType.bookingWindowDays)
			: null,
		priceVariants: variants,
	};
}
