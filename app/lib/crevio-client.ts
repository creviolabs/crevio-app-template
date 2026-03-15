import { Crevio } from "@crevio/sdk";

export function createCrevioClient(env: Env) {
	return new Crevio({
		apiKey: env.CREVIO_API_KEY,
		...(env.CREVIO_API_BASE_URL && {
			serverURL: env.CREVIO_API_BASE_URL,
		}),
	});
}
