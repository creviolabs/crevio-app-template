import { createFileRoute, Outlet } from "@tanstack/react-router";
import { featureRoute } from "@/config/features";

// See src/routes/_marketing/blog.tsx — gating belongs on the layout route so
// every /legal page inherits it.
export const Route = createFileRoute("/_marketing/legal")({
	...featureRoute("legal"),
	loader: async ({ parentMatchPromise }) => ({
		account: (await parentMatchPromise).loaderData?.account ?? null,
	}),
	component: Outlet,
});
