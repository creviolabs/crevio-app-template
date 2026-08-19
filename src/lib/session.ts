// Session + entitlement helpers for a Crevio-hosted app, modeled on
// whop-saas-starter's lib/auth.ts (getSession / requireSession / requirePlan),
// adapted to Crevio:
//
//   - Identity comes from the SIGNED USER TOKEN the Crevio dispatch worker
//     forwards on each request (`x-crevio-user-token`), which we verify with
//     `verifyUserToken(getRequestHeaders())` against Crevio's published JWKS —
//     the same contract Whop uses. It holds on- and off-platform: an app hosted
//     elsewhere verifies the exact same token, no dispatch worker required.
//     In dev/preview (no worker, no token) it falls back to a preview viewer so
//     the gated experience is browsable in a single process — see devSession().
//   - Entitlement is ALWAYS read fresh from the Crevio API (access.check), never
//     baked into the token — mirroring whop-saas-starter reading the plan fresh
//     in getSession(), so a purchase/webhook is reflected immediately.
//
// Everything here runs server-side only. Routes reach it through the server
// functions at the bottom of the file, never by importing the helpers above.

import { type CrevioUser, verifyUserToken } from "@crevio/sdk";
import { redirect } from "@tanstack/react-router";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import {
	getRequest,
	getRequestHeaders,
	getRequestHost,
	getRequestProtocol,
} from "@tanstack/react-start/server";
import { z } from "zod";
import { type AccessLevel, hasMinimumAccess } from "./access";
import { createCrevioClient } from "./crevio-client";

// A synthetic viewer used only in dev when nothing else identifies the visitor,
// so an agent (or human) iterating on the template sees the full gated
// experience with zero configuration. getAccess grants this sentinel identity
// admin without an API call — impossible in production (guarded by isDev).
const PREVIEW_USER: CrevioUser = {
	userId: "usr_preview",
	accountId: "acct_preview",
};

const isDev = (): boolean => process.env.NODE_ENV !== "production";

let warnedPreview = false;

// Dev / preview identity, in order of preference:
//   1. CREVIO_DEV_USER + CREVIO_DEV_ACCOUNT → impersonate a real member; access
//      is checked against the real Crevio API, so gated vs. ungated is exercised.
//   2. dev with neither set → the synthetic PREVIEW_USER, treated as admin, so
//      the gated experience renders with no setup at all.
// A real deployment sits behind the dispatch worker, is never in dev, and must
// NOT set these — it reaches neither branch.
function devSession(): CrevioUser | null {
	const userId = process.env.CREVIO_DEV_USER;
	const accountId = process.env.CREVIO_DEV_ACCOUNT;
	if (userId && accountId) return { userId, accountId };
	if (!isDev()) return null;

	if (!warnedPreview) {
		warnedPreview = true;
		console.warn(
			"[crevio] No signed user token or CREVIO_DEV_USER set — rendering the " +
				"gated experience as a synthetic admin preview. This never happens in " +
				"production. Set CREVIO_DEV_USER/CREVIO_DEV_ACCOUNT to impersonate a real member.",
		);
	}
	return PREVIEW_USER;
}

const isPreviewSession = (session: CrevioUser): boolean =>
	isDev() && session.userId === PREVIEW_USER.userId;

export interface AccessResult {
	hasAccess: boolean;
	accessLevel: AccessLevel;
	expiresAt: string | null;
}

export interface Viewer extends CrevioUser {
	name: string | null;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
}

// Verifying the token is an Ed25519 signature check, and one render resolves the
// session more than once — the gate in a layout's beforeLoad and an entitlement
// read in a page's loader are separate server-function invocations, each with
// its own middleware run. Keyed on the request so the memo can never outlive it
// (and simply misses, harmlessly, if a call has no request in scope).
const sessionByRequest = new WeakMap<Request, Promise<CrevioUser | null>>();

/**
 * The signed-in visitor. In production this is the verified signed token the
 * dispatch worker forwards; in dev/preview it falls back to a preview viewer.
 * Identity only — never the entitlement. Fail-closed to anonymous.
 */
function getSession(): Promise<CrevioUser | null> {
	const request = getRequest();
	const cached = sessionByRequest.get(request);
	if (cached) return cached;

	const resolved = (async () => {
		// Defaults to Crevio's production keys inside the SDK; override with
		// CREVIO_JWKS_URL when pointing at another environment.
		const jwksUrl = process.env.CREVIO_JWKS_URL || undefined;
		const verified = await verifyUserToken(getRequestHeaders(), { jwksUrl });
		return verified ?? devSession();
	})();

	sessionByRequest.set(request, resolved);
	return resolved;
}

/**
 * The visitor's profile (name/email), fetched fresh from the Crevio API by id —
 * the Whop `users.retrieve` pattern. The trusted header only carries ids, so
 * profile display goes through the API. Falls back to identity-only.
 */
async function getViewer(session: CrevioUser): Promise<Viewer> {
	try {
		const profile = await createCrevioClient().users.get({
			id: session.userId,
		});
		return {
			...session,
			name:
				[profile.firstName, profile.lastName].filter(Boolean).join(" ") || null,
			firstName: profile.firstName ?? null,
			lastName: profile.lastName ?? null,
			email: profile.email ?? null,
		};
	} catch {
		return {
			...session,
			name: null,
			firstName: null,
			lastName: null,
			email: null,
		};
	}
}

