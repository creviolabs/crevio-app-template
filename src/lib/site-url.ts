import { createIsomorphicFn } from "@tanstack/react-start";
import {
	getRequestHost,
	getRequestProtocol,
} from "@tanstack/react-start/server";

/**
 * The site's public origin, without a trailing slash — callers append paths.
 *
 * Isomorphic because `head()` runs on the server during SSR and again in the
 * browser on client-side navigation: a bare `process.env` read would be
 * `undefined` on the second. On the server the configured CREVIO_APP_URL wins,
 * falling back to the request host so previews and localhost resolve too.
 */
export const getAppUrl = createIsomorphicFn()
	.server((): string => {
		const configured = process.env.CREVIO_APP_URL;
		if (configured) return configured.replace(/\/+$/, "");
		return `${getRequestProtocol()}://${getRequestHost({ xForwardedHost: true })}`;
	})
	.client((): string => window.location.origin);
