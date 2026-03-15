const Footer = () => (
	<footer className="py-10 border-t border-border">
		<div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
			<span className="font-semibold text-foreground tracking-tight">acme</span>
			<div className="flex items-center gap-6">
				<a href="/docs" className="hover:text-foreground transition-colors">
					Docs
				</a>
				<a href="/github" className="hover:text-foreground transition-colors">
					GitHub
				</a>
				<a href="/twitter" className="hover:text-foreground transition-colors">
					Twitter
				</a>
			</div>
			<p>© 2026 Acme Inc.</p>
		</div>
	</footer>
);

export default Footer;
