import { motion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
	return (
		<section className="pt-28 pb-16 md:pt-36 md:pb-24">
			<div className="container max-w-4xl">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="text-center"
				>
					<div className="inline-flex items-center gap-2 border border-border rounded-full px-3.5 py-1 text-xs text-muted-foreground mb-8">
						<span className="w-1.5 h-1.5 rounded-full bg-foreground" />
						Now in public beta
					</div>

					<h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
						AI infrastructure for
						<br />
						the next generation
					</h1>

					<p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
						Build, deploy, and scale AI-powered applications with a unified
						platform. From prototype to production in minutes.
					</p>

					<div className="flex items-center justify-center gap-3">
						<Button size="lg" className="h-11 px-6">
							Get Started <ArrowRight size={16} />
						</Button>
						<Button variant="outline" size="lg" className="h-11 px-6">
							Documentation
						</Button>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.15 }}
					className="mt-16 md:mt-20"
				>
					<div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
						<div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
							<Terminal size={14} className="text-muted-foreground" />
							<span className="text-xs text-muted-foreground font-mono">
								terminal
							</span>
						</div>
						<div className="p-5 font-mono text-sm leading-relaxed">
							<p className="text-muted-foreground">
								<span className="text-foreground">$</span> acme deploy --model
								gpt-4o --region us-east
							</p>
							<p className="text-muted-foreground mt-2">
								✓ Model endpoint provisioned
							</p>
							<p className="text-muted-foreground">
								✓ Auto-scaling configured (0→100 replicas)
							</p>
							<p className="text-muted-foreground">
								✓ Monitoring dashboard ready
							</p>
							<p className="text-foreground mt-2">
								<span className="text-muted-foreground">→</span> Live at
								https://api.acme.dev/v1
							</p>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default HeroSection;
