"use client";

import {
	ArrowLeft,
	CalendarCheck,
	CheckCircle2,
	Clock,
	Globe,
	Loader2,
	MapPin,
	Phone,
	Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	type CreateBookingResult,
	createBooking,
	fetchAvailableSlots,
	type SlotDTO,
} from "@/lib/actions/booking";
import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/utils";

export interface BookingPriceVariant {
	id: string;
	name: string;
	amount: number | null;
	currency: string | null;
}

export interface BookingEventType {
	id: string;
	slug: string;
	name: string;
	durationMinutes: number;
	locationType: string | null;
	free: boolean;
	bookingWindowDays: number | null;
	priceVariants: BookingPriceVariant[];
}

type Step = "select" | "details" | "done";

function dayKey(date: Date): string {
	const y = date.getFullYear();
	const m = `${date.getMonth() + 1}`.padStart(2, "0");
	const d = `${date.getDate()}`.padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function startOfToday(): Date {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString([], {
		hour: "numeric",
		minute: "2-digit",
	});
}

function locationMeta(locationType: string | null): {
	Icon: typeof Video;
	label: string;
} {
	switch (locationType) {
		case "phone":
			return { Icon: Phone, label: "Phone call" };
		case "in_person":
			return { Icon: MapPin, label: "In person" };
		case "google_meet":
		case "zoom":
		case "video":
			return { Icon: Video, label: "Video call" };
		default:
			return { Icon: Video, label: "Online" };
	}
}

export function BookingWidget({ eventType }: { eventType: BookingEventType }) {
	const [timeZone, setTimeZone] = useState("");
	const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfToday());
	const [slotsByDay, setSlotsByDay] = useState<Map<string, SlotDTO[]>>(
		new Map(),
	);
	const [loadingSlots, setLoadingSlots] = useState(true);
	const [slotsError, setSlotsError] = useState<string | null>(null);

	const [selectedDate, setSelectedDate] = useState<Date | undefined>();
	const [selectedSlot, setSelectedSlot] = useState<SlotDTO | null>(null);
	const [step, setStep] = useState<Step>("select");

	const paidVariants = eventType.priceVariants;
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [variantId, setVariantId] = useState(paidVariants[0]?.id ?? "");
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [confirmation, setConfirmation] = useState<Extract<
		CreateBookingResult,
		{ status: "confirmed" }
	> | null>(null);

	useEffect(() => {
		setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
	}, []);

	const maxDate = useMemo(() => {
		if (!eventType.bookingWindowDays) return undefined;
		const d = startOfToday();
		d.setDate(d.getDate() + eventType.bookingWindowDays);
		return d;
	}, [eventType.bookingWindowDays]);

	useEffect(() => {
		if (!timeZone) return;

		const today = startOfToday();
		const monthStart = new Date(
			visibleMonth.getFullYear(),
			visibleMonth.getMonth(),
			1,
		);
		const monthEnd = new Date(
			visibleMonth.getFullYear(),
			visibleMonth.getMonth() + 1,
			0,
		);
		const from = monthStart < today ? today : monthStart;

		let cancelled = false;
		setLoadingSlots(true);
		setSlotsError(null);

		fetchAvailableSlots({
			eventTypeId: eventType.id,
			from: dayKey(from),
			to: dayKey(monthEnd),
			timeZone,
		}).then((res) => {
			if (cancelled) return;
			if (res.status === "ok") {
				const grouped = new Map<string, SlotDTO[]>();
				for (const slot of res.slots) {
					const key = dayKey(new Date(slot.startTime));
					const list = grouped.get(key);
					if (list) list.push(slot);
					else grouped.set(key, [slot]);
				}
				setSlotsByDay(grouped);
			} else {
				setSlotsByDay(new Map());
				setSlotsError(res.message);
			}
			setLoadingSlots(false);
		});

		return () => {
			cancelled = true;
		};
	}, [eventType.id, timeZone, visibleMonth]);

	const availableDays = useMemo(() => new Set(slotsByDay.keys()), [slotsByDay]);

	const daySlots = selectedDate
		? (slotsByDay.get(dayKey(selectedDate)) ?? [])
		: [];

	const { Icon: LocationIcon, label: locationLabel } = locationMeta(
		eventType.locationType,
	);

	function resetToStart() {
		setStep("select");
		setSelectedSlot(null);
		setConfirmation(null);
		setSubmitError(null);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!selectedSlot) return;

		setSubmitting(true);
		setSubmitError(null);

		const result = await createBooking({
			eventTypeId: eventType.id,
			startTime: selectedSlot.startTime,
			timeZone,
			name,
			email,
			phone: phone || undefined,
			...(!eventType.free && variantId && { priceVariantId: variantId }),
		});

		if (result.status === "checkout") {
			window.location.href = result.url;
			return;
		}
		if (result.status === "confirmed") {
			setConfirmation(result);
			setStep("done");
			setSubmitting(false);
			return;
		}

		setSubmitError(result.message);
		setSubmitting(false);
	}

	if (step === "done" && confirmation) {
		return (
			<div className="rounded-2xl border border-border/60 bg-muted/20 p-8 text-center">
				<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
					<CheckCircle2 className="size-6" />
				</div>
				<h2 className="mt-4 text-lg font-semibold tracking-tight">
					You're booked
				</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					{new Date(confirmation.startTime).toLocaleString([], {
						weekday: "long",
						month: "long",
						day: "numeric",
						hour: "numeric",
						minute: "2-digit",
					})}
				</p>
				<p className="mt-0.5 text-xs text-muted-foreground">
					A confirmation has been sent to {email}.
				</p>

				{confirmation.meetUrl && (
					<a
						href={confirmation.meetUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline underline-offset-4"
					>
						<Video className="size-4" />
						Join link
					</a>
				)}
				{confirmation.locationDetails && (
					<p className="mt-3 text-sm text-muted-foreground">
						{confirmation.locationDetails}
					</p>
				)}

				<div className="mt-6">
					<Button variant="outline" onClick={resetToStart}>
						Book another time
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-2xl border border-border/60">
			<div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
				{/* Calendar */}
				<div className="border-b border-border/60 p-5 md:border-b-0 md:border-r">
					<div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
						<Clock className="size-3.5" />
						{eventType.durationMinutes} min
						<span className="text-border">·</span>
						<LocationIcon className="size-3.5" />
						{locationLabel}
					</div>
					<Calendar
						mode="single"
						showOutsideDays={false}
						selected={selectedDate}
						month={visibleMonth}
						onMonthChange={(month) => {
							setVisibleMonth(month);
							setSelectedDate(undefined);
							setSelectedSlot(null);
							setStep("select");
						}}
						onSelect={(date) => {
							setSelectedDate(date);
							setSelectedSlot(null);
							setStep("select");
						}}
						startMonth={startOfToday()}
						endMonth={maxDate}
						disabled={[
							{ before: startOfToday() },
							...(maxDate ? [{ after: maxDate }] : []),
							(date: Date) => !availableDays.has(dayKey(date)),
						]}
						modifiers={{
							available: (date: Date) => availableDays.has(dayKey(date)),
						}}
						modifiersClassNames={{
							available: "font-semibold",
						}}
						className="mx-auto"
					/>
					{timeZone && (
						<div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
							<Globe className="size-3" />
							{timeZone.replace(/_/g, " ")}
						</div>
					)}
				</div>

				{/* Times / details */}
				<div className="flex flex-col p-5">
					{step === "select" && (
						<TimesPanel
							loading={loadingSlots || !timeZone}
							error={slotsError}
							selectedDate={selectedDate}
							daySlots={daySlots}
							selectedSlot={selectedSlot}
							onPick={(slot) => {
								setSelectedSlot(slot);
								setStep("details");
							}}
						/>
					)}

					{step === "details" && selectedSlot && (
						<form onSubmit={handleSubmit} className="flex flex-col gap-4">
							<button
								type="button"
								onClick={() => {
									setStep("select");
									setSubmitError(null);
								}}
								className="group -ml-1 inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
							>
								<ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
								{new Date(selectedSlot.startTime).toLocaleDateString([], {
									weekday: "short",
									month: "short",
									day: "numeric",
								})}{" "}
								at {formatTime(selectedSlot.startTime)}
							</button>

							<div className="grid gap-2">
								<Label htmlFor="booking-name">Name</Label>
								<Input
									id="booking-name"
									name="name"
									autoComplete="name"
									placeholder="Jane Doe"
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="booking-email">
									Email<span className="text-destructive"> *</span>
								</Label>
								<Input
									id="booking-email"
									name="email"
									type="email"
									autoComplete="email"
									required
									placeholder="jane@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="booking-phone">Phone</Label>
								<Input
									id="booking-phone"
									name="phone"
									type="tel"
									autoComplete="tel"
									placeholder="+1 (555) 000-0000"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
								/>
							</div>

							{!eventType.free && paidVariants.length > 1 && (
								<div className="grid gap-2">
									<Label htmlFor="booking-variant">Option</Label>
									<select
										id="booking-variant"
										value={variantId}
										onChange={(e) => setVariantId(e.target.value)}
										className="flex h-9 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
									>
										{paidVariants.map((v) => (
											<option key={v.id} value={v.id}>
												{v.name} — {formatPrice(v.amount, v.currency ?? "usd")}
											</option>
										))}
									</select>
								</div>
							)}

							{submitError && (
								<p className="text-sm text-destructive" role="alert">
									{submitError}
								</p>
							)}

							<Button type="submit" disabled={submitting} className="w-full">
								{submitting ? (
									<>
										<Loader2 className="size-4 animate-spin" />
										{eventType.free ? "Booking" : "Redirecting"}
									</>
								) : eventType.free ? (
									"Confirm booking"
								) : (
									"Continue to payment"
								)}
							</Button>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}

function TimesPanel({
	loading,
	error,
	selectedDate,
	daySlots,
	selectedSlot,
	onPick,
}: {
	loading: boolean;
	error: string | null;
	selectedDate: Date | undefined;
	daySlots: SlotDTO[];
	selectedSlot: SlotDTO | null;
	onPick: (slot: SlotDTO) => void;
}) {
	if (loading) {
		return (
			<div className="flex flex-1 items-center justify-center py-10 text-muted-foreground">
				<Loader2 className="size-5 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-1 py-10 text-center">
				<p className="text-sm font-medium">Couldn't load times</p>
				<p className="text-xs text-muted-foreground">{error}</p>
			</div>
		);
	}

	if (!selectedDate) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
				<CalendarCheck className="size-5" />
				<p className="text-sm">Select a date to see available times.</p>
			</div>
		);
	}

	if (daySlots.length === 0) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center py-10 text-center text-muted-foreground">
				<p className="text-sm">No times available on this day.</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<p className="mb-3 text-sm font-medium">
				{selectedDate.toLocaleDateString([], {
					weekday: "long",
					month: "long",
					day: "numeric",
				})}
			</p>
			<div className="grid max-h-80 gap-2 overflow-y-auto pr-1">
				{daySlots.map((slot) => {
					const active = selectedSlot?.startTime === slot.startTime;
					return (
						<button
							key={slot.startTime}
							type="button"
							onClick={() => onPick(slot)}
							className={cn(
								"h-10 rounded-lg border text-sm font-medium tabular-nums transition-colors",
								active
									? "border-foreground bg-foreground text-background"
									: "border-border hover:border-foreground/40 hover:bg-muted",
							)}
						>
							{formatTime(slot.startTime)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
