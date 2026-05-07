"use server";

import { createCrevioClient } from "@/lib/crevio-client";

export type SubmitFormState = {
	status: "idle" | "success" | "error";
	message?: string;
	values?: Record<string, string | string[]>;
};

/**
 * Generic Form submission action.
 *
 * Reads top-level `email` and `name` from the FormData — the API auto-fills
 * these into the matching email and first text field respectively. Any other
 * inputs whose `name` is a numeric field id are passed through verbatim in
 * the `answers` map.
 *
 * Use this for every form component; bake the field ids into the input
 * `name` attributes when you generate the JSX (the agent gets them from the
 * `crevio.forms.create()` response).
 */
export async function submitForm(
	formId: string,
	_prev: SubmitFormState,
	formData: FormData,
): Promise<SubmitFormState> {
	const values: Record<string, string | string[]> = {};
	for (const key of new Set(formData.keys())) {
		const all = formData.getAll(key).map(String);
		values[key] = all.length > 1 ? all : (all[0] ?? "");
	}

	const email = String(formData.get("email") ?? "").trim();
	if (!email) {
		return { status: "error", message: "A valid email is required.", values };
	}

	const answers: Record<string, string | string[]> = {};
	for (const key of new Set(formData.keys())) {
		if (!/^\d+$/.test(key)) continue;
		const all = formData.getAll(key).map(String).filter(Boolean);
		if (all.length > 0) answers[key] = all.length > 1 ? all : all[0];
	}

	try {
		const crevio = createCrevioClient();
		const form = await crevio.forms.get({ id: formId });

		await crevio.formSubmissions.create({
			formId,
			email,
			name: formData.get("name")?.toString() || undefined,
			answers,
		});

		return {
			status: "success",
			message: form.confirmationRequired
				? "Check your inbox to confirm."
				: "Thanks — we got it.",
		};
	} catch (e) {
		return {
			status: "error",
			message:
				e instanceof Error
					? e.message
					: "Something went wrong. Please try again.",
			values,
		};
	}
}
