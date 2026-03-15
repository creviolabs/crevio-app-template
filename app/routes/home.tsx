import FeaturesSection from "@/components/features-section";
import Footer from "@/components/footer";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import LogoCloud from "@/components/logo-cloud";
import PricingSection from "@/components/pricing-section";
import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home() {
	return (
		<>
			<Header />
			<HeroSection />
			<LogoCloud />
			<FeaturesSection />
			<PricingSection />
			<Footer />
		</>
	);
}
