import { notFound } from "@tanstack/react-router";

// Built-in modules — flip a flag to add/remove that capability everywhere.
export const features = {
	auth: true, // Sign in with Crevio + gated /dashboard
	bookings: true, // <CrevioBooking> embeddable scheduler
	blog: true, // /blog
	forms: true, // contact / newsletter form
	legal: true, // /legal policy pages + footer links
} as const;

export type FeatureKey = keyof typeof features;

/**
 * Route options that gate a whole subtree on a feature module.
 *
 * Spread into a LAYOUT route: `createFileRoute("/_marketing/blog")({
 * ...featureRoute("blog"), component: Outlet })`. The file router forces every
 * route below it to nest under it, so nothing there can ship ungated.
 *
 * `beforeLoad`, not `loader` — beforeLoad runs parent-to-child and halts the
 * chain on a thrown notFound, while loaders all run together under Promise.all.
 * The same key also lands in `staticData`, which is what drops the subtree's
 * URLs from the sitemap while the flag is off (see lib/sitemap-routes).
 */
export function featureRoute(key: FeatureKey) {
	return {
		beforeLoad: () => {
			if (!features[key]) throw notFound();
		},
		staticData: { feature: key },
	} as const;
}
