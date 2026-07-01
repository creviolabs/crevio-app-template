// Session + entitlement helpers for a Crevio-hosted app, modeled on
// whop-saas-starter's lib/auth.ts (getSession / requireSession / requirePlan),
// adapted to Crevio:
//
//   - Identity comes from the SIGNED USER TOKEN the Crevio dispatch worker
//     forwards on each request (`x-crevio-user-token`), which we verify with
//     `verifyUserToken(headers())` against Crevio's published JWKS — the same
//     contract Whop uses. It holds on- and off-platform: an app hosted
//     elsewhere verifies the exact same token, no dispatch worker required.
//     In dev/preview (no worker, no token) it falls back to a preview viewer so
//     the gated experience is browsable in a single process — see devSession().
//   - Entitlement is ALWAYS read fresh from the Crevio API (access.check), never
//     baked into the token — mirroring whop-saas-starter reading the plan fresh
//     in getSession(), so a purchase/webhook is reflected immediately.

import { type CrevioUser, verifyUserToken } from "@crevio/sdk";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { type AccessLevel, hasMinimumAccess } from "./access";
import { createCrevioClient } from "./crevio-client";

// Where to fetch Crevio's Ed25519 public keys. Defaults to production inside the
// SDK; override with CREVIO_JWKS_URL when pointing at another environment.
const jwksUrl = process.env.CREVIO_JWKS_URL || undefined;

const isDev = process.env.NODE_ENV !== "production";

// A synthetic viewer used only in dev when nothing else identifies the visitor,
// so an agent (or human) iterating on the template sees the full gated
// experience with zero configuration. getAccess grants this sentinel identity
// admin without an API call — impossible in production (guarded by isDev).
const PREVIEW_USER: CrevioUser = {
	userId: "usr_preview",
	accountId: "acct_preview",
};

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
	if (!isDev) return null;

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
	isDev && session.userId === PREVIEW_USER.userId;

export interface AccessResult {
	session: CrevioUser | null;
	hasAccess: boolean;
	accessLevel: AccessLevel;
	expiresAt: string | null;
}

/**
 * The signed-in visitor. In production this is the verified signed token the
 * dispatch worker forwards; in dev/preview it falls back to a preview viewer.
 * Identity only — never the entitlement. Fail-closed to anonymous. Memoized.
 */
export const getSession = cache(async (): Promise<CrevioUser | null> => {
	const verified = await verifyUserToken(await headers(), { jwksUrl });
	return verified ?? devSession();
});

export interface Viewer extends CrevioUser {
	name: string | null;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
}

/**
 * The signed-in visitor's profile (name/email), fetched fresh from the Crevio
 * API by id — the Whop `users.retrieve` pattern. The trusted header only carries
 * ids, so profile display goes through the API. Fail-closed to identity-only if
 * the profile can't be fetched. Request-memoized.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
	const session = await getSession();
	if (!session) return null;

	try {
		const crevio = createCrevioClient();
		const profile = await crevio.users.get({ id: session.userId });
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
});

/** Require a signed-in visitor; otherwise send them to the branded sign-in page. */
export async function requireSession(returnTo = "/"): Promise<CrevioUser> {
	const session = await getSession();
	if (!session) redirect(`/login?return_to=${encodeURIComponent(returnTo)}`);
	return session;
}

/**
 * Entitlement for a resource (acct_… / prod_… / exp_…), always read fresh from
 * the Crevio API. Anonymous visitors resolve to no_access. Request-memoized per
 * resource, so calling it and <AccessGate> in the same render hits the API once.
 */
export const getAccess = cache(
	async (resourceId: string): Promise<AccessResult> => {
		const session = await getSession();
		if (!session) {
			return {
				session: null,
				hasAccess: false,
				accessLevel: "no_access",
				expiresAt: null,
			};
		}

		// Dev-only preview viewer: grant full access without an API call, since
		// the sentinel identity isn't a real user access.check could resolve.
		if (isPreviewSession(session)) {
			return {
				session,
				hasAccess: true,
				accessLevel: "admin",
				expiresAt: null,
			};
		}

		try {
			const crevio = createCrevioClient();
			const result = await crevio.access.check({
				id: session.userId,
				resourceId,
			});

			return {
				session,
				hasAccess: result.hasAccess,
				accessLevel: result.accessLevel as AccessLevel,
				expiresAt: result.expiresAt,
			};
		} catch {
			// Fail closed: an unreachable or erroring entitlement check must never
			// crash the page or grant access.
			return {
				session,
				hasAccess: false,
				accessLevel: "no_access",
				expiresAt: null,
			};
		}
	},
);

/**
 * Require at least `minimum` access to a resource. Redirects anonymous visitors
 * to sign-in and insufficient ones to `upgradeUrl` (e.g. a checkout link).
 */
export async function requireAccess(
	resourceId: string,
	minimum: AccessLevel = "customer",
	upgradeUrl = "/",
): Promise<AccessResult> {
	await requireSession();
	const access = await getAccess(resourceId);
	if (!hasMinimumAccess(access.accessLevel, minimum)) redirect(upgradeUrl);
	return access;
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
export async function signInUrl(returnToPath = "/"): Promise<string> {
	const base =
		process.env.CREVIO_SIGN_IN_URL || "https://crevio.co/sites/authorize";

	const h = await headers();
	const host = h.get("x-forwarded-host") ?? h.get("host");
	const proto = h.get("x-forwarded-proto") ?? "https";
	const returnTo = host ? `${proto}://${host}${returnToPath}` : returnToPath;

	const url = new URL(base);
	url.searchParams.set("return_to", returnTo);
	return url.toString();
}
