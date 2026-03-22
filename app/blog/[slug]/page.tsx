import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreFooter } from "@/components/store-footer";
import { StoreHeader } from "@/components/store-header";
import { getAccount, getBlogPost, getPublishedBlogPosts } from "@/lib/data";

async function findPostBySlug(slug: string) {
	const [account, postList] = await Promise.all([
		getAccount(),
		getPublishedBlogPosts(),
	]);

	const match = postList.data.find((p) => p.slug === slug);
	if (!match) return null;

	const post = await getBlogPost(match.id);
	return { account, post };
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;

	try {
		const data = await findPostBySlug(slug);
		if (!data) return { title: "Post not found" };

		return {
			title: `${data.post.title} — ${data.account.name}`,
			description: data.post.excerpt || "",
		};
	} catch {
		return { title: "Post not found" };
	}
}

export default async function BlogPost({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const data = await findPostBySlug(slug);
	if (!data) notFound();

	const { account, post } = data;

	return (
		<div className="min-h-screen flex flex-col">
			<StoreHeader storeName={account.name} avatarUrl={account.avatarUrl} />

			<main className="flex-1">
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
			</main>

			<StoreFooter
				storeName={account.name}
				socialLinks={account.socialLinks}
			/>
		</div>
	);
}
