// NOTE: `cacheLife` windows are best-effort and per-isolate.
import { cacheLife } from "next/cache";
import { createCrevioClient } from "./crevio-client";

export async function getLegalPages() {
	"use cache";
	cacheLife("hours");
	const crevio = createCrevioClient();
	return crevio.legalPages.list();
}

export async function getLegalPage(slug: string) {
	"use cache";
	cacheLife("hours");
	const crevio = createCrevioClient();
	return crevio.legalPages.get({ idOrSlug: slug });
}

export async function getAccount() {
	"use cache";
	cacheLife("hours");
	const crevio = createCrevioClient();
	return crevio.account.get();
}

export async function getActiveProducts(
	limit?: number,
	startingAfter?: string,
) {
	"use cache";
	cacheLife("minutes");
	const crevio = createCrevioClient();
	return crevio.products.list({
		status: "active",
		...(limit && { limit }),
		...(startingAfter && { startingAfter }),
	});
}

// The catalog is account-wide and this reads by slug, so the storefront's own
// accessor is where a product the merchant has not published stops: the API key
// here is the account's, and the API answers for drafts by design.
export async function getProduct(slugOrId: string, expand?: string) {
	"use cache";
	cacheLife("minutes");
	const crevio = createCrevioClient();
	const product = await crevio.products.get({
		idOrSlug: slugOrId,
		...(expand && { expand }),
	});
	if (product.status !== "active") {
		throw new Error(`Product ${slugOrId} is not published`);
	}
	return product;
}

export async function getBlogPosts() {
	"use cache";
	cacheLife("minutes");
	const crevio = createCrevioClient();
	return crevio.blogPosts.list();
}

export async function getBlogPost(slugOrId: string) {
	"use cache";
	cacheLife("minutes");
	const crevio = createCrevioClient();
	return crevio.blogPosts.get({ idOrSlug: slugOrId });
}

export async function getEventType(slugOrId: string) {
	"use cache";
	cacheLife("minutes");
	const crevio = createCrevioClient();
	// The event types API resolves only by prefix_id (etype_…), not slug, so we
	// match against the list to support human-friendly slugs in the URL.
	const { data } = await crevio.eventTypes.list({ limit: 100 });
	return data.find((e) => e.slug === slugOrId || e.id === slugOrId) ?? null;
}
