"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ContactState, sendContactMessage } from "@/lib/actions/contact";

const MAX_MESSAGE = 5000;
const initialState: ContactState = { status: "idle" };

interface ContactFormProps {
	heading?: string;
	description?: string;
	className?: string;
}

function SubmitButton() {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" disabled={pending} size="lg" className="w-full sm:w-auto">
			{pending ? (
				<>
					<Loader2 className="size-4 animate-spin" />
					Sending
				</>
			) : (
				"Send message"
			)}
		</Button>
	);
}

/**
 * ContactForm
 *
 * Multi-field form for free-form inquiries. Lives in a page section (typically
 * /contact). Posts to the account's primary contact Form via
 * `crevio.formSubmissions.create()` and preserves user input on validation
 * errors.
 *
 * Use NewsletterForm for one-tap email signups, or DynamicForm for any
 * other purpose-driven form (waitlists, surveys, RSVPs). See AGENTS.md →
 * "Forms" for the decision tree.
 */
export function ContactForm({
	heading = "Get in touch",
	description = "Have a question or want to work together? Send us a message and we'll get back within a day or two.",
	className,
}: ContactFormProps) {
	const [state, formAction] = useActionState(sendContactMessage, initialState);
	const previous = state.status === "error" ? state.fields : undefined;
	const [messageLength, setMessageLength] = useState(previous?.message?.length ?? 0);

	if (state.status === "success") {
		return (
			<div className={className}>
				<div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-10 text-center">
					<div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
						<CheckCircle2 className="size-6" />
					</div>
					<h3 className="text-lg font-semibold">Message sent</h3>
					<p className="max-w-md text-sm text-muted-foreground">{state.message}</p>
				</div>
			</div>
		);
	}

	return (
		<div className={className}>
			<div className="mb-6">
				<h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
				{description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
			</div>

			<form action={formAction} className="grid gap-4">
				<div className="grid gap-2">
					<Label htmlFor="contact-email">
						Email <span className="text-destructive">*</span>
					</Label>
					<Input
						id="contact-email"
						name="email"
						type="email"
						required
						placeholder="you@example.com"
						autoComplete="email"
						defaultValue={previous?.email}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="contact-subject">Subject</Label>
					<Input
						id="contact-subject"
						name="subject"
						placeholder="What's this about?"
						defaultValue={previous?.subject}
					/>
				</div>

				<div className="grid gap-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="contact-message">
							Message <span className="text-destructive">*</span>
						</Label>
						<span className="text-xs text-muted-foreground">
							{messageLength.toLocaleString()} / {MAX_MESSAGE.toLocaleString()}
						</span>
					</div>
					<Textarea
						id="contact-message"
						name="message"
						required
						rows={6}
						maxLength={MAX_MESSAGE}
						placeholder="Tell us a bit about what you're looking for…"
						defaultValue={previous?.message}
						onChange={(event) => setMessageLength(event.currentTarget.value.length)}
					/>
				</div>

				{state.status === "error" && (
					<p className="text-sm text-destructive" role="alert">
						{state.message}
					</p>
				)}

				<div className="flex items-center justify-end pt-2">
					<SubmitButton />
				</div>
			</form>
		</div>
	);
}
