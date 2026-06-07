"use client";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-muted">
			<div className="max-w-md px-4 text-center">
				<h1 className="mb-4 text-4xl font-bold">Something went wrong</h1>
				<p className="mb-6 text-xl text-muted-foreground">
					{error.message || "An unexpected error occurred."}
				</p>
				<div className="flex items-center justify-center gap-4">
					<button
						type="button"
						onClick={reset}
						className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
					>
						Try again
					</button>
					<a href="/" className="text-primary underline hover:text-primary/90">
						Return to Home
					</a>
				</div>
			</div>
		</div>
	);
}
