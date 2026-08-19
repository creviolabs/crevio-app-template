import { createRouter } from "@tanstack/react-router";
import { NotFound } from "@/components/not-found";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultNotFoundComponent: NotFound,
		// No defaultStaleTime on purpose: session and entitlement reads
		// (lib/session) deliberately bypass the cache so a purchase is reflected
		// immediately, and a global default would stale them too. Content routes
		// opt in individually with `staleTime: CONTENT_STALE_TIME`.
	});
}
