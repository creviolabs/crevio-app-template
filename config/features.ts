import { notFound } from "next/navigation";

// Built-in modules — flip a flag to add/remove that capability everywhere.
export const features = {
	auth: true, // Sign in with Crevio + gated /dashboard
	bookings: true, // /book scheduling
	blog: true, // /blog
	forms: false, // contact / newsletter form
	legal: false, // /legal policy pages + footer links
} as const;

export type FeatureKey = keyof typeof features;

// Call at the top of a route/segment to 404 it when its module is off.
export function requireFeature(key: FeatureKey): void {
	if (!features[key]) notFound();
}
