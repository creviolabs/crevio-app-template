import { motion } from "framer-motion";
import { Eye, TrendingDown, Zap } from "lucide-react";

const features = [
	{
		icon: Zap,
		title: "Lightning fast inference",
		description:
			"Sub-100ms latency on model serving. Optimized runtimes with automatic batching and caching at the edge.",
	},
	{
		icon: Eye,
		title: "Built-in observability",
		description:
			"Monitor every request, trace token usage, and debug model outputs with structured logging out of the box.",
	},
	{
		icon: TrendingDown,
		title: "Scale to zero",
		description:
			"Pay only for what you use. Endpoints spin down automatically and cold-start in under a second.",
	},
];

const FeaturesSection = () => {
	return (
		<section id="features" className="py-20 md:py-28">
			<div className="container">
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center mb-14"
				>
					<h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
						Everything you need to ship AI
					</h2>
					<p className="text-muted-foreground text-lg max-w-xl mx-auto">
						A complete platform so you can focus on your product, not
						infrastructure.
					</p>
				</motion.div>

				<div className="grid md:grid-cols-3 gap-6">
					{features.map((feature, i) => (
						<motion.div
							key={feature.title}
							initial={{ opacity: 0, y: 12 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: i * 0.05 }}
							className="group rounded-xl border border-border bg-card p-6 transition-colors hover:bg-muted/50"
						>
							<div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4">
								<feature.icon size={20} className="text-foreground" />
							</div>
							<h3 className="font-semibold mb-2">{feature.title}</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">
								{feature.description}
							</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
};

export default FeaturesSection;
