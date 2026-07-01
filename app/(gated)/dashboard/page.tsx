import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessGate } from "@/components/access-gate";
import { getAccess, getSession } from "@/lib/session";

export const metadata: Metadata = {
	title: "Members area",
	robots: { index: false },
};

export default function DashboardPage() {
	return (
		<Suspense
			fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
		>
			<Overview />
		</Suspense>
	);
}

// Entitlement is resolved fresh per render; gate content on it. Defaults to the
// account (company-level) — swap in a prod_/exp_ id to gate a specific product.
async function Overview() {
	const session = await getSession();
	if (!session) return null; // layout already gates; belt-and-suspenders

	const access = await getAccess(session.accountId);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Welcome back</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Signed in as <code className="text-foreground">{session.userId}</code>{" "}
					· access level{" "}
					<strong className="text-foreground">{access.accessLevel}</strong>
				</p>
			</div>

			<AccessGate
				level={access.accessLevel}
				minimum="customer"
				fallback={
					<div className="rounded-xl border border-dashed p-6 text-center">
						<p className="font-medium">This area is for members.</p>
						<a href="/" className="mt-2 inline-block text-primary underline">
							Get access
						</a>
					</div>
				}
			>
				<div className="grid auto-rows-min gap-4 md:grid-cols-3">
					<div className="aspect-video rounded-xl bg-muted/50" />
					<div className="aspect-video rounded-xl bg-muted/50" />
					<div className="aspect-video rounded-xl bg-muted/50" />
				</div>
			</AccessGate>

			{/* Placeholder demoing an extra access tier — remove once you add real
			    content. This whole members area is already for any logged-in
			    account member; this block is gated one level higher (admin) as an
			    example. In dev the preview session resolves as an admin so it
			    always shows; in production only real account admins pass. */}
			<AccessGate level={access.accessLevel} minimum="admin">
				<section className="rounded-xl border border-amber-300 bg-amber-50 p-6 dark:bg-amber-950/20">
					<h2 className="font-medium">Example: extra tier gating</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						The members area is for any logged-in account member. This block is
						an example of gating a section one tier higher — to account admins —
						so most members won't see it. Replace it with real content or delete
						this placeholder.
					</p>
				</section>
			</AccessGate>
		</div>
	);
}
