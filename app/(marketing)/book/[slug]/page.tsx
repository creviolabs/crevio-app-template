import type { PriceVariant } from "@crevio/sdk/models";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
	type BookingEventType,
	BookingWidget,
} from "@/components/booking/booking-widget";
import { getAccount, getEventType } from "@/lib/data";
import { requireFeature } from "@/config/features";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;

	try {
		const [account, eventType] = await Promise.all([
			getAccount(),
			getEventType(slug),
		]);
		if (!eventType) return { title: "Booking not found" };
		return {
			title: `Book ${eventType.name} — ${account.name}`,
			description: `Pick a time to book ${eventType.name}.`,
		};
	} catch {
		return { title: "Booking not found" };
	}
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

export default async function BookEventTypePage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	requireFeature("bookings");
	const { slug } = await params;

	const eventType = await getEventType(slug).catch(() => null);
	if (!eventType) notFound();

	const dto = toBookingEventType(eventType);

	return (
		<div className="container py-10">
			<div className="mx-auto max-w-4xl">
				<Link
					href="/book"
					className="group mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
					All booking types
				</Link>

				<h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
					{eventType.name}
				</h1>
				<p className="mt-1 mb-6 text-sm text-muted-foreground">
					Choose a date and time that works for you.
				</p>

				<BookingWidget eventType={dto} />
			</div>
		</div>
	);
}
