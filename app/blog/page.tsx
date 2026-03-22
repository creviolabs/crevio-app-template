import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAccount, getBlogPosts } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
	try {
		const account = await getAccount();
		return {
			title: `Blog — ${account.name}`,
			description: `Read the latest from ${account.name}`,
		};
	} catch {
		return { title: "Blog" };
	}
}

export default async function BlogIndex() {
	const postList = await getBlogPosts().catch((e: unknown) => {
		console.error("Failed to load blog:", e);
		return null;
	});

	const posts = postList?.data ?? [];

	return (
		<div className="container py-14 max-w-3xl mx-auto">
			<h1 className="text-2xl font-semibold tracking-tight mb-10">Blog</h1>

			{posts.length === 0 ? (
				<p className="text-sm text-muted-foreground py-12 text-center">
					No posts yet.
				</p>
			) : (
				<div className="divide-y divide-border/40">
					{posts.map((post) => (
						<article key={post.id} className="group py-8 first:pt-0">
							<Link href={`/blog/${post.slug}`} className="block space-y-2">
								<div className="flex items-start justify-between gap-4">
									<h2 className="text-base font-medium text-foreground group-hover:text-foreground/70 transition-colors">
										{post.title}
									</h2>
									<ArrowRight className="size-4 shrink-0 mt-1 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
								</div>
								{post.excerpt && (
									<p className="text-sm text-muted-foreground line-clamp-2">
										{post.excerpt}
									</p>
								)}
								{post.publishedAt && (
									<time className="text-xs text-muted-foreground/60">
										{new Date(post.publishedAt).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										})}
									</time>
								)}
							</Link>
						</article>
					))}
				</div>
			)}
		</div>
	);
}
