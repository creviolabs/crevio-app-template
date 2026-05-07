"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type SubscribeState, subscribe } from "@/lib/actions/subscribe";

const initialState: SubscribeState = { status: "idle" };

function SubmitButton() {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" disabled={pending} className="shrink-0">
			{pending ? (
				<>
					<Loader2 className="size-4 animate-spin" />
					Subscribing
				</>
			) : (
				"Subscribe"
			)}
		</Button>
	);
}

/**
 * NewsletterForm
 *
 * Inline single-field signup. Drop anywhere — footer, hero CTA, post-purchase
 * banner, sidebar. Posts to the account's primary newsletter Form via
 * `crevio.subscribers.create()` (auto-resolves form_id, no setup needed).
 *
 * Use ContactForm instead when the user needs to write a free-form message.
 */
export function NewsletterForm({ heading }: { heading?: string }) {
	const [state, formAction] = useActionState(subscribe, initialState);

	if (state.status === "success") {
		return (
			<div className="flex flex-col items-center gap-1 text-center">
				<p className="text-sm font-medium">Thanks for subscribing</p>
				<p className="text-xs text-muted-foreground">{state.message}</p>
			</div>
		);
	}

	return (
		<div className="flex w-full max-w-md flex-col items-center gap-2">
			{heading && (
				<p className="text-sm font-medium text-foreground/90">{heading}</p>
			)}
			<form action={formAction} className="flex w-full gap-2">
				<Input
					type="email"
					name="email"
					placeholder="you@example.com"
					required
					autoComplete="email"
					aria-label="Email address"
				/>
				<SubmitButton />
			</form>
			{state.status === "error" && (
				<p className="text-xs text-destructive">{state.message}</p>
			)}
		</div>
	);
}
