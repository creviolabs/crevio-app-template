import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getBlogPosts } from "@/lib/data";
import { formatDate } from "@/lib/format-price";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/blog/")({
	staticData: { sitemap: { priority: 0.8 } },
	// The account comes from the _marketing layout that already loaded it —
	// fetching it again here would double every page's reads.
	loader: async ({ parentMatchPromise }) => {
		const [parent, postList] = await Promise.all([
			parentMatchPromise,
			getBlogPosts().catch((e: unknown) => {
				console.error("Failed to load blog:", e);
				return null;
			}),
		]);

		return {
			account: parent.loaderData?.account ?? null,
			posts: postList?.data ?? [],
		};
	},
	head: ({ loaderData }) => {
		const name = loaderData?.account?.name;
		if (!name) return { meta: seo({ title: "Blog" }) };

		return {
			meta: seo({
				title: `Blog — ${name}`,
				description: `Read the latest from ${name}`,
				path: "/blog",
			}),
		};
	},
	component: BlogIndex,
});

function BlogIndex() {
	const { posts } = Route.useLoaderData();

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
							<Link
								to="/blog/$slug"
								params={{ slug: post.slug }}
								className="block space-y-2"
							>
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
										{formatDate(post.publishedAt)}
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
