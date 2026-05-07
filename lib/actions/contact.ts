"use server";

import { createCrevioClient } from "@/lib/crevio-client";

export type ContactFields = {
	email?: string;
	subject?: string;
	message?: string;
};

export type ContactState =
	| { status: "idle" }
	| { status: "success"; message: string }
	| { status: "error"; message: string; fields: ContactFields };

const MAX_MESSAGE_LENGTH = 5000;

export async function sendContactMessage(
	_prev: ContactState,
	formData: FormData,
): Promise<ContactState> {
	const fields: ContactFields = {
		email: String(formData.get("email") ?? "").trim(),
		subject: String(formData.get("subject") ?? "").trim(),
		message: String(formData.get("message") ?? "").trim(),
	};

	const error = (message: string): ContactState => ({ status: "error", message, fields });

	if (!fields.email) return error("Please enter your email.");
	if (!fields.message) return error("Please write a message.");
	if (fields.message.length > MAX_MESSAGE_LENGTH) {
		return error(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`);
	}

	try {
		const crevio = createCrevioClient();

		const forms = await crevio.forms.list({ purpose: "contact", isPrimary: true });
		const form = forms.data?.[0];
		if (!form) return error("Contact form is not set up yet. Please try again later.");

		const answers: Record<string, string | undefined> = {};
		for (const field of form.formFields) {
			switch (field.fieldType) {
				case "email":
					answers[field.id] = fields.email;
					break;
				case "textarea":
					answers[field.id] = fields.message;
					break;
				case "text":
					if (field.name.toLowerCase().includes("subject")) {
						answers[field.id] = fields.subject;
					}
					break;
			}
		}

		await crevio.formSubmissions.create({
			formId: form.id,
			email: fields.email,
			answers,
		});

		return {
			status: "success",
			message: form.confirmationRequired
				? "Check your inbox to confirm your email — we'll reply once you do."
				: "Thanks — we'll get back to you soon.",
		};
	} catch (e) {
		return error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
	}
}
