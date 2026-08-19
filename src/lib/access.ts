// Pure access-level helpers (no server imports) — safe to import from both
// server code (lib/session) and client components (components/access-gate).

export type AccessLevel = "no_access" | "customer" | "admin";

export const ACCESS_RANK: Record<AccessLevel, number> = {
	no_access: 0,
	customer: 1,
	admin: 2,
};

export function hasMinimumAccess(
	level: AccessLevel,
	minimum: AccessLevel,
): boolean {
	return ACCESS_RANK[level] >= ACCESS_RANK[minimum];
}
