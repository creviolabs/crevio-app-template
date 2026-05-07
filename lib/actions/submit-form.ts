"use server";

import { createCrevioClient } from "@/lib/crevio-client";

export type SubmitFormState = {
	status: "idle" | "success" | "error";
	message?: string;
	values?: Record<string, string | string[]>;
};

export async function submitForm(
	formId: string,
	_prev: SubmitFormState,
	formData: FormData,
): Promise<SubmitFormState> {
	const values: Record<string, string | string[]> = {};
	for (const key of new Set(Array.from(formData.keys()))) {
		const all = formData.getAll(key).map((v) => String(v));
		values[key] = all.length > 1 ? all : (all[0] ?? "");
	}

	try {
		const crevio = createCrevioClient();
		const form = await crevio.forms.get({ id: formId });

		const emailField = form.formFields.find((f) => f.fieldType === "email");
		const email = emailField
			? String(formData.get(emailField.id) ?? "").trim()
			: "";

		if (!email) {
			return { status: "error", message: "A valid email is required.", values };
		}

		const answers: Record<string, string | string[]> = {};
		for (const field of form.formFields) {
			if (field.fieldType === "checkbox") {
				const picks = formData.getAll(field.id).map(String).filter(Boolean);
				if (picks.length > 0) answers[field.id] = picks;
			} else {
				const v = String(formData.get(field.id) ?? "").trim();
				if (v) answers[field.id] = v;
			}

			if (field.required && !answers[field.id]) {
				return {
					status: "error",
					message: `${field.name} is required.`,
					values,
				};
			}
		}

		await crevio.formSubmissions.create({
			formId: form.id,
			email,
			answers,
		});

		return {
			status: "success",
			message: form.confirmationRequired
				? "Check your inbox to confirm."
				: "Submitted.",
		};
	} catch (e) {
		return {
			status: "error",
			message:
				e instanceof Error ? e.message : "Something went wrong. Please try again.",
			values,
		};
	}
}
