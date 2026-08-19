import { Crevio } from "@crevio/sdk";
import { HTTPClient } from "@crevio/sdk/lib/http.js";
import { cachedFetcher } from "./cache";

/** Cache windows for API reads, in seconds. `none` bypasses the cache. */
export const TTL = {
	none: 0,
	minutes: 60,
	hours: 3600,
} as const;

export function createCrevioClient(ttlSeconds: number = TTL.none) {
	const apiKey = process.env.CREVIO_API_KEY ?? "";

	return new Crevio({
		apiKey,
		httpClient: new HTTPClient({ fetcher: cachedFetcher(apiKey, ttlSeconds) }),
		...(process.env.CREVIO_API_BASE_URL && {
			serverURL: process.env.CREVIO_API_BASE_URL,
		}),
	});
}
