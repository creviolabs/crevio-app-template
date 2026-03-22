import { cacheLife } from "next/cache";
import { createCrevioClient } from "./crevio-client";

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

export async function getProduct(slugOrId: string, expand?: string) {
	"use cache";
	cacheLife("minutes");
	const crevio = createCrevioClient();
	return crevio.products.get({ idOrSlug: slugOrId, ...(expand && { expand }) });
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
