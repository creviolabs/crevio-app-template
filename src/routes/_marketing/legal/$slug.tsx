import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getLegalPage } from "@/lib/data";
import { formatDate } from "@/lib/format-price";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/legal/$slug")({
	loader: async ({ params, parentMatchPromise }) => {
		const [policy, parent] = await Promise.all([
			getLegalPage({ data: { slug: params.slug } }),
			parentMatchPromise,
		]);
		return { policy, account: parent.loaderData?.account ?? null };
	},
	head: ({ loaderData }) => {
		const policy = loaderData?.policy;
		if (!policy) return { meta: seo({ title: "Legal" }) };

		const accountName = loaderData?.account?.name;
		return {
			meta: seo({
				title: accountName ? `${policy.title} — ${accountName}` : policy.title,
				description: `${policy.title} for ${accountName ?? "this site"}`,
				path: `/legal/${policy.slug}`,
			}),
		};
	},
	component: LegalPage,
});

function LegalPage() {
	const { policy } = Route.useLoaderData();

	return (
		<article className="container py-14 max-w-3xl mx-auto">
			<Link
				to="/"
				className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-5"
			>
				<ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
				Back to homepage
			</Link>

			<header className="mb-10">
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
					{policy.title}
				</h1>
				<time className="mt-3 block text-sm text-muted-foreground">
					Last updated {formatDate(policy.updatedAt, "long")}
				</time>
			</header>

			{policy.body ? (
				<div
					className="prose prose-neutral max-w-none prose-headings:tracking-tight prose-a:text-foreground"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted HTML from CMS
					dangerouslySetInnerHTML={{ __html: policy.body }}
				/>
			) : (
				<p className="text-sm text-muted-foreground py-12 text-center">
					This policy has no content yet.
				</p>
			)}
		</article>
	);
}
