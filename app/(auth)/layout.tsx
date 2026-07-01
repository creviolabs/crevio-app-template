// Standalone centered shell for auth screens — no storefront header/footer.
export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-16">
			{children}
		</main>
	);
}
