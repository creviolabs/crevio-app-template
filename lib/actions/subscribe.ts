"use server";

import { createCrevioClient } from "@/lib/crevio-client";

export type SubscribeState =
	| { status: "idle" }
	| { status: "success"; message: string }
	| { status: "error"; message: string };

export async function subscribe(
	_prev: SubscribeState,
	formData: FormData,
): Promise<SubscribeState> {
	const email = String(formData.get("email") ?? "").trim();
	const name = String(formData.get("name") ?? "").trim() || undefined;

	if (!email) {
		return { status: "error", message: "Please enter your email." };
	}

	try {
		const crevio = createCrevioClient();
		const customer = await crevio.subscribers.create({ email, name });
		return {
			status: "success",
			message: customer.confirmedAt
				? "You're subscribed."
				: "Check your inbox to confirm your subscription.",
		};
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Something went wrong. Please try again.";
		return { status: "error", message };
	}
}
