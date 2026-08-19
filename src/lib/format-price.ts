// Constructing an Intl formatter is the expensive part and there are only a
// handful of shapes; a product grid renders dozens of prices per response.
const priceFormatters = new Map<string, Intl.NumberFormat>();

function priceFormatter(currency: string, fractionDigits: number) {
	const key = `${currency}|${fractionDigits}`;
	let formatter = priceFormatters.get(key);
	if (!formatter) {
		formatter = new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency.toUpperCase(),
			minimumFractionDigits: fractionDigits,
		});
		priceFormatters.set(key, formatter);
	}
	return formatter;
}

export function formatPrice(
	amountInCents: number | null,
	currency = "usd",
): string {
	if (amountInCents === null || amountInCents === 0) return "Free";

	return priceFormatter(currency, amountInCents % 100 === 0 ? 0 : 2).format(
		amountInCents / 100,
	);
}

/**
 * The variant a listing advertises: the cheapest one a visitor can actually buy
 * at a fixed price. `custom` (name-your-price) has no number to show, and a
 * waitlisted variant isn't purchasable — excluding them here keeps a product
 * card and its structured data quoting the same figure.
 */
export function lowestVariant<
	T extends {
		amount: number | null;
		amountType?: string | null;
		waitlist?: boolean | null;
	},
>(variants: readonly T[]): T | undefined {
	return variants
		.filter((v) => v.amountType !== "custom" && !v.waitlist)
		.toSorted((a, b) => (a.amount ?? 0) - (b.amount ?? 0))[0];
}

export function formatInterval(interval: string | null, count: number): string {
	if (!interval) return "";
	const label = count === 1 ? interval : `${count} ${interval}s`;
	return `/ ${label}`;
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

/** One date format for the whole site — short by default, long for prose. */
export function formatDate(
	value: Date | string,
	month: "short" | "long" = "short",
): string {
	let formatter = dateFormatters.get(month);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-US", {
			month,
			day: "numeric",
			year: "numeric",
		});
		dateFormatters.set(month, formatter);
	}
	return formatter.format(new Date(value));
}
