import { createFileRoute, redirect } from "@tanstack/react-router";
import { LogIn, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { buttonVariants } from "@/components/ui/button";
import { getAccountOrNull } from "@/lib/data";
import { seo } from "@/lib/seo";
import { hasSession, loadSignInUrl } from "@/lib/session";
import { cn } from "@/lib/utils";

// Only internal paths are honored as the post-sign-in destination — guards
// against an open redirect via ?return_to=//evil.com.
function safeReturnTo(value?: string): string {
	if (!value?.startsWith("/") || value.startsWith("//")) return "/dashboard";
	return value;
}

export const Route = createFileRoute("/_auth/login")({
	validateSearch: z.object({ return_to: z.string().optional() }),
	loaderDeps: ({ search }) => ({ return_to: search.return_to }),
	// noindex, so it never belongs in the sitemap.
	staticData: { sitemap: false },
	loader: async ({ deps }) => {
		const returnTo = safeReturnTo(deps.return_to);

		// A signed-in visitor doesn't need this interstitial. In dev a fallback
		// session always exists, so only skip in production — otherwise the page
		// couldn't be viewed or iterated on locally.
		if (import.meta.env.PROD && (await hasSession())) {
			throw redirect({ href: returnTo });
		}

		const [account, authorizeUrl] = await Promise.all([
			getAccountOrNull(),
			loadSignInUrl({ data: { returnTo } }),
		]);

		return { account, authorizeUrl };
	},
	head: () => ({ meta: seo({ title: "Sign in", noindex: true }) }),
	component: LoginPage,
});

function LoginPage() {
	const { account, authorizeUrl } = Route.useLoaderData();
	const name = account?.name ?? "your account";

	return (
		<div className="w-full max-w-sm">
			<div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
				<div className="flex flex-col items-center text-center">
					{account?.avatarUrl ? (
						<img
							src={account.avatarUrl}
							alt={name}
							width={56}
							height={56}
							className="size-14 rounded-2xl object-cover ring-1 ring-border/60"
						/>
					) : (
						<div className="flex size-14 items-center justify-center rounded-2xl bg-foreground text-background">
							<span className="text-xl font-semibold">
								{name.charAt(0).toUpperCase()}
							</span>
						</div>
					)}
					<h1 className="mt-5 text-lg font-semibold tracking-tight">
						Sign in to {name}
					</h1>
					<p className="mt-1.5 text-sm text-balance text-muted-foreground">
						Continue with your Crevio account to reach your members area.
					</p>
				</div>

				<a
					href={authorizeUrl}
					className={cn(buttonVariants(), "mt-7 h-11 w-full text-sm")}
				>
					<LogIn className="size-4" />
					Continue with Crevio
				</a>
			</div>

			<p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
				<ShieldCheck className="size-3.5 shrink-0" />
				Secure sign-in — you'll be redirected to Crevio.
			</p>
		</div>
	);
}
