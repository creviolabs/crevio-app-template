import { Crevio } from "@crevio/sdk";

export function createCrevioClient() {
	return new Crevio({
		apiKey: process.env.CREVIO_API_KEY ?? "",
		...(process.env.CREVIO_API_BASE_URL && {
			serverURL: process.env.CREVIO_API_BASE_URL,
		}),
	});
}
