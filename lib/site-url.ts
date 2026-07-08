// Request-time only: the env binding is undefined at module scope and throws,
// crashing the worker at startup.
export function getAppUrl(): string {
	const url = process.env.CREVIO_APP_URL;
	if (!url) {
		throw new Error("CREVIO_APP_URL is not set");
	}
	// Strip trailing slash — callers append paths, avoiding `//` in URLs.
	return url.replace(/\/+$/, "");
}
