import { CrevioForm } from "@/components/forms/crevio-form";

/**
 * Set this to the prefix_id ("form_...") returned when you provision the
 * Form via the `crevio_api` MCP (POST /v1/forms — define the fields you
 * want there). The build FAILS if this is left empty while CtaSection is
 * still rendered (see scripts/check-form-ids.ts); if you don't want a form,
 * remove the CtaSection usage instead.
 */
const FORM_ID: string = "";

interface CtaSectionProps {
	heading?: string;
	description?: string;
}

/**
 * CtaSection
 *
 * Centered page-end band wrapping a CrevioForm. Use for newsletter,
 * lead-magnet, or any single-purpose signup at the footer of a page.
 *
 * The Form binding lives in the `FORM_ID` constant above so callers don't
 * need to know it. Edit this file to swap the bound Form, or copy it for
 * page-specific variants.
 */
export function CtaSection({
	heading = "Stay in the loop",
	description = "Subscribe for occasional updates straight to your inbox.",
}: CtaSectionProps) {
	return (
		<section className="border-t border-border/40 py-14">
			<div className="container mx-auto max-w-md">
				<CrevioForm
					formId={FORM_ID}
					heading={heading}
					description={description}
					submitLabel="Subscribe"
				/>
			</div>
		</section>
	);
}
