"use client";

import { ACCESS_RANK, type AccessLevel } from "@/lib/access";

interface AccessGateProps {
	/** The visitor's access level for the resource (from server via getAccess()). */
	level: AccessLevel;
	/** Minimum level required to show children. Defaults to "customer". */
	minimum?: AccessLevel;
	/** Content shown when access is sufficient. */
	children: React.ReactNode;
	/** Optional fallback when access is insufficient. */
	fallback?: React.ReactNode;
}

/**
 * Conditionally render content by the visitor's access level. The level is
 * passed from a server component (always fresh from access.check), mirroring
 * whop-saas-starter's <PlanGate>.
 *
 * @example
 * <AccessGate level={access.accessLevel} minimum="customer" fallback={<Upgrade />}>
 *   <MembersOnlyContent />
 * </AccessGate>
 */
export function AccessGate({
	level,
	minimum = "customer",
	children,
	fallback = null,
}: AccessGateProps) {
	if (ACCESS_RANK[level] >= ACCESS_RANK[minimum]) return <>{children}</>;
	return <>{fallback}</>;
}
