/**
 * Collapses duplicate Crevio API reads within a single request.
 *
 * Route loaders run under `Promise.all`, so a page whose layout and its child
 * both read the account would otherwise make two identical origin calls. This
 * layers under the SDK as a custom fetcher, so responses are still parsed per
 * caller — the SDK revives `Date` fields on the way out, which sharing a parsed
 * object would have flattened to strings.
 *
 * There is deliberately no persistent cache here. A per-site KV namespace was
 * retired: it cached this API's own output, and KV caps at 1,000 namespaces per
 * account — a ceiling a per-tenant resource hits long before the tenant count
 * does. Response caching belongs at the origin, where one cache serves every
 * site and no per-tenant resource is involved.
 */
import type { Fetcher } from "@crevio/sdk/lib/http.js";
import { getRequest } from "@tanstack/react-start/server";

interface CapturedResponse {
	body: string;
	status: number;
	contentType: string | null;
}

// 🚨 Scoped per request, never module-wide. A pending fetch promise is an I/O
// object bound to the request that created it; parking one in module scope for
// a later request raises "Cannot perform I/O on behalf of a different request".
const inFlightByRequest = new WeakMap<
	Request,
	Map<string, Promise<CapturedResponse>>
>();

function inFlightFor(): Map<string, Promise<CapturedResponse>> {
	// No request in scope (a script, a warm-up) — skip coalescing rather than
	// throw; a fresh map just means no sharing.
	let request: Request;
	try {
		request = getRequest();
	} catch {
		return new Map();
	}

	let pending = inFlightByRequest.get(request);
	if (!pending) {
		pending = new Map();
		inFlightByRequest.set(request, pending);
	}
	return pending;
}

const toResponse = (captured: CapturedResponse) =>
	new Response(captured.body, {
		status: captured.status,
		headers: captured.contentType
			? { "content-type": captured.contentType }
			: undefined,
	});

export function dedupingFetcher(): Fetcher {
	return async (input, init) => {
		const passthrough = () => fetch(input, init);

		// Only reads are safe to share — two writes are two writes.
		const method =
			init?.method ?? (input instanceof Request ? input.method : "GET");
		if (method !== "GET") return passthrough();

		const key = new Request(input, init).url;
		const inFlight = inFlightFor();

		const pending = inFlight.get(key);
		if (pending) return toResponse(await pending);

		const lookup = passthrough().then(async (response) => ({
			body: await response.text(),
			status: response.status,
			contentType: response.headers.get("content-type"),
		}));

		inFlight.set(key, lookup);
		try {
			return toResponse(await lookup);
		} finally {
			inFlight.delete(key);
		}
	};
}
