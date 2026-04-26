export function getAppUrl(): string {
	const url = process.env.CREVIO_APP_URL;
	if (!url) {
		throw new Error("CREVIO_APP_URL is not set");
	}
	return url;
}
