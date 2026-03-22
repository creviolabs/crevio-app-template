import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccount, getBlogPost } from "@/lib/data";

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
		return {
			title: `${post.title} — ${account.name}`,
			description: post.excerpt || "",
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

	let post: Awaited<ReturnType<typeof getBlogPost>>;
	try {
		post = await getBlogPost(slug);
	} catch {
		notFound();
	}

	return (
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
	);
}
