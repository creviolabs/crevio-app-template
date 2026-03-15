import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const Header = () => {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
			<div className="container flex items-center justify-between h-14">
				<a href="/" className="font-semibold text-lg tracking-tight">
					acme
				</a>
				<nav className="hidden md:flex items-center gap-8">
					<a
						href="#features"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Features
					</a>
					<a
						href="#pricing"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Pricing
					</a>
					<a
						href="/docs"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Docs
					</a>
				</nav>
				<div className="hidden md:flex items-center gap-3">
					<Button variant="ghost" size="sm">
						Sign in
					</Button>
					<Button size="sm">Get Started</Button>
				</div>
				<button
					type="button"
					className="md:hidden"
					onClick={() => setMobileOpen(!mobileOpen)}
				>
					{mobileOpen ? <X size={20} /> : <Menu size={20} />}
				</button>
			</div>
			{mobileOpen && (
				<div className="md:hidden border-t border-border p-4 flex flex-col gap-3 bg-background">
					<a href="#features" className="text-sm text-muted-foreground py-1">
						Features
					</a>
					<a href="#pricing" className="text-sm text-muted-foreground py-1">
						Pricing
					</a>
					<a href="/docs" className="text-sm text-muted-foreground py-1">
						Docs
					</a>
					<div className="flex gap-2 pt-2">
						<Button variant="ghost" size="sm" className="flex-1">
							Sign in
						</Button>
						<Button size="sm" className="flex-1">
							Get Started
						</Button>
					</div>
				</div>
			)}
		</header>
	);
};

export default Header;
