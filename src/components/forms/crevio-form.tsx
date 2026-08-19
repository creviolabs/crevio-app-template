import { CrevioEmbed } from "@/components/crevio-embed";
import { FormFields } from "@/components/forms/form-fields";
import { getForm } from "@/lib/actions/forms";
import type { FormId } from "@/lib/crevio-ids";

interface CrevioFormProps {
	formId: FormId;
	heading?: string;
	description?: string;
	submitLabel?: string;
	className?: string;
}

/**
 * CrevioForm
 *
 * Schema-driven form renderer. Pass the prefix_id ("form_...") from
 * `crevio.forms.create()` (the `crevio_api` MCP) and the component fetches the
 * Form, renders its fields, and posts submissions through
 * `lib/actions/forms.ts`. Honors `confirmationRequired` for the success
 * message.
 *
 * The schema is fetched from the browser so the component stays droppable into
 * any page without that page's loader knowing about it; a route that always
 * shows a form should load it in its own `loader` and render <FormFields>.
 *
 * `formId` is typed `` `form_${string}` ``, so an empty or wrong-prefix id
 * fails to compile rather than shipping the fallback below.
 */
export function CrevioForm({
	formId,
	heading,
	description,
	submitLabel = "Submit",
	className,
}: CrevioFormProps) {
	return (
		<CrevioEmbed
			id={formId}
			load={(id) => getForm({ data: { formId: id } })}
			intent="sign up"
			className={className}
		>
			{(form) => (
				<FormFields
					form={form}
					heading={heading}
					description={description}
					submitLabel={submitLabel}
				/>
			)}
		</CrevioEmbed>
	);
}
