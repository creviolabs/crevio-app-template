import { createFileRoute, Outlet } from "@tanstack/react-router";
import { featureRoute } from "@/config/features";

// Gating lives here, not in each page: the file router forces every /blog route
// to nest under this one, so a new blog route cannot be added ungated.
export const Route = createFileRoute("/_marketing/blog")({
	...featureRoute("blog"),
	// Forwards the account the _marketing layout already loaded, so pages below
	// can title themselves without fetching it again.
	loader: async ({ parentMatchPromise }) => ({
		account: (await parentMatchPromise).loaderData?.account ?? null,
	}),
	component: Outlet,
});
