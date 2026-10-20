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

const MAX_PAGE_SIZE = 100;

async function listAll<T extends { id: string }>(
	fetchPage: (
		startingAfter?: string,
	) => Promise<{ data: T[]; hasMore: boolean }>,
): Promise<T[]> {
	const items: T[] = [];
	let startingAfter: string | undefined;
	do {
		const page = await fetchPage(startingAfter);
		items.push(...page.data);
		startingAfter = page.hasMore ? page.data.at(-1)?.id : undefined;
	} while (startingAfter);
	return items;
}

export async function getAllActiveProducts() {
	"use cache";
	cacheLife("hours");
	const crevio = createCrevioClient();
	return listAll((startingAfter) =>
		crevio.products.list({
			status: "active",
			limit: MAX_PAGE_SIZE,
			...(startingAfter && { startingAfter }),
		}),
	);
}

// Same reason as getProduct: the account's key lists drafts and scheduled posts too.
export async function getBlogPosts() {
	"use cache";
	cacheLife("minutes");
	const crevio = createCrevioClient();
	return crevio.blogPosts.list({ status: "published" });
}

export async function getAllBlogPosts() {
	"use cache";
	cacheLife("hours");
	const crevio = createCrevioClient();
	return listAll((startingAfter) =>
		crevio.blogPosts.list({
			status: "published",
			limit: MAX_PAGE_SIZE,
			...(startingAfter && { startingAfter }),
		}),
	);
}

export async function getBlogPost(slugOrId: string) {
	"use cache";
	cacheLife("minutes");
	const crevio = createCrevioClient();
	const post = await crevio.blogPosts.get({ idOrSlug: slugOrId });
	if (post.status !== "published") {
		throw new Error(`Blog post ${slugOrId} is not published`);
	}
	return post;
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
