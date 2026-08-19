import { createFileRoute, Outlet } from "@tanstack/react-router";
import { featureRoute } from "@/config/features";

// Standalone centered shell for auth screens — no storefront header/footer.
export const Route = createFileRoute("/_auth")({
	...featureRoute("auth"),
	component: AuthLayout,
});

function AuthLayout() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-16">
			<Outlet />
		</main>
	);
}
