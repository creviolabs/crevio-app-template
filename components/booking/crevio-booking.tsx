import type { PriceVariant } from "@crevio/sdk/models";
import {
	type BookingEventType,
	BookingWidget,
} from "@/components/booking/booking-widget";
import { getEventType } from "@/lib/data";
import { cn } from "@/lib/utils";

interface CrevioBookingProps {
	eventTypeId: string;
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
 * `lib/actions/booking.ts`. Drop it anywhere you'd offer a single booking —
 * there is no all-bookings index page.
 *
 * eventTypeId is validated at build time (scripts/check-event-type-ids.ts):
 * an empty or non-"etype_..." literal fails the build rather than shipping the
 * fallback below to production.
 */
export async function CrevioBooking({
	eventTypeId,
	heading,
	description,
	className,
}: CrevioBookingProps) {
	const eventType = eventTypeId
		? await getEventType(eventTypeId).catch(() => null)
		: null;

	if (!eventType) {
		return (
			<div className={className}>
				<div className="flex flex-col items-center gap-2 text-center">
					<p className="text-sm font-medium">
						Booking isn't available right now.
					</p>
					<p className="text-xs text-muted-foreground">
						If you came here to book a time, please let the site owner know so
						they can fix it.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col gap-6", className)}>
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
