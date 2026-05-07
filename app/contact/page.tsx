import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { getAccount } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
	try {
		const account = await getAccount();
		return {
			title: `Contact ${account.name}`,
			description: `Get in touch with ${account.name}.`,
		};
	} catch {
		return { title: "Contact" };
	}
}

export default function ContactPage() {
	return (
		<div className="container py-16">
			<div className="mx-auto max-w-2xl">
				<ContactForm />
			</div>
		</div>
	);
}
