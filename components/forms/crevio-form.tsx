import { FormFields } from "@/components/forms/form-fields";
import { createCrevioClient } from "@/lib/crevio-client";

interface CrevioFormProps {
	formId: string;
	heading?: string;
	description?: string;
	submitLabel?: string;
	className?: string;
}

/**
 * CrevioForm
 *
 * Schema-driven form renderer. Pass an `id` from `crevio.forms.create()`
 * (the `crevio_api` MCP) and the component fetches the Form, renders its
 * fields, and posts submissions through `lib/actions/submit-form.ts`.
 * Honors `confirmationRequired` for the success message.
 */
export async function CrevioForm({
	formId,
	heading,
	description,
	submitLabel = "Submit",
	className,
}: CrevioFormProps) {
	const form = formId
		? await createCrevioClient()
				.forms.get({ id: formId })
				.catch(() => null)
		: null;

	if (!form) {
		return (
			<div className={className}>
				<div className="flex flex-col items-center gap-2 text-center">
					<p className="text-sm font-medium">
						This form isn't available right now.
					</p>
					<p className="text-xs text-muted-foreground">
						If you came here to sign up, please let the site owner know so they
						can fix it.
					</p>
				</div>
			</div>
		);
	}

	return (
		<FormFields
			form={form}
			heading={heading}
			description={description}
			submitLabel={submitLabel}
			className={className}
		/>
	);
}
