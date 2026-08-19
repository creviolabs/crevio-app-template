import { CrevioForm } from "@/components/forms/crevio-form";
import type { FormId } from "@/lib/crevio-ids";
import { cn } from "@/lib/utils";

/**
 * The Form this section submits to.
 *
 * Create the Form FIRST via the `crevio_api` MCP (`POST /v1/forms` — define the
 * fields there) and paste the `form_…` prefix_id it returns. Empty does not
 * compile: `FormId` is `` `form_${string}` ``. If the site needs no form here,
 * remove the <CtaSection> usage rather than inventing an id.
 */
const FORM_ID: FormId = "";

interface CtaSectionProps {
	heading?: string;
	description?: string;
	className?: string;
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
	className,
}: CtaSectionProps) {
	return (
		<section className={cn("border-t border-border/40 py-14", className)}>
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
