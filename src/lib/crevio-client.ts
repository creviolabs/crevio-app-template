import { Crevio } from "@crevio/sdk";
import { HTTPClient } from "@crevio/sdk/lib/http.js";
import { dedupingFetcher } from "./cache";

export function createCrevioClient() {
	return new Crevio({
		apiKey: process.env.CREVIO_API_KEY ?? "",
		httpClient: new HTTPClient({ fetcher: dedupingFetcher() }),
		...(process.env.CREVIO_API_BASE_URL && {
			serverURL: process.env.CREVIO_API_BASE_URL,
		}),
	});
}
