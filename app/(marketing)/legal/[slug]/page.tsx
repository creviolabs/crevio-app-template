import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFeature } from "@/config/features";
import { getAccount, getLegalPage } from "@/lib/data";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;

	try {
		const [account, policy] = await Promise.all([
			getAccount(),
			getLegalPage(slug),
		]);
		return {
			title: `${policy.title} — ${account.name}`,
			description: `${policy.title} for ${account.name}`,
		};
	} catch {
		return { title: "Legal" };
	}
}

export default async function LegalPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	requireFeature("legal");
	const { slug } = await params;

	let policy: Awaited<ReturnType<typeof getLegalPage>>;
	try {
		policy = await getLegalPage(slug);
	} catch {
		notFound();
	}

	return (
		<article className="container py-14 max-w-3xl mx-auto">
			<Link
				href="/"
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
					Last updated{" "}
					{new Date(policy.updatedAt).toLocaleDateString("en-US", {
						month: "long",
						day: "numeric",
						year: "numeric",
					})}
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