/**
 * Entitlement for a resource (acct_… / prod_… / exp_…), always read fresh from
 * the Crevio API. Anonymous visitors resolve to no_access.
 */
async function getAccess(
	session: CrevioUser | null,
	resourceId: string,
): Promise<AccessResult> {
	const denied: AccessResult = {
		hasAccess: false,
		accessLevel: "no_access",
		expiresAt: null,
	};
	if (!session) return denied;

	// Dev-only preview viewer: grant full access without an API call, since the
	// sentinel identity isn't a real user access.check could resolve.
	if (isPreviewSession(session)) {
		return { hasAccess: true, accessLevel: "admin", expiresAt: null };
	}

	try {
		const result = await createCrevioClient().access.check({
			id: session.userId,
			resourceId,
		});
		return {
			hasAccess: result.hasAccess,
			accessLevel: result.accessLevel as AccessLevel,
			expiresAt: result.expiresAt,
		};
	} catch {
		// Fail closed: an unreachable or erroring entitlement check must never
		// crash the page or grant access.
		return denied;
	}
}

/**
 * Where "Sign in with Crevio" sends the visitor: Crevio's authorize flow, which
 * signs them in and drops the session cookie the dispatch worker reads.
 *
 * `return_to` MUST be an absolute site URL — the authorize endpoint resolves the
 * AiSite by host and rejects bare paths — so we build it from the request host,
 * mirroring what the dispatch worker sends (request.url). This only completes
 * for a DEPLOYED Crevio site (a host that maps to an AiSite); on localhost the
 * authorize flow has no site to resolve.
 */
function signInUrl(returnToPath: string): string {
	const base =
		process.env.CREVIO_SIGN_IN_URL || "https://crevio.co/sites/authorize";
	const host = getRequestHost({ xForwardedHost: true });
	const returnTo = `${getRequestProtocol()}://${host}${returnToPath}`;

	const url = new URL(base);
	url.searchParams.set("return_to", returnTo);
	return url.toString();
}

// ---------------------------------------------------------------------------
// Route-facing server functions.
// ---------------------------------------------------------------------------

const returnTo = z.object({ returnTo: z.string().default("/") });

/** Hands the resolved visitor to every server function below. */
const sessionMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => next({ context: { session: await getSession() } }),
);

/** Sends the visitor to the branded sign-in page, preserving where they were. */
function toLogin(path: string): never {
	throw redirect({ to: "/login", search: { return_to: path } });
}

/** Whether anyone is signed in. Identity only — no profile round-trip. */
export const hasSession = createServerFn({ method: "GET" })
	.middleware([sessionMiddleware])
	.handler(({ context }): boolean => context.session !== null);

/** The signed-in visitor's profile, or null. Never redirects. */
export const loadViewer = createServerFn({ method: "GET" })
	.middleware([sessionMiddleware])
	.handler(
		async ({ context }): Promise<Viewer | null> =>
			context.session ? getViewer(context.session) : null,
	);

/**
 * Require a signed-in visitor and return their profile; otherwise redirect to
 * the branded sign-in page. Call from a gated layout route's `beforeLoad`.
 */
export const requireViewer = createServerFn({ method: "GET" })
	.middleware([sessionMiddleware])
	.validator(returnTo)
	.handler(async ({ data, context }): Promise<Viewer> => {
		if (!context.session) toLogin(data.returnTo);
		return getViewer(context.session);
	});

/**
 * Entitlement for a resource, read fresh. Anonymous resolves to no_access.
 * Omit `resourceId` to check access to the visitor's own account.
 */
export const loadAccess = createServerFn({ method: "GET" })
	.middleware([sessionMiddleware])
	.validator(z.object({ resourceId: z.string().optional() }))
	.handler(
		async ({ data, context }): Promise<AccessResult> =>
			getAccess(
				context.session,
				data.resourceId ?? context.session?.accountId ?? "",
			),
	);

/**
 * Require at least `minimum` access to a resource. Redirects anonymous visitors
 * to sign-in and insufficient ones to `upgradeUrl` (e.g. a checkout link).
 */
export const requireAccess = createServerFn({ method: "GET" })
	.middleware([sessionMiddleware])
	.validator(
		returnTo.extend({
			resourceId: z.string(),
			minimum: z.enum(["no_access", "customer", "admin"]).default("customer"),
			upgradeUrl: z.string().default("/"),
		}),
	)
	.handler(async ({ data, context }): Promise<AccessResult> => {
		if (!context.session) toLogin(data.returnTo);
		const access = await getAccess(context.session, data.resourceId);
		if (!hasMinimumAccess(access.accessLevel, data.minimum)) {
			throw redirect({ href: data.upgradeUrl });
		}
		return access;
	});

/** The Crevio authorize URL to send a visitor to, for the sign-in button. */
export const loadSignInUrl = createServerFn({ method: "GET" })
	.validator(returnTo)
	.handler(({ data }) => signInUrl(data.returnTo));
