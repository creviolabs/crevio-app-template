import type { Form } from "@crevio/sdk/models";
import { DynamicFormFields } from "@/components/forms/dynamic-form-fields";
import { createCrevioClient } from "@/lib/crevio-client";

/**
 * DynamicForm
 *
 * Schema-driven form renderer. Drop in once a Form has been provisioned via
 * the `crevio_api` MCP and you'll get a working form for every field type
 * (`email | text | phone | textarea | radio | select | checkbox`). Honors the
 * Form's `confirmationRequired` flag — success message switches between
 * "Submitted." and "Check your inbox to confirm." automatically.
 *
 * Use NewsletterForm or ContactForm when you need their flagship layouts.
 * Use this for anything else (waitlists, RSVPs, beta signups, surveys).
 */
interface DynamicFormProps {
	formId?: string;
	purpose?: "newsletter" | "contact" | "lead_magnet" | "custom";
	heading?: string;
	description?: string;
	submitLabel?: string;
	className?: string;
}

async function resolveForm({
	formId,
	purpose,
}: Pick<DynamicFormProps, "formId" | "purpose">): Promise<Form | null> {
	const crevio = createCrevioClient();

	if (formId) {
		try {
			return await crevio.forms.get({ id: formId });
		} catch {
			return null;
		}
	}

	if (purpose) {
		const list = await crevio.forms
			.list({ purpose, isPrimary: true })
			.catch(() => null);
		return list?.data?.[0] ?? null;
	}

	return null;
}

export async function DynamicForm({
	formId,
	purpose,
	heading,
	description,
	submitLabel = "Submit",
	className,
}: DynamicFormProps) {
	const form = await resolveForm({ formId, purpose });

	if (!form) {
		return (
			<div className={className}>
				<p className="text-sm text-muted-foreground">
					{formId
						? `Form ${formId} not found.`
						: `No primary ${purpose ?? ""} form set up yet.`}
				</p>
			</div>
		);
	}

	return (
		<DynamicFormFields
			form={form}
			heading={heading}
			description={description}
			submitLabel={submitLabel}
			className={className}
		/>
	);
}
