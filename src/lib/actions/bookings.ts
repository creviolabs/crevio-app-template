import { RFCDate } from "@crevio/sdk/types";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createCrevioClient } from "@/lib/crevio-client";

export type SlotDTO = {
	startTime: string;
	endTime: string;
};

export type FetchSlotsResult =
	| { status: "ok"; slots: SlotDTO[] }
	| { status: "error"; message: string };

/**
 * Availability is real-time and timezone-specific, so it deliberately skips the
 * cached `lib/data.ts` layer and resolves live on each request.
 */
export const fetchAvailableSlots = createServerFn({ method: "GET" })
	.validator(
		z.object({
			eventTypeId: z.string(),
			from: z.string(),
			to: z.string(),
			timeZone: z.string(),
		}),
	)
	.handler(async ({ data: input }): Promise<FetchSlotsResult> => {
		try {
			const crevio = createCrevioClient();
			const res = await crevio.eventTypes.slots({
				id: input.eventTypeId,
				from: new RFCDate(input.from),
				to: new RFCDate(input.to),
				timezone: input.timeZone,
			});

			return {
				status: "ok",
				slots: res.data.map((slot) => ({
					startTime: slot.startTime.toISOString(),
					endTime: slot.endTime.toISOString(),
				})),
			};
		} catch (e) {
			return {
				status: "error",
				message:
					e instanceof Error ? e.message : "Could not load available times.",
			};
		}
	});

export type CreateBookingResult =
	| {
			status: "confirmed";
			startTime: string;
			timeZone: string;
			meetUrl: string | null;
			locationDetails: string | null;
	  }
	| { status: "checkout"; url: string }
	| { status: "error"; message: string };

export const createBooking = createServerFn({ method: "POST" })
	.validator(
		z.object({
			eventTypeId: z.string(),
			startTime: z.string(),
			timeZone: z.string(),
			name: z.string(),
			email: z.string(),
			phone: z.string().optional(),
			priceVariantId: z.string().optional(),
		}),
	)
	.handler(async ({ data: input }): Promise<CreateBookingResult> => {
		if (!input.email.trim()) {
			return { status: "error", message: "A valid email is required." };
		}

		try {
			const crevio = createCrevioClient();
			const booking = await crevio.bookings.create({
				eventTypeId: input.eventTypeId,
				startTime: new Date(input.startTime),
				timeZone: input.timeZone,
				attendee: {
					name: input.name.trim() || undefined,
					email: input.email.trim(),
					phone: input.phone?.trim() || undefined,
				},
				...(input.priceVariantId && { priceVariantId: input.priceVariantId }),
			});

			const checkout =
				booking.checkout && typeof booking.checkout === "object"
					? booking.checkout
					: null;

			if (booking.status === "pending") {
				if (checkout?.purchaseUrl) {
					return { status: "checkout", url: checkout.purchaseUrl };
				}
				return {
					status: "error",
					message:
						"We couldn't start payment for this booking. Please try again.",
				};
			}

			return {
				status: "confirmed",
				startTime: booking.startTime.toISOString(),
				timeZone: booking.timeZone,
				meetUrl: booking.meetUrl,
				locationDetails: booking.locationDetails,
			};
		} catch (e) {
			return {
				status: "error",
				message:
					e instanceof Error
						? e.message
						: "That time may no longer be available. Please pick another slot.",
			};
		}
	});
