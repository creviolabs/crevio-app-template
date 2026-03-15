const companies = [
	"Vercel",
	"Linear",
	"Resend",
	"Supabase",
	"Railway",
	"Clerk",
];

const LogoCloud = () => {
	return (
		<section className="py-12 border-y border-border">
			<div className="container">
				<p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-8">
					Trusted by forward-thinking teams
				</p>
				<div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
					{companies.map((name) => (
						<span
							key={name}
							className="text-lg font-semibold text-muted-foreground/30 select-none"
						>
							{name}
						</span>
					))}
				</div>
			</div>
		</section>
	);
};

export default LogoCloud;
