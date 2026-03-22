export function formatPrice(
	amountInCents: number | null,
	currency = "usd",
): string {
	if (amountInCents === null || amountInCents === 0) return "Free";

	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency.toUpperCase(),
		minimumFractionDigits: amountInCents % 100 === 0 ? 0 : 2,
	}).format(amountInCents / 100);
}

export function formatInterval(
	interval: string | null,
	count: number,
): string {
	if (!interval) return "";
	const label = count === 1 ? interval : `${count} ${interval}s`;
	return `/ ${label}`;
}
