import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { StoreFooter } from "@/components/store-footer";
import { StoreHeader } from "@/components/store-header";
import { createCrevioClient } from "@/lib/crevio-client";
import type { Route } from "./+types/$slug";

export function meta({ data }: Route.MetaArgs) {
	if (!data?.post) return [{ title: "Post not found" }];
	return [
		{ title: `${data.post.title} — ${data.account.name}` },
		{ name: "description", content: data.post.excerpt || "" },
	];
}

export async function loader({ params, context }: Route.LoaderArgs) {
	const crevio = createCrevioClient(context.cloudflare.env);

	const [account, postList] = await Promise.all([
		crevio.account.get(),
		crevio.blogPosts.list(),
	]);

	const match = postList.data.find((p) => p.slug === params.slug);
	if (!match) {
		throw new Response("Post not found", { status: 404 });
	}

	const post = await crevio.blogPosts.get({ id: match.id });

	return {
		account: {
			name: account.name,
			avatarUrl: account.avatarUrl,
			socialLinks: account.socialLinks,
		},
		post,
	};
}

export default function BlogPost({ loaderData }: Route.ComponentProps) {
	const { account, post } = loaderData;

	return (
		<div className="min-h-screen flex flex-col">
			<StoreHeader storeName={account.name} avatarUrl={account.avatarUrl} />

			<main className="flex-1">
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

			<StoreFooter storeName={account.name} socialLinks={account.socialLinks} />
		</div>
	);
}
