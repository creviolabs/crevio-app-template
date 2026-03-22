import { BlogPostStatus } from "@crevio/sdk/models";
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

export async function getProduct(id: string, expand?: string) {
	"use cache";
	cacheLife("minutes");
	const crevio = createCrevioClient();
	return crevio.products.get({ id, ...(expand && { expand }) });
}

export async function getPublishedBlogPosts() {
	"use cache";
	cacheLife("minutes");
	const crevio = createCrevioClient();
	const result = await crevio.blogPosts.list();
	return {
		...result,
		data: result.data.filter((p) => p.status === BlogPostStatus.Published),
	};
}

export async function getBlogPost(id: string) {
	"use cache";
	cacheLife("minutes");
	const crevio = createCrevioClient();
	return crevio.blogPosts.get({ id });
}
