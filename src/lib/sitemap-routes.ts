// Static route discovery for /sitemap.xml, read off the router's own route
// table — so a route added under `src/routes/` appears in the sitemap without
// anyone remembering to list it here.
import type { FeatureKey } from "@/config/features";
import { features } from "@/config/features";
import { getRouter } from "@/router";

export type ChangeFrequency =
	| "always"
	| "hourly"
	| "daily"
	| "weekly"
	| "monthly"
	| "yearly"
	| "never";

declare module "@tanstack/react-router" {
	interface StaticDataRouteOption {
		/**
		 * Sitemap policy for this route. `false` means "not an indexable page" —
		 * a layout route, an API handler, or anything noindex. Declared on the
		 * route because the route is what knows.
		 */
		sitemap?: { priority?: number; changeFrequency?: ChangeFrequency } | false;
		/** Feature module this route belongs to; dropped while the flag is off. */
		feature?: FeatureKey;
	}
}

export interface StaticRoute {
	path: string;
	priority: number;
	changeFrequency: ChangeFrequency;
}

const DEFAULT_PRIORITY = 0.5;
const DEFAULT_CHANGE_FREQUENCY: ChangeFrequency = "daily";

/**
 * Every static, indexable page the site serves. A route opts out with
 * `staticData: { sitemap: false }`; dynamic segments are enumerated from the
 * API in `src/routes/sitemap[.]xml.ts` instead.
 */
interface RouteLike {
	options?: {
		component?: unknown;
		staticData?: {
			sitemap?:
				| { priority?: number; changeFrequency?: ChangeFrequency }
				| false;
			feature?: FeatureKey;
		};
	};
	parentRoute?: RouteLike;
	children?: ReadonlyArray<unknown>;
}

// A page inherits the feature of the layout that gates it, so a new route under
// `_marketing/blog/` is dropped with the flag without restating anything.
function isEnabled(route: RouteLike | undefined): boolean {
	for (let r = route; r; r = r.parentRoute) {
		const key = r.options?.staticData?.feature;
		if (key && !features[key]) return false;
	}
	return true;
}

export function discoverStaticRoutes(): StaticRoute[] {
	const routes = getRouter().routesByPath as unknown as Record<
		string,
		RouteLike
	>;

	const seen = new Map<string, StaticRoute>();

	for (const [rawPath, route] of Object.entries(routes)) {
		const options = route.options;
		const staticData = options?.staticData;

		if (!options?.component) continue; // server routes render no page
		if (rawPath.includes("$")) continue; // enumerated from the API instead
		// A layout route has children and renders an Outlet, not a page. Deriving
		// it beats annotating every layout — /legal is a layout with no index
		// child, and listing it produced a 200 with an empty <main>.
		if (route.children?.length) continue;
		if (staticData?.sitemap === false) continue; // noindex pages
		if (!isEnabled(route)) continue;

		// `/blog` (layout) and `/blog/` (its index) are the same URL.
		const path = rawPath.length > 1 ? rawPath.replace(/\/$/, "") : rawPath;
		if (seen.has(path)) continue;

		seen.set(path, {
			path,
			priority: staticData?.sitemap?.priority ?? DEFAULT_PRIORITY,
			changeFrequency:
				staticData?.sitemap?.changeFrequency ?? DEFAULT_CHANGE_FREQUENCY,
		});
	}

	return [...seen.values()].sort((a, b) => a.path.localeCompare(b.path));
}
