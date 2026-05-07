import { NewsletterForm } from "@/components/forms/newsletter-form";

interface FooterCtaProps {
	name: string;
}

export function FooterCta({ name }: FooterCtaProps) {
	return (
		<section className="border-t border-border/40 py-14">
			<div className="container flex flex-col items-center gap-4 text-center">
				<h2 className="text-2xl font-semibold tracking-tight">
					Stay in the loop
				</h2>
				<p className="max-w-md text-sm text-muted-foreground">
					Subscribe to {name} for occasional updates straight to your inbox.
				</p>
				<NewsletterForm />
			</div>
		</section>
	);
}
