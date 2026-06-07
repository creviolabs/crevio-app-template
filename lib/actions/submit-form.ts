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
 * Every input is named by its numeric field id (see `form-fields.tsx`), so we
 * resolve the email and name fields from the form schema rather than expecting
 * literal `email`/`name` keys. The email value is taken from the `email`-type
 * field and the name from the first `text` field; the API auto-fills these
 * into the matching fields. All other numeric field ids are passed through in
 * the `answers` map.
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

	try {
		const crevio = createCrevioClient();
		const form = await crevio.forms.get({ id: formId });

		const emailField = form.formFields.find((f) => f.fieldType === "email");
		const nameField = form.formFields.find((f) => f.fieldType === "text");

		const email = emailField
			? String(formData.get(emailField.id) ?? "").trim()
			: "";
		if (!email) {
			return { status: "error", message: "A valid email is required.", values };
		}

		const name = nameField
			? formData.get(nameField.id)?.toString() || undefined
			: undefined;

		const skipIds = new Set(
			[emailField?.id, nameField?.id].filter(Boolean) as string[],
		);
		const answers: Record<string, string | string[]> = {};
		for (const key of new Set(formData.keys())) {
			if (!/^\d+$/.test(key) || skipIds.has(key)) continue;
			const all = formData.getAll(key).map(String).filter(Boolean);
			if (all.length > 0) answers[key] = all.length > 1 ? all : all[0];
		}

		await crevio.formSubmissions.create({
			formId,
			email,
			name,
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
