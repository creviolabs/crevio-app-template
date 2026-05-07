import { CrevioForm } from "@/components/forms/crevio-form";

/**
 * Set this to the id returned when you provisioned the Form via the
 * `crevio_api` MCP. CrevioForm renders a friendly fallback if the id is
 * empty or doesn't resolve.
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
