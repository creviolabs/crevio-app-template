/**
 * Every Crevio API read the site does, as server functions.
 *
 * They run in-process during SSR and over an RPC on client-side navigation, so
 * the API key never reaches the browser. Route `loader`s call these; nothing
 * else should talk to the SDK directly.
 *
 * The value passed to `createCrevioClient` is the cache window (see lib/cache).
 */
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createCrevioClient, TTL } from "./crevio-client";

const bySlug = z.object({ slug: z.string() });

// A record the URL names but the API doesn't have is a 404, not an error, and
// the router serializes a thrown notFound() straight out of a server function —
// so every `get` below owns that decision instead of each caller re-deciding.
async function orNotFound<T>(read: Promise<T>): Promise<T> {
	try {
		return await read;
	} catch {
		throw notFound();
	}
}

/** The account, or null when it can't be read — for chrome that must still render. */
export const getAccountOrNull = createServerFn({ method: "GET" }).handler(() =>
	createCrevioClient(TTL.hours)
		.account.get()
		.catch(() => null),
);

export const getLegalPages = createServerFn({ method: "GET" }).handler(() =>
	createCrevioClient(TTL.hours).legalPages.list(),
);

export const getLegalPage = createServerFn({ method: "GET" })
	.validator(bySlug)
	.handler(({ data }) =>
		orNotFound(
			createCrevioClient(TTL.hours).legalPages.get({ idOrSlug: data.slug }),
		),
	);

export const getActiveProducts = createServerFn({ method: "GET" })
	.validator(
		z.object({
			limit: z.number().optional(),
			startingAfter: z.string().optional(),
		}),
	)
	.handler(({ data }) =>
		createCrevioClient(TTL.minutes).products.list({
			status: "active",
			...(data.limit && { limit: data.limit }),
			...(data.startingAfter && { startingAfter: data.startingAfter }),
		}),
	);

export const getProduct = createServerFn({ method: "GET" })
	.validator(bySlug.extend({ expand: z.string().optional() }))
	.handler(({ data }) =>
		orNotFound(
			createCrevioClient(TTL.minutes).products.get({
				idOrSlug: data.slug,
				...(data.expand && { expand: data.expand }),
			}),
		),
	);

export const getBlogPosts = createServerFn({ method: "GET" }).handler(() =>
	createCrevioClient(TTL.minutes).blogPosts.list(),
);

export const getBlogPost = createServerFn({ method: "GET" })
	.validator(bySlug)
	.handler(({ data }) =>
		orNotFound(
			createCrevioClient(TTL.minutes).blogPosts.get({ idOrSlug: data.slug }),
		),
	);

/** An EventType by its prefix_id (`etype_…`) — what `<CrevioBooking>` binds. */
export const getEventType = createServerFn({ method: "GET" })
	.validator(z.object({ id: z.string() }))
	.handler(({ data }) =>
		createCrevioClient(TTL.minutes)
			.eventTypes.get({ id: data.id })
			.catch(() => null),
	);
