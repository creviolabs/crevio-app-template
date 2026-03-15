import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers = [
	{
		name: "Free",
		price: "$0",
		description: "For experiments and side projects",
		features: [
			"1,000 requests/month",
			"1 model endpoint",
			"Community support",
			"Basic analytics",
		],
		cta: "Start Free",
		highlight: false,
	},
	{
		name: "Pro",
		price: "$49",
		period: "/mo",
		description: "For production workloads",
		features: [
			"100,000 requests/month",
			"Unlimited endpoints",
			"Priority support",
			"Advanced observability",
			"Custom domains",
			"Team access",
		],
		cta: "Get Started",
		highlight: true,
	},
	{
		name: "Enterprise",
		price: "Custom",
		description: "For organizations at scale",
		features: [
			"Unlimited requests",
			"Dedicated infrastructure",
			"SLA guarantee",
			"SSO & audit logs",
			"On-premise option",
			"Solutions engineer",
		],
		cta: "Contact Sales",
		highlight: false,
	},
];

const PricingSection = () => {
	return (
		<section id="pricing" className="py-20 md:py-28 border-t border-border">
			<div className="container max-w-5xl">
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center mb-14"
				>
					<h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
						Simple, transparent pricing
					</h2>
					<p className="text-muted-foreground text-lg">
						Start free. Scale as you grow.
					</p>
				</motion.div>

				<div className="grid md:grid-cols-3 gap-6">
					{tiers.map((tier, i) => (
						<motion.div
							key={tier.name}
							initial={{ opacity: 0, y: 12 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: i * 0.05 }}
							className={`rounded-xl border p-6 flex flex-col ${
								tier.highlight
									? "border-foreground bg-foreground text-background"
									: "border-border bg-card"
							}`}
						>
							<div className="mb-6">
								<p
									className={`text-sm font-medium mb-3 ${tier.highlight ? "text-background/70" : "text-muted-foreground"}`}
								>
									{tier.name}
								</p>
								<div className="flex items-baseline gap-1">
									<span className="text-4xl font-bold tracking-tight">
										{tier.price}
									</span>
									{tier.period && (
										<span
											className={`text-sm ${tier.highlight ? "text-background/60" : "text-muted-foreground"}`}
										>
											{tier.period}
										</span>
									)}
								</div>
								<p
									className={`text-sm mt-2 ${tier.highlight ? "text-background/70" : "text-muted-foreground"}`}
								>
									{tier.description}
								</p>
							</div>

							<div className="space-y-3 mb-8 flex-1">
								{tier.features.map((f) => (
									<div key={f} className="flex items-center gap-2.5 text-sm">
										<Check
											size={14}
											className={
												tier.highlight
													? "text-background/50"
													: "text-muted-foreground"
											}
										/>
										{f}
									</div>
								))}
							</div>

							<Button
								variant={tier.highlight ? "secondary" : "outline"}
								className="w-full"
							>
								{tier.cta}
							</Button>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
};

export default PricingSection;
