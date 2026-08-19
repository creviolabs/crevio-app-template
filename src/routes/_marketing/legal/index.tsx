import { createFileRoute, notFound } from "@tanstack/react-router";

// /legal is a container, not a page — policies live at /legal/$slug. Without
// this the layout matches bare /legal and renders an empty <main> as a 200,
// which is a soft-404 a crawler will happily index.
export const Route = createFileRoute("/_marketing/legal/")({
	staticData: { sitemap: false },
	loader: () => {
		throw notFound();
	},
});
