import type { BlogPost as BlogPostType } from "@crevio/sdk/models";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccount, getBlogPost } from "@/lib/data";
import { getAppUrl } from "@/lib/site-url";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;

	try {
		const [account, post] = await Promise.all([
			getAccount(),
			getBlogPost(slug),
		]);
		const title = `${post.title} — ${account.name}`;
		const description = post.excerpt || "";
		return {
			title,
			description,
			openGraph: {
				title: post.title,
				description,
				type: "article",
				...(post.publishedAt && {
					publishedTime: post.publishedAt.toISOString(),
				}),
			},
			twitter: { card: "summary" },
		};
	} catch {
		return { title: "Post not found" };
	}
}

function BlogPostJsonLd({
	post,
	accountName,
}: { post: BlogPostType; accountName: string }) {
	const siteUrl = getAppUrl();
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: post.title,
		description: post.excerpt || undefined,
		url: `${siteUrl}/blog/${post.slug}`,
		...(post.publishedAt && { datePublished: post.publishedAt.toISOString() }),
		dateModified: post.updatedAt.toISOString(),
		author: { "@type": "Organization", name: accountName },
		publisher: { "@type": "Organization", name: accountName },
	};

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	);
}

function BreadcrumbJsonLd({
	items,
}: { items: Array<{ name: string; url: string }> }) {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: item.name,
			item: item.url,
		})),
	};

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	);
}

export default async function BlogPost({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	let post: Awaited<ReturnType<typeof getBlogPost>>;
	let account: Awaited<ReturnType<typeof getAccount>> | null;
	try {
		[post, account] = await Promise.all([
			getBlogPost(slug),
			getAccount().catch(() => null),
		]);
	} catch {
		notFound();
	}

	const siteUrl = getAppUrl();

	return (
		<>
			<BlogPostJsonLd
				post={post}
				accountName={account?.name ?? ""}
			/>
			<BreadcrumbJsonLd
				items={[
					{ name: "Home", url: siteUrl },
					{ name: "Blog", url: `${siteUrl}/blog` },
					{ name: post.title, url: `${siteUrl}/blog/${post.slug}` },
				]}
			/>
			<article className="container py-14 max-w-3xl mx-auto">
			<Link
				href="/blog"
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
						{new Date(post.publishedAt).toLocaleDateString("en-US", {
							month: "long",
							day: "numeric",
							year: "numeric",
						})}
					</time>
				)}
			</header>

			<div
				className="prose prose-neutral max-w-none prose-headings:tracking-tight prose-a:text-foreground"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted HTML from CMS
				dangerouslySetInnerHTML={{ __html: post.content }}
			/>
		</article>
		</>
	);
}
