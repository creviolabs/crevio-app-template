import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { StoreFooter } from "@/components/store-footer";
import { StoreHeader } from "@/components/store-header";
import { Skeleton } from "@/components/ui/skeleton";
import { createCrevioClient } from "@/lib/crevio-client";
import type { Route } from "./+types/index";

export function meta({ data }: Route.MetaArgs) {
	const storeName = data?.account?.name ?? "Blog";
	return [
		{ title: `Blog — ${storeName}` },
		{ name: "description", content: `Read the latest from ${storeName}` },
	];
}

export async function loader({ context }: Route.LoaderArgs) {
	const crevio = createCrevioClient(context.cloudflare.env);

	try {
		const [account, postList] = await Promise.all([
			crevio.account.get(),
			crevio.blogPosts.list(),
		]);

		const publishedPosts = postList.data.filter(
			(p) => p.status === "published",
		);

		return {
			account: {
				name: account.name,
				avatarUrl: account.avatarUrl,
				socialLinks: account.socialLinks,
			},
			posts: publishedPosts,
		};
	} catch (e) {
		console.error("Failed to load blog:", e);
		return {
			account: { name: "Blog", avatarUrl: null, socialLinks: [] },
			posts: [],
		};
	}
}

export function HydrateFallback() {
	return (
		<div className="min-h-screen flex flex-col">
			<div className="border-b border-border/40 sticky top-0 z-50">
				<div className="container flex h-14 items-center">
					<Skeleton className="size-6 rounded-full" />
					<Skeleton className="ml-2 h-4 w-28" />
				</div>
			</div>
			<main className="container py-14 flex-1 max-w-3xl mx-auto">
				<Skeleton className="h-7 w-20 mb-10" />
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={`skeleton-${i.toString()}`}
						className="py-8 border-b border-border/40"
					>
						<Skeleton className="h-5 w-3/4 mb-2" />
						<Skeleton className="h-4 w-full" />
					</div>
				))}
			</main>
		</div>
	);
}

export default function BlogIndex({ loaderData }: Route.ComponentProps) {
	const { account, posts } = loaderData;

	return (
		<div className="min-h-screen flex flex-col">
			<StoreHeader storeName={account.name} avatarUrl={account.avatarUrl} />

			<main className="flex-1">
				<div className="container py-14 max-w-3xl mx-auto">
					<h1 className="text-2xl font-semibold tracking-tight mb-10">
						Blog
					</h1>

					{posts.length === 0 ? (
						<p className="text-sm text-muted-foreground py-12 text-center">
							No posts yet.
						</p>
					) : (
						<div className="divide-y divide-border/40">
							{posts.map(
								(post: {
									id: string;
									title: string;
									slug: string;
									excerpt: string;
									publishedAt: Date | null;
								}) => (
									<article key={post.id} className="group py-8 first:pt-0">
										<Link
											to={`/blog/${post.slug}`}
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
													{new Date(
														post.publishedAt,
													).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
														year: "numeric",
													})}
												</time>
											)}
										</Link>
									</article>
								),
							)}
						</div>
					)}
				</div>
			</main>

			<StoreFooter
				storeName={account.name}
				socialLinks={account.socialLinks}
			/>
		</div>
	);
}
