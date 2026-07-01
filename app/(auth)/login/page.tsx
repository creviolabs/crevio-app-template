import { LogIn, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { requireFeature } from "@/config/features";
import { getAccount } from "@/lib/data";
import { getSession, signInUrl } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Sign in",
	robots: { index: false },
};

// Only internal paths are honored as the post-sign-in destination — guards
// against an open redirect via ?return_to=//evil.com.
function safeReturnTo(value?: string): string {
	if (!value || !value.startsWith("/") || value.startsWith("//")) {
		return "/dashboard";
	}
	return value;
}

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ return_to?: string }>;
}) {
	requireFeature("auth");

	const { return_to } = await searchParams;
	const returnTo = safeReturnTo(return_to);

	// A signed-in visitor doesn't need this interstitial. In dev a fallback
	// session always exists, so only skip in production — otherwise the page
	// couldn't be viewed or iterated on locally.
	if (process.env.NODE_ENV === "production" && (await getSession())) {
		redirect(returnTo);
	}

	const account = await getAccount().catch(() => null);
	const name = account?.name ?? "your account";
	const authorizeUrl = await signInUrl(returnTo);

	return (
		<div className="w-full max-w-sm">
			<div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
				<div className="flex flex-col items-center text-center">
					{account?.avatarUrl ? (
						<Image
							src={account.avatarUrl}
							alt={name}
							width={56}
							height={56}
							priority
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
