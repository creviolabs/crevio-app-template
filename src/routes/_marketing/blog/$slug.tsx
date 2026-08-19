import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { CtaSection } from "@/components/forms/cta-section";
import { features } from "@/config/features";
import { getBlogPost } from "@/lib/data";
import { formatDate } from "@/lib/format-price";
import { breadcrumbJsonLd, jsonLd, seo } from "@/lib/seo";
import { getAppUrl } from "@/lib/site-url";

export const Route = createFileRoute("/_marketing/blog/$slug")({
	loader: async ({ params, parentMatchPromise }) => {
		const [post, parent] = await Promise.all([
			getBlogPost({ data: { slug: params.slug } }),
			parentMatchPromise,
		]);
		return { post, account: parent.loaderData?.account ?? null };
	},
	head: ({ loaderData }) => {
		const post = loaderData?.post;
		if (!post) return { meta: seo({ title: "Post not found" }) };

		const siteUrl = getAppUrl();
		const path = `/blog/${post.slug}`;
		const accountName = loaderData?.account?.name ?? "";

		return {
			meta: seo({
				title: accountName ? `${post.title} — ${accountName}` : post.title,
				description: post.excerpt || "",
				type: "article",
				path,
				publishedTime: post.publishedAt ?? undefined,
			}),
			scripts: [
				jsonLd({
					"@context": "https://schema.org",
					"@type": "BlogPosting",
					headline: post.title,
					description: post.excerpt || undefined,
					url: `${siteUrl}${path}`,
					...(post.publishedAt && {
						datePublished: post.publishedAt.toISOString(),
					}),
					dateModified: post.updatedAt.toISOString(),
					author: { "@type": "Organization", name: accountName },
					publisher: { "@type": "Organization", name: accountName },
				}),
				breadcrumbJsonLd([
					{ name: "Home", url: siteUrl },
					{ name: "Blog", url: `${siteUrl}/blog` },
					{ name: post.title, url: `${siteUrl}${path}` },
				]),
			],
		};
	},
	component: BlogPost,
});

function BlogPost() {
	const { post, account } = Route.useLoaderData();

	return (
		<>
			<article className="container py-14 max-w-3xl mx-auto">
				<Link
					to="/blog"
					className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-5"
				>
					<ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
					Blog
				</Link>

				<header className="mb-10">
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						{post.title}
					</h1>
					{post.publishedAt && (
						<time className="mt-3 block text-sm text-muted-foreground">
							{formatDate(post.publishedAt, "long")}
						</time>
					)}
				</header>

				<div
					className="prose prose-neutral max-w-none prose-headings:tracking-tight prose-a:text-foreground"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted HTML from CMS
					dangerouslySetInnerHTML={{ __html: post.content }}
				/>
			</article>
			{features.forms && (
				<CtaSection
					description={`Subscribe to ${account?.name ?? "us"} for more posts like this.`}
				/>
			)}
		</>
	);
}
