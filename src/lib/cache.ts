/**
 * TTL cache for Crevio API reads, layered *under* the SDK as a custom fetcher
 * so responses are cached as raw HTTP and re-parsed per request — the SDK
 * revives `Date` fields on the way out, which caching parsed objects would have
 * flattened to strings.
 *
 * Backed by the SITE_CACHE KV namespace. No-ops when the binding is absent, so
 * a site that has not provisioned one still renders (just uncached).
 */

import { env, waitUntil } from "cloudflare:workers";
import type { Fetcher } from "@crevio/sdk/lib/http.js";
import { getRequest } from "@tanstack/react-start/server";

interface CachedMeta {
	status: number;
	contentType: string | null;
}

// Real API URLs are identical across tenants, so every key is namespaced by a
// digest of the calling API key — a shared namespace could otherwise serve one
// site's account payload to another. Keyed by the key itself, not memoized on
// first use: a digest that ignored its argument would be exactly that leak.
//
// Only the resolved STRING is cached across requests, never the promise —
// module scope outlives a request, and holding a pending promise there is what
// produces "Cannot perform I/O on behalf of a different request".
const namespaces = new Map<string, string>();

async function namespaceFor(apiKey: string): Promise<string> {
	const cached = namespaces.get(apiKey);
	if (cached) return cached;

	const buf = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(apiKey),
	);
	const digest = Array.from(new Uint8Array(buf).slice(0, 8))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	namespaces.set(apiKey, digest);
	return digest;
}

// Concurrent identical reads within ONE request share one lookup — KV read and
// origin fetch alike. Route loaders run under Promise.all, so a page whose
// layout and its child both read the account would otherwise pay for both.
//
// 🚨 Scoped per request, not module-wide. A pending fetch promise is an I/O
// object bound to the request that created it; parking one in module scope for
// a later request is what raises "Cannot perform I/O on behalf of a different
// request". The dedupe we actually want is within a single render anyway.
const inFlightByRequest = new WeakMap<
	Request,
	Map<string, Promise<CachedResponse>>
>();

function inFlightFor(): Map<string, Promise<CachedResponse>> {
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

interface CachedResponse {
	body: string;
	status: number;
	contentType: string | null;
}

const toResponse = (r: CachedResponse) =>
	new Response(r.body, {
		status: r.status,
		headers: r.contentType ? { "content-type": r.contentType } : undefined,
	});

function kv(): KVNamespace | null {
	return (env as { SITE_CACHE?: KVNamespace }).SITE_CACHE ?? null;
}

export function cachedFetcher(apiKey: string, ttlSeconds: number): Fetcher {
	return async (input, init) => {
		const passthrough = () => fetch(input, init);
		const store = kv();

		// Only reads are cacheable, and a zero TTL opts a call out entirely. KV
		// also refuses TTLs under 60s, so anything shorter goes straight to the
		// API. Checked before building a Request, which the bail-out would waste.
		const method =
			init?.method ?? (input instanceof Request ? input.method : "GET");
		if (method !== "GET" || ttlSeconds < 60) return passthrough();

		const key = `${await namespaceFor(apiKey)}:${new Request(input, init).url}`;

		const inFlight = inFlightFor();
		const pending = inFlight.get(key);
		if (pending) return toResponse(await pending);

		const lookup = (async (): Promise<CachedResponse> => {
			if (store) {
				try {
					const hit = await store.getWithMetadata<CachedMeta>(key, "text");
					if (hit.value !== null && hit.metadata) {
						return { body: hit.value, ...hit.metadata };
					}
				} catch {
					// A cache read must never take the page down with it.
				}
			}

			const response = await passthrough();
			const body = await response.text();
			const record: CachedResponse = {
				body,
				status: response.status,
				contentType: response.headers.get("content-type"),
			};
			if (!response.ok || !store) return record;

			// Writing KV is a global write; awaiting it would add its latency to
			// the render that just paid for the origin round-trip.
			waitUntil(
				store
					.put(key, body, {
						expirationTtl: ttlSeconds,
						metadata: {
							status: record.status,
							contentType: record.contentType,
						} satisfies CachedMeta,
					})
					.catch(() => {}),
			);
			return record;
		})();

		inFlight.set(key, lookup);
		try {
			return toResponse(await lookup);
		} finally {
			inFlight.delete(key);
		}
	};
}
