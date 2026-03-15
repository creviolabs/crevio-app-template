import FeaturesSection from "@/components/features-section";
import Footer from "@/components/footer";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import LogoCloud from "@/components/logo-cloud";
import PricingSection from "@/components/pricing-section";

const Index = () => {
	return (
		<div className="min-h-screen bg-background">
			<Header />
			<HeroSection />
			<LogoCloud />
			<FeaturesSection />
			<PricingSection />
			<Footer />
		</div>
	);
};

export default Index;
