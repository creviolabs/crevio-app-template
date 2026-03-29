import type { MetadataRoute } from "next";
import {
	getActiveProducts,
	getBlogPosts,
	getLegalPages,
} from "@/lib/data";
import { getAppUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const siteUrl = getAppUrl();

	const [productList, blogPostList, legalPageList] = await Promise.all([
		getActiveProducts().catch(() => null),
		getBlogPosts().catch(() => null),
		getLegalPages().catch(() => null),
	]);

	const products = productList?.data ?? [];
	const blogPosts = blogPostList?.data ?? [];
	const legalPages = legalPageList?.data ?? [];

	const entries: MetadataRoute.Sitemap = [
		{ url: siteUrl, changeFrequency: "daily", priority: 1 },
		{ url: `${siteUrl}/blog`, changeFrequency: "daily", priority: 0.8 },
	];

	for (const product of products) {
		entries.push({
			url: `${siteUrl}/products/${product.slug}`,
			lastModified: product.updatedAt,
			changeFrequency: "weekly",
			priority: 0.9,
		});
	}

	for (const post of blogPosts) {
		entries.push({
			url: `${siteUrl}/blog/${post.slug}`,
			lastModified: post.updatedAt,
			changeFrequency: "weekly",
			priority: 0.7,
		});
	}

	for (const page of legalPages) {
		entries.push({
			url: `${siteUrl}/legal/${page.slug}`,
			lastModified: page.updatedAt,
			changeFrequency: "monthly",
			priority: 0.3,
		});
	}

	return entries;
}
